// Post composer component

import { icon } from '../../utils/icons.js';
import { AudioRecorder, attachAudioRecorderEvents } from './AudioRecorder.js';
import { postsApi, uploadApi } from '../../services/api.js';
import { showError, showSuccess } from '../common/Toast.js';

export function PostComposer() {
  return `
    <div class="card post-composer" style="margin-bottom: 1.5rem;">
      <div class="card-body">
        <div class="form-group">
          <textarea class="form-input" id="postContent" placeholder="What's on your mind?" rows="3" maxlength="500"></textarea>
          <div style="display: flex; justify-content: space-between; margin-top: 0.5rem;">
            <span class="char-count" style="color: var(--text-muted); font-size: 0.75rem;">
              <span id="charCount">0</span>/500
            </span>
          </div>
        </div>

        <div class="post-type-tabs" style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
          <button class="btn btn-secondary btn-sm post-type-btn active" data-type="text">
            ${icon('edit', 16)} Text
          </button>
          <button class="btn btn-secondary btn-sm post-type-btn" data-type="voice">
            ${icon('mic', 16)} Voice
          </button>
        </div>

        <div id="voiceRecorderSection" style="display: none;">
          ${AudioRecorder()}
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem;">
          <button class="btn btn-secondary" id="cancelPostBtn">Cancel</button>
          <button class="btn btn-primary" id="submitPostBtn">
            ${icon('send', 16)} Post
          </button>
        </div>
      </div>
    </div>
  `;
}

export function attachPostComposerEvents(container, onSuccess) {
  const contentInput = container.querySelector('#postContent');
  const charCount = container.querySelector('#charCount');
  const typeButtons = container.querySelectorAll('.post-type-btn');
  const voiceSection = container.querySelector('#voiceRecorderSection');
  const cancelBtn = container.querySelector('#cancelPostBtn');
  const submitBtn = container.querySelector('#submitPostBtn');

  let postType = 'text';
  let audioBlob = null;
  let audioDuration = 0;
  let cleanupRecorder = null;

  // Character count
  contentInput.addEventListener('input', () => {
    charCount.textContent = contentInput.value.length;
  });

  // Type switching
  typeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      typeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      postType = btn.dataset.type;

      if (postType === 'voice') {
        voiceSection.style.display = 'block';
        cleanupRecorder = attachAudioRecorderEvents(voiceSection, ({ blob, duration }) => {
          audioBlob = blob;
          audioDuration = duration;
        });
      } else {
        voiceSection.style.display = 'none';
        audioBlob = null;
        audioDuration = 0;
        if (cleanupRecorder) {
          cleanupRecorder();
          cleanupRecorder = null;
        }
      }
    });
  });

  // Cancel
  cancelBtn.addEventListener('click', () => {
    if (cleanupRecorder) {
      cleanupRecorder();
    }
    if (onSuccess) {
      onSuccess(null);
    }
  });

  // Submit
  submitBtn.addEventListener('click', async () => {
    const content = contentInput.value.trim();

    if (postType === 'text' && !content) {
      showError('Please write something');
      return;
    }

    if (postType === 'voice' && !audioBlob && !content) {
      showError('Please record audio or write something');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Posting...';

      let mediaUrl = null;

      // Upload audio if present
      if (audioBlob) {
        const file = new File([audioBlob], 'recording.webm', { type: audioBlob.type });
        const uploadResult = await uploadApi.uploadFile(file, 'audio');
        mediaUrl = uploadResult.url;
      }

      // Create post
      await postsApi.create({
        type: postType,
        content,
        mediaUrl,
        mediaDuration: audioBlob ? audioDuration : null
      });

      showSuccess('Post created!');

      if (cleanupRecorder) {
        cleanupRecorder();
      }

      if (onSuccess) {
        onSuccess(true);
      }
    } catch (error) {
      showError(error.message || 'Failed to create post');
      submitBtn.disabled = false;
      submitBtn.innerHTML = `${icon('send', 16)} Post`;
    }
  });
}
