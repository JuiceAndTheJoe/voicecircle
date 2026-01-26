// Hash-based SPA Router

import { authState } from './services/auth.js';

const routes = {};
let currentRoute = null;
let notFoundHandler = null;

export function registerRoute(path, config) {
  routes[path] = config;
}

export function registerNotFound(handler) {
  notFoundHandler = handler;
}

export function navigate(path) {
  window.location.hash = path.startsWith('#') ? path : `#${path}`;
}

export function getCurrentPath() {
  const hash = window.location.hash || '#/';
  return hash.slice(1) || '/';
}

function matchRoute(path) {
  // First try exact match
  if (routes[path]) {
    return { route: routes[path], params: {} };
  }

  // Try parameterized routes
  for (const [pattern, config] of Object.entries(routes)) {
    const paramNames = [];
    const regexPattern = pattern.replace(/:([^/]+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });

    const regex = new RegExp(`^${regexPattern}$`);
    const match = path.match(regex);

    if (match) {
      const params = {};
      paramNames.forEach((name, i) => {
        params[name] = match[i + 1];
      });
      return { route: config, params };
    }
  }

  return null;
}

async function handleRouteChange() {
  const path = getCurrentPath();
  const matched = matchRoute(path);

  if (!matched) {
    if (notFoundHandler) {
      await notFoundHandler();
    }
    return;
  }

  const { route, params } = matched;

  // Check auth requirements
  if (route.auth && !authState.isAuthenticated) {
    navigate('/login');
    return;
  }

  // Check guest-only routes (like login/register)
  if (route.guestOnly && authState.isAuthenticated) {
    navigate('/');
    return;
  }

  // Update active nav links
  updateNavLinks(path);

  // Render the page
  const mainContent = document.getElementById('mainContent');
  if (mainContent && route.page) {
    currentRoute = route;
    try {
      const html = await route.page(params);
      mainContent.innerHTML = html;

      // Call attach events if defined
      if (route.attachEvents) {
        route.attachEvents(mainContent, params);
      }
    } catch (error) {
      console.error('Error rendering page:', error);
      mainContent.innerHTML = `
        <div class="empty-state">
          <h3>Something went wrong</h3>
          <p>${error.message}</p>
        </div>
      `;
    }
  }
}

function updateNavLinks(path) {
  // Update desktop nav links
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    const href = link.getAttribute('href')?.slice(1) || '/';
    link.classList.toggle('active', href === path || (path.startsWith(href) && href !== '/'));
  });

  // Update mobile nav links
  const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
  mobileNavItems.forEach(item => {
    const href = item.getAttribute('href')?.slice(1) || '/';
    item.classList.toggle('active', href === path || (path.startsWith(href) && href !== '/'));
  });
}

export function initRouter() {
  // Handle initial route
  handleRouteChange();

  // Handle hash changes
  window.addEventListener('hashchange', handleRouteChange);

  // Handle link clicks for internal navigation
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (link) {
      // Let the browser handle the hash change naturally
      return;
    }
  });
}

export function onRouteChange(callback) {
  window.addEventListener('hashchange', () => callback(getCurrentPath()));
}

export { routes };
