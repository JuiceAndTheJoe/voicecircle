// Single post card component

import { Avatar } from "../common/Avatar.js";
import { AudioPlayer } from "./AudioPlayer.js";
import { openCommentsModal } from "./CommentsModal.js";
import { icon } from "../../utils/icons.js";
import { formatRelativeTime } from "../../utils/time.js";
import { postsApi } from "../../services/api.js";
import { authState } from "../../services/auth.js";
import { showError, showSuccess } from "../common/Toast.js";

export function PostCard(post) {
  const {
    _id,
    author,
    content,
    type,
    mediaUrl,
    likesCount,
    commentsCount,
    isLiked,
    createdAt,
  } = post;

  const mediaContent =
    type === "voice" && mediaUrl
      ? AudioPlayer({ src: mediaUrl, postId: _id })
      : type === "video" && mediaUrl
        ? `<video src="${mediaUrl}" controls class="post-video" style="width: 100%; border-radius: 8px;"></video>`
        : "";

  const likeIconHtml = isLiked ? icon("heartFilled", 20) : icon("heart", 20);

  return `
    <article class="post-card" data-post-id="${_id}">
      <div class="post-header">
        ${Avatar({ user: author, clickable: true })}
        <div class="post-author">
          <a href="#/profile/${author?._id}" class="post-author-name">${author?.displayName || author?.username || "Unknown"}</a>
          <span class="post-author-username">@${author?.username || "unknown"}</span>
        </div>
        <span class="post-time">${formatRelativeTime(createdAt)}</span>
      </div>
      ${content ? `<div class="post-content">${escapeHtml(content)}</div>` : ""}
      ${mediaContent ? `<div class="post-media">${mediaContent}</div>` : ""}
      <div class="post-actions">
        <button class="post-action ${isLiked ? "liked" : ""}" data-like-btn="${_id}">
          ${likeIconHtml}
          <span data-likes-count="${_id}">${likesCount || 0}</span>
        </button>
        <button class="post-action" data-comment-btn="${_id}">
          ${icon("comment", 20)}
          <span>${commentsCount || 0}</span>
        </button>
        <button class="post-action" data-share-btn="${_id}">
          ${icon("share", 20)}
          <span>Share</span>
        </button>
      </div>
    </article>
  `;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

export function attachPostCardEvents(container) {
  // Like buttons
  container.querySelectorAll("[data-like-btn]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!authState.isAuthenticated) {
        showError("Please log in to like posts");
        return;
      }

      const postId = btn.dataset.likeBtn;
      const likesCountEl = container.querySelector(
        `[data-likes-count="${postId}"]`,
      );

      try {
        const { liked, likesCount } = await postsApi.like(postId);

        btn.classList.toggle("liked", liked);
        btn.innerHTML = `${liked ? icon("heartFilled", 20) : icon("heart", 20)}<span data-likes-count="${postId}">${likesCount}</span>`;
      } catch (error) {
        showError(error.message || "Failed to like post");
      }
    });
  });

  // Comment buttons
  container.querySelectorAll("[data-comment-btn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const postId = btn.dataset.commentBtn;
      openCommentsModal(postId);
    });
  });

  // Share buttons
  container.querySelectorAll("[data-share-btn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const postId = btn.dataset.shareBtn;
      const url = `${window.location.origin}/#/post/${postId}`;

      if (navigator.share) {
        navigator.share({ url }).catch(() => {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
          showSuccess("Link copied to clipboard");
        });
      }
    });
  });
}
