import { apiFetch } from '../api/client.js';

const PAGE_SIZE = 20;

export function PostSearch(container) {
  const urlParams = new URLSearchParams(window.location.search);
  let keyword = urlParams.get('keyword') || '';
  let posts = [];
  let totalCount = 0;
  let currentPage = 0;

  async function fetchResults(page) {
    if (!keyword.trim()) {
      posts = [];
      totalCount = 0;
      currentPage = 0;
      return;
    }
    const params = new URLSearchParams({ keyword, page, size: PAGE_SIZE });
    const data = await apiFetch(`/api/v1/posts/search?${params}`);
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
    const hasResults = posts.length > 0;
    const searched = keyword.trim().length > 0;

    container.innerHTML = `
      <div class="page post-search">
        <h1>검색</h1>
        <form id="search-form" class="search-form">
          <div class="search-input-wrap">
            <input type="text" id="search-input" placeholder="검색어를 입력하세요" value="${keyword.replace(/"/g, '&quot;')}" />
            <button type="submit" class="btn btn-primary">검색</button>
          </div>
        </form>

        ${searched ? `
          <p class="search-result-info">"${keyword}" 검색 결과 ${totalCount}건</p>

          ${hasResults ? `
            <table class="post-list-table">
              <thead>
                <tr>
                  <th>게시판</th>
                  <th>제목</th>
                  <th>작성자</th>
                  <th>조회</th>
                  <th>날짜</th>
                </tr>
              </thead>
              <tbody>
                ${posts.map(post => `
                  <tr>
                    <td>${post.boardName}</td>
                    <td><a href="/boards/${post.boardId}/posts/${post.id}" data-link>${post.title}</a></td>
                    <td>${post.nickname}</td>
                    <td>${post.viewCount}</td>
                    <td>${formatDate(post.createdAt)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            ${totalCount > PAGE_SIZE ? `
              <div class="pagination">
                <button class="btn btn-sm" id="prev-page" ${currentPage <= 0 ? 'disabled' : ''}>이전</button>
                <span class="page-numbers" id="page-numbers">
                  ${Array.from({ length: tp }, (_, i) => `
                    <button class="btn btn-sm page-num ${i === currentPage ? 'active' : ''}" data-page="${i}">${i + 1}</button>
                  `).join('')}
                </span>
                <button class="btn btn-sm" id="next-page" ${currentPage >= tp - 1 ? 'disabled' : ''}>다음</button>
              </div>
            ` : ''}
          ` : `
            <p class="empty-message">검색 결과가 없습니다.</p>
          `}
        ` : ''}
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    const form = container.querySelector('#search-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        keyword = container.querySelector('#search-input').value.trim();
        if (!keyword) return;
        // Update URL without reload
        const url = `/search?keyword=${encodeURIComponent(keyword)}`;
        history.replaceState(null, '', url);
        try {
          await fetchResults(0);
          render();
        } catch (err) {
          alert('검색에 실패했습니다: ' + err.message);
        }
      });
    }

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
      await fetchResults(page);
      render();
    } catch (err) {
      alert('검색에 실패했습니다: ' + err.message);
    }
  }

  async function init() {
    if (keyword.trim()) {
      try {
        await fetchResults(0);
      } catch (err) {
        // silently fail on init, show empty results
      }
    }
    render();
  }

  init();
}
