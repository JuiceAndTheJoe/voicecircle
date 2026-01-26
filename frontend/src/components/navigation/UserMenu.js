// User menu dropdown component

import { Avatar } from '../common/Avatar.js';
import { icon } from '../../utils/icons.js';
import { logout } from '../../services/auth.js';
import { navigate } from '../../router.js';

export function UserMenu(user) {
  return `
    <div class="user-menu">
      <button class="user-menu-trigger" id="userMenuTrigger">
        ${Avatar({ user, size: 'sm' })}
        <span style="color: var(--text-primary)">${user.displayName || user.username}</span>
        ${icon('chevronDown', 16)}
      </button>
      <div class="user-menu-dropdown" id="userMenuDropdown">
        <a href="#/profile/${user._id}" class="user-menu-item">
          ${icon('user', 18)}
          <span>Profile</span>
        </a>
        <a href="#/settings" class="user-menu-item">
          ${icon('settings', 18)}
          <span>Settings</span>
        </a>
        <div class="user-menu-divider"></div>
        <button class="user-menu-item danger" id="logoutBtn">
          ${icon('logOut', 18)}
          <span>Log out</span>
        </button>
      </div>
    </div>
  `;
}

export function attachUserMenuEvents(container) {
  const trigger = container.querySelector('#userMenuTrigger');
  const dropdown = container.querySelector('#userMenuDropdown');
  const logoutBtn = container.querySelector('#logoutBtn');

  if (trigger && dropdown) {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
        dropdown.classList.remove('open');
      }
    });

    // Close dropdown when clicking a link
    dropdown.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        dropdown.classList.remove('open');
      });
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await logout();
      navigate('/login');
    });
  }
}
