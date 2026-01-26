// Explore page - Public posts

import { postsApi } from '../services/api.js';
import { PostList, PostListLoading, attachPostListEvents } from '../components/posts/PostList.js';
import { showError } from '../components/common/Toast.js';

let posts = [];
let loading = true;

export async function ExplorePage() {
  loading = true;

  // Return loading state initially
  setTimeout(loadPosts, 0);

  return `
    <div class="explore-page">
      <div class="page-header" style="margin-bottom: 1.5rem;">
        <h1>Explore</h1>
        <p style="color: var(--text-muted)">Discover voice posts from the community</p>
      </div>
      <div id="exploreContent">
        ${PostListLoading()}
      </div>
    </div>
  `;
}

async function loadPosts() {
  const content = document.getElementById('exploreContent');
  if (!content) return;

  try {
    const response = await postsApi.getExplore({ limit: 20 });
    posts = response.posts || [];
    loading = false;

    content.innerHTML = PostList(posts, 'No posts yet. Be the first to share your voice!');
    attachPostListEvents(content);
  } catch (error) {
    showError(error.message || 'Failed to load posts');
    content.innerHTML = `
      <div class="empty-state">
        <h3>Failed to load posts</h3>
        <p>${error.message}</p>
        <button class="btn btn-primary" onclick="location.reload()">Try again</button>
      </div>
    `;
  }
}

export function attachExplorePageEvents(container) {
  // Events are attached when posts are loaded
}
