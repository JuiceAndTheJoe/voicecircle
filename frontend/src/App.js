// App entry point - Initialize auth, router, navigation

import { initAuth, onAuthChange, authState } from './services/auth.js';
import { registerRoute, registerNotFound, initRouter, navigate } from './router.js';
import { initNavbar } from './components/navigation/Navbar.js';
import { initMobileNav } from './components/navigation/MobileNav.js';
import { EmptyState } from './components/common/EmptyState.js';

// Import pages
import { HomePage, attachHomePageEvents } from './pages/HomePage.js';
import { ExplorePage, attachExplorePageEvents } from './pages/ExplorePage.js';
import { RoomsPage, attachRoomsPageEvents } from './pages/RoomsPage.js';
import { RoomPage, attachRoomPageEvents } from './pages/RoomPage.js';
import { ProfilePage, attachProfilePageEvents } from './pages/ProfilePage.js';
import { LoginPage, attachLoginPageEvents } from './pages/LoginPage.js';
import { RegisterPage, attachRegisterPageEvents } from './pages/RegisterPage.js';

// Register routes
registerRoute('/', {
  page: HomePage,
  attachEvents: attachHomePageEvents,
  auth: true
});

registerRoute('/explore', {
  page: ExplorePage,
  attachEvents: attachExplorePageEvents,
  auth: false
});

registerRoute('/rooms', {
  page: RoomsPage,
  attachEvents: attachRoomsPageEvents,
  auth: false
});

registerRoute('/rooms/:id', {
  page: RoomPage,
  attachEvents: attachRoomPageEvents,
  auth: true
});

registerRoute('/profile/:id', {
  page: ProfilePage,
  attachEvents: attachProfilePageEvents,
  auth: false
});

registerRoute('/login', {
  page: LoginPage,
  attachEvents: attachLoginPageEvents,
  guestOnly: true
});

registerRoute('/register', {
  page: RegisterPage,
  attachEvents: attachRegisterPageEvents,
  guestOnly: true
});

// Register 404 handler
registerNotFound(() => {
  const mainContent = document.getElementById('mainContent');
  if (mainContent) {
    mainContent.innerHTML = EmptyState({
      iconName: 'alert',
      title: 'Page not found',
      message: 'The page you are looking for does not exist.',
      action: `<a href="#/" class="btn btn-primary">Go Home</a>`
    });
  }
});

// Initialize app
async function initApp() {
  // Initialize auth first
  await initAuth();

  // Initialize navigation
  initNavbar();
  initMobileNav();

  // Initialize router (will render initial page)
  initRouter();

  // Re-route when auth state changes
  onAuthChange((state) => {
    const hash = window.location.hash.slice(1) || '/';

    // If logged in on login/register page, redirect to home
    if (state.isAuthenticated && (hash === '/login' || hash === '/register')) {
      navigate('/');
    }

    // If logged out on protected page, redirect to login
    if (!state.isAuthenticated && !state.isLoading) {
      const protectedPaths = ['/', '/rooms/'];
      const isProtected = protectedPaths.some(p =>
        hash === p || (p.endsWith('/') && hash.startsWith(p))
      );

      // Special case: /rooms is public, /rooms/:id is protected
      if (hash.match(/^\/rooms\/[^\/]+$/)) {
        navigate('/login');
      }
    }
  });

  console.log('VoiceCircle initialized');
}

// Start the app
initApp().catch(console.error);
