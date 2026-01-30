// Settings page - Edit profile

import { usersApi, uploadApi } from '../services/api.js';
import { authState, updateCurrentUser } from '../services/auth.js';
import { Avatar } from '../components/common/Avatar.js';
import { Loading } from '../components/common/Loading.js';
import { showSuccess, showError } from '../components/common/Toast.js';
import { icon } from '../utils/icons.js';
import { navigate } from '../router.js';

export async function SettingsPage() {
  const user = authState.user;

  if (!user) {
    return `<div class="settings-page">${Loading()}</div>`;
  }

  return `
    <div class="settings-page">
      <div class="page-header">
        <h1>Edit Profile</h1>
      </div>

      <form id="settingsForm" class="settings-form">
        <div class="settings-avatar-section">
          <div class="settings-avatar">
            ${Avatar({ user, size: 'xl' })}
          </div>
          <div class="settings-avatar-upload">
            <input type="file" id="avatarInput" accept="image/*" hidden>
            <button type="button" id="changeAvatarBtn" class="btn btn-secondary btn-sm">
              ${icon('edit', 16)} Change Avatar
            </button>
          </div>
        </div>

        <div class="form-group">
          <label for="displayName">Display Name</label>
          <input
            type="text"
            id="displayName"
            name="displayName"
            value="${escapeAttr(user.displayName || '')}"
            placeholder="Your display name"
            maxlength="50"
          >
        </div>

        <div class="form-group">
          <label for="username">Username</label>
          <input
            type="text"
            id="username"
            value="@${escapeAttr(user.username)}"
            disabled
          >
          <small class="form-hint">Username cannot be changed</small>
        </div>

        <div class="form-group">
          <label for="bio">Bio</label>
          <textarea
            id="bio"
            name="bio"
            rows="3"
            placeholder="Tell us about yourself"
            maxlength="200"
          >${escapeHtml(user.bio || '')}</textarea>
          <small class="form-hint"><span id="bioCount">${(user.bio || '').length}</span>/200</small>
        </div>

        <div class="form-actions">
          <button type="button" id="cancelBtn" class="btn btn-secondary">Cancel</button>
          <button type="submit" class="btn btn-primary">
            ${icon('check', 16)} Save Changes
          </button>
        </div>
      </form>
    </div>
  `;
}

export function attachSettingsPageEvents(container) {
  const form = container.querySelector('#settingsForm');
  const avatarInput = container.querySelector('#avatarInput');
  const changeAvatarBtn = container.querySelector('#changeAvatarBtn');
  const cancelBtn = container.querySelector('#cancelBtn');
  const bioTextarea = container.querySelector('#bio');
  const bioCount = container.querySelector('#bioCount');

  if (!form) return;

  // Bio character count
  bioTextarea?.addEventListener('input', () => {
    bioCount.textContent = bioTextarea.value.length;
  });

  // Avatar upload
  changeAvatarBtn?.addEventListener('click', () => {
    avatarInput.click();
  });

  avatarInput?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('Image must be less than 5MB');
      return;
    }

    try {
      changeAvatarBtn.disabled = true;
      changeAvatarBtn.innerHTML = `${icon('loading', 16)} Uploading...`;

      const { url } = await uploadApi.uploadFile(file, 'avatar');

      // Update profile with new avatar
      const { user } = await usersApi.updateProfile({ avatarUrl: url });
      updateCurrentUser(user);

      // Update avatar display
      const avatarEl = container.querySelector('.settings-avatar');
      if (avatarEl) {
        avatarEl.innerHTML = Avatar({ user, size: 'xl' });
      }

      showSuccess('Avatar updated');
    } catch (error) {
      showError(error.message || 'Failed to upload avatar');
    } finally {
      changeAvatarBtn.disabled = false;
      changeAvatarBtn.innerHTML = `${icon('edit', 16)} Change Avatar`;
    }
  });

  // Cancel button
  cancelBtn?.addEventListener('click', () => {
    const userId = authState.user?._id;
    if (userId) {
      navigate(`/profile/${userId}`);
    } else {
      navigate('/');
    }
  });

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `${icon('loading', 16)} Saving...`;

      const updates = {
        displayName: formData.get('displayName'),
        bio: formData.get('bio'),
      };

      const { user } = await usersApi.updateProfile(updates);
      updateCurrentUser(user);

      showSuccess('Profile updated');
      navigate(`/profile/${user._id}`);
    } catch (error) {
      showError(error.message || 'Failed to update profile');
      submitBtn.disabled = false;
      submitBtn.innerHTML = `${icon('check', 16)} Save Changes`;
    }
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeAttr(text) {
  return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
