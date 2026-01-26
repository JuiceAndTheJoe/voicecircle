// Avatar component

export function Avatar({ user, size = 'default', showOnline = false, clickable = false }) {
  const sizeClass = size === 'sm' ? 'avatar-sm' : size === 'lg' ? 'avatar-lg' : size === 'xl' ? 'avatar-xl' : '';
  const initial = (user?.displayName || user?.username || '?')[0].toUpperCase();
  const href = clickable ? `href="#/profile/${user?._id}"` : '';

  const avatarContent = user?.avatarUrl
    ? `<img src="${user.avatarUrl}" alt="${user.displayName || user.username}">`
    : initial;

  const onlineIndicator = showOnline && user?.online
    ? '<span class="online-indicator"></span>'
    : '';

  const wrapper = clickable ? 'a' : 'div';

  return `
    <${wrapper} ${href} class="avatar ${sizeClass}" style="position: relative">
      ${avatarContent}
      ${onlineIndicator}
    </${wrapper}>
  `;
}

export function AvatarGroup({ users, max = 3, size = 'sm' }) {
  const displayed = users.slice(0, max);
  const remaining = users.length - max;

  return `
    <div class="avatars">
      ${displayed.map(user => Avatar({ user, size })).join('')}
      ${remaining > 0 ? `<div class="avatar avatar-sm" style="background: var(--bg-tertiary)">+${remaining}</div>` : ''}
    </div>
  `;
}
