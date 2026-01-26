// Navbar component - Update based on auth state

import { authState, onAuthChange } from '../../services/auth.js';
import { UserMenu, attachUserMenuEvents } from './UserMenu.js';

export function renderNavActions() {
  const navActions = document.getElementById('navActions');
  if (!navActions) return;

  if (authState.isLoading) {
    navActions.innerHTML = '';
    return;
  }

  if (authState.isAuthenticated && authState.user) {
    navActions.innerHTML = UserMenu(authState.user);
    attachUserMenuEvents(navActions);
  } else {
    navActions.innerHTML = `
      <a href="#/login" class="btn btn-secondary">Log in</a>
      <a href="#/register" class="btn btn-primary">Sign up</a>
    `;
  }
}

export function initNavbar() {
  renderNavActions();
  onAuthChange(renderNavActions);
}
