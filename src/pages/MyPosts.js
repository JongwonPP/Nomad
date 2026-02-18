import { apiFetch } from '../api/client.js';

const PAGE_SIZE = 20;

export function MyPosts(container) {
  let posts = [];
  let totalCount = 0;
  let currentPage = 0;

  async function fetchPosts(page) {
    const data = await apiFetch(`/api/v1/members/me/posts?page=${page}&size=${PAGE_SIZE}`);
    posts = data.posts || [];
    totalCount = data.totalCount || 0;
    currentPage = data.page ?? page;
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ko-KR');
  }

  function totalPages() {
    return Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  }

  function render() {
    const tp = totalPages();

    container.innerHTML = `
      <div class="page my-posts">
        <a href="/profile" data-link class="back-link">&larr; 프로필</a>
        <h1>내가 쓴 글</h1>

        ${posts.length === 0 ? `
          <p class="empty-message">작성한 글이 없습니다.</p>
        ` : `
          <table class="post-list-table">
            <thead>
              <tr>
                <th>게시판</th>
                <th>제목</th>
                <th>조회</th>
                <th>날짜</th>
              </tr>
            </thead>
            <tbody>
              ${posts.map(post => `
                <tr>
                  <td>${post.boardName}</td>
                  <td><a href="/boards/${post.boardId}/posts/${post.id}" data-link>${post.title}</a></td>
                  <td>${post.viewCount}</td>
                  <td>${formatDate(post.createdAt)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

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
      await fetchPosts(page);
      render();
    } catch (err) {
      alert('글 목록을 불러오지 못했습니다: ' + err.message);
    }
  }

  async function init() {
    try {
      await fetchPosts(0);
      render();
    } catch (err) {
      container.innerHTML = `
        <div class="page my-posts">
          <a href="/profile" data-link class="back-link">&larr; 프로필</a>
          <p class="error-message">글 목록을 불러오지 못했습니다.</p>
        </div>
      `;
    }
  }

  init();
}
