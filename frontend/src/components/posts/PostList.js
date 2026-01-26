// List of posts component

import { PostCard, attachPostCardEvents } from './PostCard.js';
import { attachAudioPlayerEvents } from './AudioPlayer.js';
import { Loading } from '../common/Loading.js';
import { EmptyState } from '../common/EmptyState.js';

export function PostList(posts, emptyMessage = 'No posts yet') {
  if (!posts || posts.length === 0) {
    return EmptyState({
      iconName: 'radio',
      title: 'No posts',
      message: emptyMessage
    });
  }

  return `
    <div class="post-list">
      ${posts.map(post => PostCard(post)).join('')}
    </div>
  `;
}

export function PostListLoading() {
  return Loading();
}

export function attachPostListEvents(container) {
  attachPostCardEvents(container);
  attachAudioPlayerEvents(container);
}
