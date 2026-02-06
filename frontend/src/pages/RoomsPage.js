// Rooms listing page

import { roomsApi } from '../services/api.js';
import { authState } from '../services/auth.js';
import { RoomCard, attachRoomCardEvents } from '../components/rooms/RoomCard.js';
import { Loading } from '../components/common/Loading.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { showError } from '../components/common/Toast.js';
import { openModal, closeModal } from '../components/common/Modal.js';
import { icon } from '../utils/icons.js';
import { navigate } from '../router.js';

export async function RoomsPage() {
  return `
    <div class="rooms-page">
      <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h1>Live Rooms</h1>
          <p style="color: var(--text-muted)">Join live video conversations</p>
        </div>
        ${authState.isAuthenticated ? `
          <button class="btn btn-primary" id="createRoomBtn">
            ${icon('plus', 20)}
            <span>Start Room</span>
          </button>
        ` : ''}
      </div>
      <div id="roomsContent">
        ${Loading()}
      </div>
    </div>
  `;
}

export function attachRoomsPageEvents(container) {
  loadRooms(container);

  const createRoomBtn = container.querySelector('#createRoomBtn');
  if (createRoomBtn) {
    createRoomBtn.addEventListener('click', () => {
      openCreateRoomModal();
    });
  }
}

async function loadRooms(container) {
  const content = container.querySelector('#roomsContent');
  if (!content) return;

  try {
    const { rooms } = await roomsApi.getAll();

    if (!rooms || rooms.length === 0) {
      content.innerHTML = EmptyState({
        iconName: 'users',
        title: 'No live rooms',
        message: 'Be the first to start a conversation!',
        action: authState.isAuthenticated
          ? `<button class="btn btn-primary" onclick="document.getElementById('createRoomBtn')?.click()">Start a Room</button>`
          : `<a href="#/login" class="btn btn-primary">Sign in to start a room</a>`
      });
      return;
    }

    content.innerHTML = `
      <div class="rooms-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">
        ${rooms.map(room => RoomCard(room)).join('')}
      </div>
    `;

    attachRoomCardEvents(content);
  } catch (error) {
    showError(error.message || 'Failed to load rooms');
    content.innerHTML = EmptyState({
      iconName: 'alert',
      title: 'Failed to load rooms',
      message: error.message,
      action: `<button class="btn btn-primary" onclick="location.reload()">Try again</button>`
    });
  }
}

function openCreateRoomModal() {
  const html = `
    <div class="modal-overlay" id="createRoomModal">
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">Start a Video Room</h2>
          <button class="modal-close" id="closeCreateRoom">
            ${icon('x', 20)}
          </button>
        </div>
        <div class="modal-body">
          <form id="createRoomForm">
            <div class="form-group">
              <label class="form-label" for="roomName">Room name</label>
              <input type="text" id="roomName" name="name" class="form-input" placeholder="What's your room about?" required maxlength="100">
            </div>
            <div class="form-group">
              <label class="form-label" for="roomDescription">Description (optional)</label>
              <textarea id="roomDescription" name="description" class="form-input" placeholder="Add more details about your room" rows="3" maxlength="500"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label" for="videoQuality">Video Quality</label>
              <select id="videoQuality" name="videoQuality" class="form-input">
                <option value="480p">480p (Standard)</option>
                <option value="720p" selected>720p (HD)</option>
                <option value="1080p">1080p (Full HD)</option>
              </select>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="cancelCreateRoom">Cancel</button>
          <button class="btn btn-primary" id="submitCreateRoom">
            ${icon('video', 16)} Go Live
          </button>
        </div>
      </div>
    </div>
  `;

  const container = document.getElementById('modals');
  container.innerHTML = html;

  const modal = container.querySelector('#createRoomModal');
  const closeBtn = container.querySelector('#closeCreateRoom');
  const cancelBtn = container.querySelector('#cancelCreateRoom');
  const submitBtn = container.querySelector('#submitCreateRoom');
  const form = container.querySelector('#createRoomForm');

  const close = () => {
    container.innerHTML = '';
  };

  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });
  closeBtn.addEventListener('click', close);
  cancelBtn.addEventListener('click', close);

  submitBtn.addEventListener('click', async () => {
    const name = form.roomName.value.trim();
    const description = form.roomDescription.value.trim();
    const videoQuality = form.videoQuality.value;

    if (!name) {
      showError('Please enter a room name');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating...';

      const { room } = await roomsApi.create({ name, description, videoQuality });
      close();
      navigate(`/rooms/${room._id}`);
    } catch (error) {
      showError(error.message || 'Failed to create room');
      submitBtn.disabled = false;
      submitBtn.innerHTML = `${icon('video', 16)} Go Live`;
    }
  });
}
