// Home page - Authenticated feed

import { postsApi } from '../services/api.js';
import { authState } from '../services/auth.js';
import { PostList, PostListLoading, attachPostListEvents } from '../components/posts/PostList.js';
import { PostComposer, attachPostComposerEvents } from '../components/posts/PostComposer.js';
import { showError } from '../components/common/Toast.js';
import { icon } from '../utils/icons.js';

let posts = [];

export async function HomePage() {
  setTimeout(loadFeed, 0);

  return `
    <div class="home-page">
      <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h1>Home</h1>
          <p style="color: var(--text-muted)">Your personalized feed</p>
        </div>
        <button class="btn btn-primary" id="createPostBtn">
          ${icon('plus', 20)}
          <span>New Post</span>
        </button>
      </div>
      <div id="postComposerContainer"></div>
      <div id="feedContent">
        ${PostListLoading()}
      </div>
    </div>
  `;
}

async function loadFeed() {
  const content = document.getElementById('feedContent');
  if (!content) return;

  try {
    const response = await postsApi.getFeed({ limit: 20 });
    posts = response.posts || [];

    const emptyMessage = 'Your feed is empty. Follow some users or explore to find content!';
    content.innerHTML = PostList(posts, emptyMessage);
    attachPostListEvents(content);
  } catch (error) {
    showError(error.message || 'Failed to load feed');
    content.innerHTML = `
      <div class="empty-state">
        <h3>Failed to load feed</h3>
        <p>${error.message}</p>
        <button class="btn btn-primary" onclick="location.reload()">Try again</button>
      </div>
    `;
  }
}

export function attachHomePageEvents(container) {
  const createPostBtn = container.querySelector('#createPostBtn');
  const composerContainer = container.querySelector('#postComposerContainer');

  if (createPostBtn && composerContainer) {
    createPostBtn.addEventListener('click', () => {
      if (composerContainer.innerHTML) {
        composerContainer.innerHTML = '';
      } else {
        composerContainer.innerHTML = PostComposer();
        attachPostComposerEvents(composerContainer, () => {
          composerContainer.innerHTML = '';
          loadFeed(); // Refresh feed after posting
        });
      }
    });
  }
}
