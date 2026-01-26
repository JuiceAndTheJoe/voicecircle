// Toast notification system

let toastId = 0;

export function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const id = ++toastId;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.id = `toast-${id}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button class="btn-icon" onclick="this.parentElement.remove()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;

  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  return id;
}

export function hideToast(id) {
  const toast = document.getElementById(`toast-${id}`);
  if (toast) {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }
}

export function showSuccess(message) {
  return showToast(message, 'success');
}

export function showError(message) {
  return showToast(message, 'error', 5000);
}

export function showWarning(message) {
  return showToast(message, 'warning');
}
