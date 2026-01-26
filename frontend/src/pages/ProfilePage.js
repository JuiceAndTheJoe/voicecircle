// Profile page

import { usersApi, postsApi } from '../services/api.js';
import { authState } from '../services/auth.js';
import { Avatar } from '../components/common/Avatar.js';
import { Loading } from '../components/common/Loading.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { FollowButton, attachFollowButtonEvents } from '../components/users/FollowButton.js';
import { PostList, attachPostListEvents } from '../components/posts/PostList.js';
import { showError } from '../components/common/Toast.js';
import { icon } from '../utils/icons.js';

export async function ProfilePage({ id }) {
  return `
    <div class="profile-page">
      <div id="profileContent">
        ${Loading()}
      </div>
    </div>
  `;
}

export async function attachProfilePageEvents(container, { id }) {
  const content = container.querySelector('#profileContent');
  if (!content) return;

  try {
    // Load user data
    const { user, isFollowing } = await usersApi.getById(id);
    const { posts } = await postsApi.getByUser(id, { limit: 20 });

    const isOwnProfile = authState.user?._id === user._id;

    content.innerHTML = `
      <div class="profile-header">
        <div class="profile-avatar">
          ${Avatar({ user, size: 'xl', showOnline: true })}
        </div>
        <div class="profile-info">
          <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
            <h1 class="profile-name">${user.displayName || user.username}</h1>
            ${isOwnProfile
              ? `<a href="#/settings" class="btn btn-secondary btn-sm">${icon('edit', 16)} Edit Profile</a>`
              : FollowButton({ userId: user._id, isFollowing })
            }
          </div>
          <p class="profile-username">@${user.username}</p>
          ${user.bio ? `<p class="profile-bio">${escapeHtml(user.bio)}</p>` : ''}
          <div class="profile-stats">
            <div class="profile-stat">
              <div class="profile-stat-value">${user.postsCount || 0}</div>
              <div class="profile-stat-label">Posts</div>
            </div>
            <div class="profile-stat">
              <div class="profile-stat-value">${user.followersCount || 0}</div>
              <div class="profile-stat-label">Followers</div>
            </div>
            <div class="profile-stat">
              <div class="profile-stat-value">${user.followingCount || 0}</div>
              <div class="profile-stat-label">Following</div>
            </div>
          </div>
        </div>
      </div>

      <div class="tabs">
        <button class="tab active" data-tab="posts">Posts</button>
        <button class="tab" data-tab="likes">Likes</button>
      </div>

      <div id="profilePosts">
        ${PostList(posts, 'No posts yet')}
      </div>
    `;

    attachFollowButtonEvents(content);
    attachPostListEvents(content);

    // Tab switching
    const tabs = content.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        // TODO: Load different content based on tab
      });
    });
  } catch (error) {
    showError(error.message || 'Failed to load profile');
    content.innerHTML = EmptyState({
      iconName: 'user',
      title: 'Profile not found',
      message: 'This user may not exist or there was an error loading the profile.',
      action: `<a href="#/explore" class="btn btn-primary">Explore</a>`
    });
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
