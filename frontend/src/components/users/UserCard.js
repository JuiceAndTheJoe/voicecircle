// User card component

import { Avatar } from '../common/Avatar.js';
import { FollowButton } from './FollowButton.js';
import { authState } from '../../services/auth.js';

export function UserCard({ user, isFollowing = false, showFollow = true }) {
  const isOwnProfile = authState.user?._id === user._id;

  return `
    <div class="user-card card" style="padding: 1rem;">
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        ${Avatar({ user, clickable: true, showOnline: true })}
        <div style="flex: 1;">
          <a href="#/profile/${user._id}" class="post-author-name" style="display: block;">${user.displayName || user.username}</a>
          <span class="post-author-username">@${user.username}</span>
        </div>
        ${showFollow && !isOwnProfile ? FollowButton({ userId: user._id, isFollowing }) : ''}
      </div>
    </div>
  `;
}
