// Login page

import { login } from '../services/auth.js';
import { navigate } from '../router.js';
import { showError } from '../components/common/Toast.js';

export async function LoginPage() {
  return `
    <div class="auth-page">
      <div class="auth-card card">
        <div class="card-body">
          <h1 style="text-align: center; margin-bottom: 0.5rem;">Welcome back</h1>
          <p style="text-align: center; color: var(--text-muted); margin-bottom: 1.5rem;">
            Sign in to your VoiceCircle account
          </p>
          <form id="loginForm">
            <div class="form-group">
              <label class="form-label" for="email">Email</label>
              <input type="email" id="email" name="email" class="form-input" placeholder="Enter your email" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="password">Password</label>
              <input type="password" id="password" name="password" class="form-input" placeholder="Enter your password" required>
            </div>
            <button type="submit" class="btn btn-primary btn-lg" style="width: 100%; margin-top: 0.5rem;">
              Sign in
            </button>
          </form>
          <p style="text-align: center; margin-top: 1.5rem; color: var(--text-secondary);">
            Don't have an account? <a href="#/register" style="color: var(--primary)">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  `;
}

export function attachLoginPageEvents(container) {
  const form = container.querySelector('#loginForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const email = form.email.value.trim();
      const password = form.password.value;

      if (!email || !password) {
        showError('Please fill in all fields');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';

        await login(email, password);
        navigate('/');
      } catch (error) {
        showError(error.message || 'Login failed');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign in';
      }
    });
  }
}
