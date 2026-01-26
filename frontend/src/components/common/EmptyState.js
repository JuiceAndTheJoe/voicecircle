// Empty state placeholder component

import { icon } from '../../utils/icons.js';

export function EmptyState({ iconName = 'info', title, message, action }) {
  return `
    <div class="empty-state">
      ${icon(iconName, 64)}
      <h3>${title}</h3>
      <p>${message}</p>
      ${action ? `<div style="margin-top: 1rem">${action}</div>` : ''}
    </div>
  `;
}
