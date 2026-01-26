// Registration page

import { register } from '../services/auth.js';
import { navigate } from '../router.js';
import { showError } from '../components/common/Toast.js';

export async function RegisterPage() {
  return `
    <div class="auth-page">
      <div class="auth-card card">
        <div class="card-body">
          <h1 style="text-align: center; margin-bottom: 0.5rem;">Create account</h1>
          <p style="text-align: center; color: var(--text-muted); margin-bottom: 1.5rem;">
            Join VoiceCircle and start connecting
          </p>
          <form id="registerForm">
            <div class="form-group">
              <label class="form-label" for="username">Username</label>
              <input type="text" id="username" name="username" class="form-input" placeholder="Choose a username" required minlength="3" maxlength="30" pattern="[a-zA-Z0-9_]+">
              <small style="color: var(--text-muted); font-size: 0.75rem;">Letters, numbers, and underscores only</small>
            </div>
            <div class="form-group">
              <label class="form-label" for="displayName">Display name</label>
              <input type="text" id="displayName" name="displayName" class="form-input" placeholder="Your display name" maxlength="50">
            </div>
            <div class="form-group">
              <label class="form-label" for="email">Email</label>
              <input type="email" id="email" name="email" class="form-input" placeholder="Enter your email" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="password">Password</label>
              <input type="password" id="password" name="password" class="form-input" placeholder="Choose a password" required minlength="6">
              <small style="color: var(--text-muted); font-size: 0.75rem;">At least 6 characters</small>
            </div>
            <button type="submit" class="btn btn-primary btn-lg" style="width: 100%; margin-top: 0.5rem;">
              Create account
            </button>
          </form>
          <p style="text-align: center; margin-top: 1.5rem; color: var(--text-secondary);">
            Already have an account? <a href="#/login" style="color: var(--primary)">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  `;
}

export function attachRegisterPageEvents(container) {
  const form = container.querySelector('#registerForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const username = form.username.value.trim();
      const displayName = form.displayName.value.trim();
      const email = form.email.value.trim();
      const password = form.password.value;

      if (!username || !email || !password) {
        showError('Please fill in all required fields');
        return;
      }

      if (username.length < 3) {
        showError('Username must be at least 3 characters');
        return;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showError('Username can only contain letters, numbers, and underscores');
        return;
      }

      if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';

        await register({
          username,
          displayName: displayName || username,
          email,
          password
        });
        navigate('/');
      } catch (error) {
        showError(error.message || 'Registration failed');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create account';
      }
    });
  }
}
