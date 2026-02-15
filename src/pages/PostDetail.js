import { apiFetch } from '../api/client.js';
import { isLoggedIn, getUser } from '../store/auth.js';
import { navigate } from '../router.js';

function renderContent(text) {
  return text.replace(/@([\w가-힣]{2,20})/g, '<span class="mention">@$1</span>');
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR') + ' ' + d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function PostDetail(container, params) {
  const { boardId, postId } = params;
  let post = null;
  let comments = [];
  let replyingTo = null;
  let editingCommentId = null;

  async function fetchPost() {
    post = await apiFetch(`/api/v1/boards/${boardId}/posts/${postId}`);
  }

  async function fetchComments() {
    const data = await apiFetch(`/api/v1/posts/${postId}/comments`);
    comments = data.comments || [];
  }

  function renderCommentItem(comment, isReply) {
    const loggedIn = isLoggedIn();
    const user = getUser();
    const isAuthor = loggedIn && user && user.memberId === comment.memberId;
    const isEditing = editingCommentId === comment.id;
    const indent = isReply ? ' comment-reply' : '';

    return `
      <div class="comment-item${indent}" data-comment-id="${comment.id}">
        <div class="comment-header">
          <strong>${escapeHtml(comment.nickname)}</strong>
          <span class="comment-date">${formatDate(comment.createdAt)}</span>
        </div>
        ${isEditing ? `
          <form class="comment-edit-form" data-comment-id="${comment.id}">
            <textarea class="comment-edit-textarea" rows="3">${escapeHtml(comment.content)}</textarea>
            <div class="comment-edit-actions">
              <button type="submit" class="btn btn-sm btn-primary">저장</button>
              <button type="button" class="btn btn-sm btn-secondary cancel-edit-btn">취소</button>
            </div>
          </form>
        ` : `
          <div class="comment-content">${renderContent(escapeHtml(comment.content))}</div>
          <div class="comment-actions">
            ${!isReply && loggedIn ? `<button class="btn btn-sm btn-link reply-btn" data-comment-id="${comment.id}">답글</button>` : ''}
            ${isAuthor ? `
              <button class="btn btn-sm btn-link edit-comment-btn" data-comment-id="${comment.id}">수정</button>
              <button class="btn btn-sm btn-link delete-comment-btn" data-comment-id="${comment.id}">삭제</button>
            ` : ''}
          </div>
        `}
        ${!isReply && replyingTo === comment.id ? `
          <form class="reply-form" data-parent-id="${comment.id}">
            <textarea class="reply-textarea" rows="2" placeholder="답글을 입력하세요" required></textarea>
            <div class="reply-actions">
              <button type="submit" class="btn btn-sm btn-primary">답글 등록</button>
              <button type="button" class="btn btn-sm btn-secondary cancel-reply-btn">취소</button>
            </div>
          </form>
        ` : ''}
        ${!isReply && comment.replies && comment.replies.length > 0 ? `
          <div class="replies">
            ${comment.replies.map(r => renderCommentItem(r, true)).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  function render() {
    if (!post) {
      container.innerHTML = '<div class="page post-detail"><p>로딩 중...</p></div>';
      return;
    }

    const loggedIn = isLoggedIn();
    const user = getUser();
    const isAuthor = loggedIn && user && user.memberId === post.memberId;

    container.innerHTML = `
      <div class="page post-detail">
        <a href="/boards/${boardId}" data-link class="back-link">&larr; 목록으로</a>

        <article class="post-article">
          <h1 class="post-title">${escapeHtml(post.title)}</h1>
          <div class="post-meta">
            <span class="post-author">${escapeHtml(post.nickname)}</span>
            <span class="post-date">${formatDate(post.createdAt)}</span>
            <span class="post-views">조회 ${post.viewCount}</span>
          </div>
          ${isAuthor ? `
            <div class="post-actions">
              <a href="/boards/${boardId}/posts/${postId}/edit" data-link class="btn btn-secondary btn-sm">수정</a>
              <button id="delete-post-btn" class="btn btn-danger btn-sm">삭제</button>
            </div>
          ` : ''}
          <div class="post-content">${escapeHtml(post.content).replace(/\n/g, '<br>')}</div>
        </article>

        <section class="comments-section">
          <h2>댓글 ${comments.length > 0 ? `(${comments.length})` : ''}</h2>
          <div class="comments-list">
            ${comments.length === 0 ? '<p class="empty-message">댓글이 없습니다.</p>' : comments.map(c => renderCommentItem(c, false)).join('')}
          </div>
          ${loggedIn ? `
            <form id="comment-form" class="comment-form">
              <textarea id="comment-textarea" rows="3" placeholder="댓글을 입력하세요" required></textarea>
              <button type="submit" class="btn btn-primary">댓글 등록</button>
            </form>
          ` : ''}
        </section>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    const deletePostBtn = container.querySelector('#delete-post-btn');
    if (deletePostBtn) {
      deletePostBtn.addEventListener('click', async () => {
        if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) return;
        try {
          await apiFetch(`/api/v1/boards/${boardId}/posts/${postId}`, { method: 'DELETE' });
          navigate(`/boards/${boardId}`);
        } catch (err) {
          alert('삭제에 실패했습니다: ' + err.message);
        }
      });
    }

    const commentForm = container.querySelector('#comment-form');
    if (commentForm) {
      commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const textarea = container.querySelector('#comment-textarea');
        const content = textarea.value.trim();
        if (!content) return;
        try {
          await apiFetch(`/api/v1/posts/${postId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content }),
          });
          await fetchComments();
          render();
        } catch (err) {
          alert('댓글 등록에 실패했습니다: ' + err.message);
        }
      });
    }

    container.querySelectorAll('.reply-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        replyingTo = Number(btn.dataset.commentId);
        editingCommentId = null;
        render();
      });
    });

    container.querySelectorAll('.cancel-reply-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        replyingTo = null;
        render();
      });
    });

    container.querySelectorAll('.reply-form').forEach((form) => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const parentId = form.dataset.parentId;
        const textarea = form.querySelector('.reply-textarea');
        const content = textarea.value.trim();
        if (!content) return;
        try {
          await apiFetch(`/api/v1/posts/${postId}/comments/${parentId}/replies`, {
            method: 'POST',
            body: JSON.stringify({ content }),
          });
          replyingTo = null;
          await fetchComments();
          render();
        } catch (err) {
          alert('답글 등록에 실패했습니다: ' + err.message);
        }
      });
    });

    container.querySelectorAll('.edit-comment-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        editingCommentId = Number(btn.dataset.commentId);
        replyingTo = null;
        render();
      });
    });

    container.querySelectorAll('.cancel-edit-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        editingCommentId = null;
        render();
      });
    });

    container.querySelectorAll('.comment-edit-form').forEach((form) => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const commentId = form.dataset.commentId;
        const textarea = form.querySelector('.comment-edit-textarea');
        const content = textarea.value.trim();
        if (!content) return;
        try {
          await apiFetch(`/api/v1/posts/${postId}/comments/${commentId}`, {
            method: 'PUT',
            body: JSON.stringify({ content }),
          });
          editingCommentId = null;
          await fetchComments();
          render();
        } catch (err) {
          alert('댓글 수정에 실패했습니다: ' + err.message);
        }
      });
    });

    container.querySelectorAll('.delete-comment-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('이 댓글을 삭제하시겠습니까?')) return;
        try {
          await apiFetch(`/api/v1/posts/${postId}/comments/${btn.dataset.commentId}`, {
            method: 'DELETE',
          });
          await fetchComments();
          render();
        } catch (err) {
          alert('댓글 삭제에 실패했습니다: ' + err.message);
        }
      });
    });
  }

  async function init() {
    try {
      await Promise.all([fetchPost(), fetchComments()]);
      render();
    } catch (err) {
      container.innerHTML = `
        <div class="page post-detail">
          <a href="/boards/${boardId}" data-link class="back-link">&larr; 목록으로</a>
          <p class="error-message">게시글을 불러오지 못했습니다.</p>
        </div>
      `;
    }
  }

  init();
}
