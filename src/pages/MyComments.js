import { apiFetch } from '../api/client.js';

const PAGE_SIZE = 20;

export function MyComments(container) {
  let comments = [];
  let totalCount = 0;
  let currentPage = 0;

  async function fetchComments(page) {
    const data = await apiFetch(`/api/v1/members/me/comments?page=${page}&size=${PAGE_SIZE}`);
    comments = data.comments || [];
    totalCount = data.totalCount || 0;
    currentPage = data.page ?? page;
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ko-KR') + ' ' + d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  }

  function totalPages() {
    return Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  }

  function render() {
    const tp = totalPages();

    container.innerHTML = `
      <div class="page my-comments">
        <a href="/profile" data-link class="back-link">&larr; 프로필</a>
        <h1>내가 쓴 댓글</h1>

        ${comments.length === 0 ? `
          <p class="empty-message">작성한 댓글이 없습니다.</p>
        ` : `
          <div class="my-comment-list">
            ${comments.map(comment => `
              <div class="my-comment-item">
                <a href="/boards/${comment.boardId || 0}/posts/${comment.postId}" data-link class="my-comment-post-title">${comment.postTitle}</a>
                <p class="my-comment-content">${comment.content}</p>
                <span class="my-comment-date">${formatDate(comment.createdAt)}</span>
              </div>
            `).join('')}
          </div>

          ${totalCount > PAGE_SIZE ? `
            <div class="pagination">
              <button class="btn btn-sm" id="prev-page" ${currentPage <= 0 ? 'disabled' : ''}>이전</button>
              <span class="page-numbers">
                ${Array.from({ length: tp }, (_, i) => `
                  <button class="btn btn-sm page-num ${i === currentPage ? 'active' : ''}" data-page="${i}">${i + 1}</button>
                `).join('')}
              </span>
              <button class="btn btn-sm" id="next-page" ${currentPage >= tp - 1 ? 'disabled' : ''}>다음</button>
            </div>
          ` : ''}
        `}
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    const prevBtn = container.querySelector('#prev-page');
    const nextBtn = container.querySelector('#next-page');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => goToPage(currentPage - 1));
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => goToPage(currentPage + 1));
    }

    container.querySelectorAll('.page-num').forEach((btn) => {
      btn.addEventListener('click', () => {
        goToPage(Number(btn.dataset.page));
      });
    });
  }

  async function goToPage(page) {
    try {
      await fetchComments(page);
      render();
    } catch (err) {
      alert('댓글 목록을 불러오지 못했습니다: ' + err.message);
    }
  }

  async function init() {
    try {
      await fetchComments(0);
      render();
    } catch (err) {
      container.innerHTML = `
        <div class="page my-comments">
          <a href="/profile" data-link class="back-link">&larr; 프로필</a>
          <p class="error-message">댓글 목록을 불러오지 못했습니다.</p>
        </div>
      `;
    }
  }

  init();
}
