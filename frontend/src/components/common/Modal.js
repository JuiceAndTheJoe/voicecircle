// Modal dialog component

import { icon } from '../../utils/icons.js';

let modalId = 0;

export function Modal({ title, content, footer, size = 'default', onClose }) {
  const id = ++modalId;
  const sizeClass = size === 'large' ? 'modal-lg' : size === 'small' ? 'modal-sm' : '';

  return `
    <div class="modal-overlay" id="modal-${id}" data-modal-id="${id}">
      <div class="modal ${sizeClass}">
        <div class="modal-header">
          <h2 class="modal-title">${title}</h2>
          <button class="modal-close" data-close-modal="${id}">
            ${icon('x', 20)}
          </button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
      </div>
    </div>
  `;
}

export function openModal(html, onClose) {
  const container = document.getElementById('modals');
  if (!container) return null;

  container.innerHTML = html;

  const modalOverlay = container.querySelector('.modal-overlay');
  if (modalOverlay) {
    // Close on overlay click
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeModal();
        if (onClose) onClose();
      }
    });

    // Close on close button click
    const closeBtn = modalOverlay.querySelector('[data-close-modal]');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        closeModal();
        if (onClose) onClose();
      });
    }

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        if (onClose) onClose();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  return modalOverlay;
}

export function closeModal() {
  const container = document.getElementById('modals');
  if (container) {
    container.innerHTML = '';
  }
}

export function ConfirmModal({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', danger = false }) {
  return Modal({
    title,
    content: `<p style="color: var(--text-secondary)">${message}</p>`,
    footer: `
      <button class="btn btn-secondary" data-action="cancel">${cancelText}</button>
      <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-action="confirm">${confirmText}</button>
    `
  });
}

export function openConfirmModal({ title, message, confirmText, cancelText, danger, onConfirm, onCancel }) {
  const html = ConfirmModal({ title, message, confirmText, cancelText, danger });
  const modal = openModal(html);

  if (modal) {
    const confirmBtn = modal.querySelector('[data-action="confirm"]');
    const cancelBtn = modal.querySelector('[data-action="cancel"]');

    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        closeModal();
        if (onConfirm) onConfirm();
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        closeModal();
        if (onCancel) onCancel();
      });
    }
  }

  return modal;
}
