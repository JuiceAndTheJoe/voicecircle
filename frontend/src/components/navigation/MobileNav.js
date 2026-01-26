// Mobile navigation component

import { authState, onAuthChange } from '../../services/auth.js';

export function updateMobileNav() {
  const mobileNav = document.getElementById('mobileNav');
  if (!mobileNav) return;

  const profileLink = mobileNav.querySelector('[data-page="profile"]');
  if (profileLink) {
    if (authState.isAuthenticated && authState.user) {
      profileLink.href = `#/profile/${authState.user._id}`;
    } else {
      profileLink.href = '#/login';
    }
  }
}

export function initMobileNav() {
  updateMobileNav();
  onAuthChange(updateMobileNav);

  // Update active states on route change
  window.addEventListener('hashchange', updateActiveState);
  updateActiveState();
}

function updateActiveState() {
  const path = window.location.hash.slice(1) || '/';
  const mobileNav = document.getElementById('mobileNav');
  if (!mobileNav) return;

  mobileNav.querySelectorAll('.mobile-nav-item').forEach(item => {
    const href = item.getAttribute('href')?.slice(1) || '/';
    const isActive = href === path || (path.startsWith(href) && href !== '/');
    item.classList.toggle('active', isActive);
  });
}
