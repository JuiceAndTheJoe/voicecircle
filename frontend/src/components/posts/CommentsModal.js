// Comments modal component

import { Modal, openModal } from '../common/Modal.js';
import { Avatar } from '../common/Avatar.js';
import { AudioPlayer } from '../posts/AudioPlayer.js';
import { icon } from '../../utils/icons.js';
import { formatRelativeTime } from '../../utils/time.js';
import { postsApi } from '../../services/api.js';
import { authState } from '../../services/auth.js';
import { showError, showSuccess } from '../common/Toast.js';

export function openCommentsModal(postId) {
  // Create modal content
  const modalHtml = Modal({
    title: 'Comments',
    content: `
      <div id="comments-container">
        <div class="loading-comments">
          <div class="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    `,
    size: 'large',
    onClose: () => {
      // Cleanup
    }
  });

  openModal(modalHtml, () => {
    // Cleanup on close
  });

  // Load post and comments
  loadComments(postId);
}

async function loadComments(postId) {
  try {
    const container = document.getElementById('comments-container');
    if (!container) return;

    // Get post details
    const { post } = await postsApi.getById(postId);
    // Get comments
    const { comments } = await postsApi.getComments(postId);

    // Render post and comments
    container.innerHTML = `
      <div class="original-post">
        ${renderPost(post)}
      </div>
      <div class="comments-section">
        <div class="comments-list" id="comments-list">
          ${comments.length > 0 ? comments.map(renderComment).join('') : '<p class="no-comments">No comments yet. Be the first!</p>'}
        </div>
        ${authState.isAuthenticated ? renderCommentForm(postId) : '<p class="login-prompt">Please log in to comment.</p>'}
      </div>
    `;

    // Attach event listeners
    attachCommentEvents(postId);
  } catch (error) {
    console.error('Failed to load comments:', error);
    const container = document.getElementById('comments-container');
    if (container) {
      container.innerHTML = '<p class="error">Failed to load comments. Please try again.</p>';
    }
  }
}

function renderPost(post) {
  const { _id, author, content, type, mediaUrl, createdAt } = post;

  const mediaContent = type === 'voice' && mediaUrl
    ? AudioPlayer({ src: mediaUrl, postId: _id })
    : '';

  return `
    <div class="post-card modal-post">
      <div class="post-header">
        ${Avatar({ user: author, clickable: false })}
        <div class="post-author">
          <span class="post-author-name">${author?.displayName || author?.username || 'Unknown'}</span>
          <span class="post-author-username">@${author?.username || 'unknown'}</span>
        </div>
        <span class="post-time">${formatRelativeTime(createdAt)}</span>
      </div>
      ${content ? `<div class="post-content">${escapeHtml(content)}</div>` : ''}
      ${mediaContent ? `<div class="post-media">${mediaContent}</div>` : ''}
    </div>
  `;
}

function renderComment(comment) {
  return `
    <div class="comment">
      <div class="comment-header">
        ${Avatar({ user: comment, clickable: false })}
        <div class="comment-author">
          <span class="comment-author-name">${comment.displayName || comment.username}</span>
          <span class="comment-time">${formatRelativeTime(comment.createdAt)}</span>
        </div>
      </div>
      <div class="comment-content">${escapeHtml(comment.content)}</div>
    </div>
  `;
}

function renderCommentForm(postId) {
  return `
    <div class="comment-form">
      <div class="form-group">
        <textarea
          class="form-input"
          id="comment-input"
          placeholder="Write a comment..."
          rows="3"
          maxlength="500"
        ></textarea>
        <div style="display: flex; justify-content: space-between; margin-top: 0.5rem;">
          <span class="char-count" style="color: var(--text-muted); font-size: 0.75rem;">
            <span id="comment-char-count">0</span>/500
          </span>
          <button class="btn btn-primary btn-sm" id="submit-comment" data-post-id="${postId}">
            ${icon('send', 16)} Comment
          </button>
        </div>
      </div>
    </div>
  `;
}

function attachCommentEvents(postId) {
  const commentInput = document.getElementById('comment-input');
  const charCount = document.getElementById('comment-char-count');
  const submitBtn = document.getElementById('submit-comment');

  if (commentInput && charCount) {
    commentInput.addEventListener('input', () => {
      charCount.textContent = commentInput.value.length;
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const content = commentInput.value.trim();
      if (!content) {
        showError('Please write something');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Posting...';

        await postsApi.addComment(postId, { content });

        showSuccess('Comment added!');

        // Reload comments
        await loadComments(postId);

      } catch (error) {
        showError(error.message || 'Failed to add comment');
        submitBtn.disabled = false;
        submitBtn.innerHTML = `${icon('send', 16)} Comment`;
      }
    });
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}