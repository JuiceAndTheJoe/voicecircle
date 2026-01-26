// Loading spinner component

export function Loading(size = 'default') {
  const sizeClass = size === 'small' ? 'spinner-sm' : '';
  return `
    <div class="loading">
      <div class="spinner ${sizeClass}"></div>
    </div>
  `;
}

export function LoadingOverlay() {
  return `
    <div class="loading-overlay">
      <div class="spinner"></div>
    </div>
  `;
}

export function LoadingButton(text, loading = false) {
  if (loading) {
    return `
      <span class="btn-loading">
        <span class="spinner-sm"></span>
        <span>${text}</span>
      </span>
    `;
  }
  return text;
}
