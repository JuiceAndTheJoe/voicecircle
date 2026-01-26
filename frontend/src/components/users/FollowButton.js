// Follow/unfollow button component

import { icon } from '../../utils/icons.js';
import { usersApi } from '../../services/api.js';
import { authState } from '../../services/auth.js';
import { showError, showSuccess } from '../common/Toast.js';
import { navigate } from '../../router.js';

export function FollowButton({ userId, isFollowing, size = 'default' }) {
  const sizeClass = size === 'sm' ? 'btn-sm' : '';

  if (isFollowing) {
    return `
      <button class="btn btn-secondary ${sizeClass}" data-follow-btn="${userId}" data-following="true">
        ${icon('userCheck', 16)}
        <span>Following</span>
      </button>
    `;
  }

  return `
    <button class="btn btn-primary ${sizeClass}" data-follow-btn="${userId}" data-following="false">
      ${icon('userPlus', 16)}
      <span>Follow</span>
    </button>
  `;
}

export function attachFollowButtonEvents(container) {
  container.querySelectorAll('[data-follow-btn]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!authState.isAuthenticated) {
        showError('Please log in to follow users');
        navigate('/login');
        return;
      }

      const userId = btn.dataset.followBtn;
      const isFollowing = btn.dataset.following === 'true';

      try {
        btn.disabled = true;

        if (isFollowing) {
          await usersApi.unfollow(userId);
          btn.dataset.following = 'false';
          btn.className = btn.className.replace('btn-secondary', 'btn-primary');
          btn.innerHTML = `${icon('userPlus', 16)}<span>Follow</span>`;
          showSuccess('Unfollowed');
        } else {
          await usersApi.follow(userId);
          btn.dataset.following = 'true';
          btn.className = btn.className.replace('btn-primary', 'btn-secondary');
          btn.innerHTML = `${icon('userCheck', 16)}<span>Following</span>`;
          showSuccess('Following');
        }
      } catch (error) {
        showError(error.message || 'Action failed');
      } finally {
        btn.disabled = false;
      }
    });
  });
}
