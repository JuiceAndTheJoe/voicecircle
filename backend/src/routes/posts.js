import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  createPost,
  getPostById,
  getPostsByUser,
  getFeedPosts,
  getAllPosts,
  updatePost,
  deletePost,
  getUserById,
  updateUser,
  getFollowing
} from '../services/database.js';
import { addNotification, getOnlineUsers } from '../services/redis.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validate, createPostRules, commentRules, paginationRules } from '../middleware/validation.js';

const router = Router();

// Get feed (posts from followed users)
router.get('/feed', authenticate, paginationRules, validate, async (req, res, next) => {
  try {
    const { limit = 20, skip = 0 } = req.query;

    // Get users the current user follows
    const following = await getFollowing(req.userId);
    const followingIds = following.map(f => f.followingId);

    // Include own posts in feed
    followingIds.push(req.userId);

    const posts = await getFeedPosts(followingIds, parseInt(limit), parseInt(skip));

    // Get authors for posts
    const authorIds = [...new Set(posts.map(p => p.userId))];
    const authors = await Promise.all(authorIds.map(id => getUserById(id)));
    const onlineUsers = await getOnlineUsers(authorIds);
    const authorsMap = {};
    authors.forEach(a => {
      if (a) {
        delete a.password;
        authorsMap[a._id] = { ...a, online: onlineUsers.includes(a._id) };
      }
    });

    const postsWithAuthors = posts.map(post => ({
      ...post,
      author: authorsMap[post.userId] || null,
      isLiked: post.likedBy?.includes(req.userId) || false
    }));

    res.json({ posts: postsWithAuthors });
  } catch (error) {
    next(error);
  }
});

// Get all posts (explore)
router.get('/explore', optionalAuth, paginationRules, validate, async (req, res, next) => {
  try {
    const { limit = 20, skip = 0 } = req.query;
    const posts = await getAllPosts(parseInt(limit), parseInt(skip));

    // Get authors
    const authorIds = [...new Set(posts.map(p => p.userId))];
    const authors = await Promise.all(authorIds.map(id => getUserById(id)));
    const onlineUsers = await getOnlineUsers(authorIds);
    const authorsMap = {};
    authors.forEach(a => {
      if (a) {
        delete a.password;
        authorsMap[a._id] = { ...a, online: onlineUsers.includes(a._id) };
      }
    });

    const postsWithAuthors = posts.map(post => ({
      ...post,
      author: authorsMap[post.userId] || null,
      isLiked: req.userId ? (post.likedBy?.includes(req.userId) || false) : false
    }));

    res.json({ posts: postsWithAuthors });
  } catch (error) {
    next(error);
  }
});

// Get single post
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const post = await getPostById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const author = await getUserById(post.userId);
    if (author) {
      delete author.password;
      const onlineUsers = await getOnlineUsers([author._id]);
      author.online = onlineUsers.includes(author._id);
    }

    res.json({
      post: {
        ...post,
        author,
        isLiked: req.userId ? (post.likedBy?.includes(req.userId) || false) : false
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get user's posts
router.get('/user/:userId', optionalAuth, paginationRules, validate, async (req, res, next) => {
  try {
    const { limit = 20, skip = 0 } = req.query;
    const posts = await getPostsByUser(req.params.userId, parseInt(limit), parseInt(skip));

    const author = await getUserById(req.params.userId);
    if (author) {
      delete author.password;
      const onlineUsers = await getOnlineUsers([author._id]);
      author.online = onlineUsers.includes(author._id);
    }

    const postsWithAuthor = posts.map(post => ({
      ...post,
      author,
      isLiked: req.userId ? (post.likedBy?.includes(req.userId) || false) : false
    }));

    res.json({ posts: postsWithAuthor });
  } catch (error) {
    next(error);
  }
});

// Create post
router.post('/', authenticate, createPostRules, validate, async (req, res, next) => {
  try {
    const { type, content, mediaUrl, mediaDuration } = req.body;

    // Validate media URL for voice posts
    if (type === 'voice' && !mediaUrl) {
      return res.status(400).json({ error: 'Media URL required for voice posts' });
    }

    const post = await createPost({
      _id: uuidv4(),
      userId: req.userId,
      type,
      content: content || '',
      mediaUrl: mediaUrl || null,
      mediaDuration: mediaDuration || null,
      likesCount: 0,
      likedBy: [],
      commentsCount: 0,
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Update user's post count
    await updateUser(req.userId, {
      postsCount: (req.user.postsCount || 0) + 1,
      updatedAt: new Date().toISOString()
    });

    res.status(201).json({
      post: {
        ...post,
        author: req.user
      }
    });
  } catch (error) {
    next(error);
  }
});

// Like/unlike post
router.post('/:id/like', authenticate, async (req, res, next) => {
  try {
    const post = await getPostById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const likedBy = post.likedBy || [];
    const isLiked = likedBy.includes(req.userId);

    let updatedPost;
    if (isLiked) {
      // Unlike
      updatedPost = await updatePost(post._id, {
        likedBy: likedBy.filter(id => id !== req.userId),
        likesCount: Math.max((post.likesCount || 1) - 1, 0),
        updatedAt: new Date().toISOString()
      });
    } else {
      // Like
      updatedPost = await updatePost(post._id, {
        likedBy: [...likedBy, req.userId],
        likesCount: (post.likesCount || 0) + 1,
        updatedAt: new Date().toISOString()
      });

      // Send notification to post author
      if (post.userId !== req.userId) {
        await addNotification(post.userId, {
          type: 'like',
          fromUserId: req.userId,
          fromUsername: req.user.username,
          postId: post._id,
          message: `${req.user.username} liked your post`
        });
      }
    }

    res.json({
      liked: !isLiked,
      likesCount: updatedPost.likesCount
    });
  } catch (error) {
    next(error);
  }
});

// Add comment
router.post('/:id/comments', authenticate, commentRules, validate, async (req, res, next) => {
  try {
    const post = await getPostById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const { content } = req.body;
    const comment = {
      id: uuidv4(),
      userId: req.userId,
      username: req.user.username,
      displayName: req.user.displayName,
      avatarUrl: req.user.avatarUrl,
      content,
      createdAt: new Date().toISOString()
    };

    const comments = post.comments || [];
    const updatedPost = await updatePost(post._id, {
      comments: [...comments, comment],
      commentsCount: (post.commentsCount || 0) + 1,
      updatedAt: new Date().toISOString()
    });

    // Send notification to post author
    if (post.userId !== req.userId) {
      await addNotification(post.userId, {
        type: 'comment',
        fromUserId: req.userId,
        fromUsername: req.user.username,
        postId: post._id,
        message: `${req.user.username} commented on your post`
      });
    }

    res.status(201).json({ comment });
  } catch (error) {
    next(error);
  }
});

// Get comments
router.get('/:id/comments', async (req, res, next) => {
  try {
    const post = await getPostById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ comments: post.comments || [] });
  } catch (error) {
    next(error);
  }
});

// Delete post
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const post = await getPostById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await deletePost(post._id);

    // Update user's post count
    await updateUser(req.userId, {
      postsCount: Math.max((req.user.postsCount || 1) - 1, 0),
      updatedAt: new Date().toISOString()
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
