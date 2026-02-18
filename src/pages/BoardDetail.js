import { apiFetch } from '../api/client.js';
import { isLoggedIn, getUser } from '../store/auth.js';
import { navigate } from '../router.js';

const PAGE_SIZE = 20;

export function BoardDetail(container, params) {
  const { boardId } = params;
  let board = null;
  let posts = [];
  let totalCount = 0;
  let currentPage = 0;
  let editing = false;
  let currentSort = 'latest';

  async function fetchBoard() {
    board = await apiFetch(`/api/v1/boards/${boardId}`);
  }

  async function fetchPosts(page) {
    const data = await apiFetch(`/api/v1/boards/${boardId}/posts?page=${page}&size=${PAGE_SIZE}&sort=${currentSort}`);
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
    if (!board) {
      container.innerHTML = '<div class="page board-detail"><p>로딩 중...</p></div>';
      return;
    }

    const loggedIn = isLoggedIn();
    const user = getUser();
    const isOwner = loggedIn && user && user.memberId === board.memberId;
    const tp = totalPages();

    container.innerHTML = `
      <div class="page board-detail">
        <a href="/" data-link class="back-link">&larr; 게시판 목록</a>

        <div class="board-header" id="board-header">
          ${editing ? `
            <form id="board-edit-form" class="board-edit-form">
              <input type="text" id="edit-board-name" value="${board.name}" maxlength="50" required />
              <textarea id="edit-board-desc" rows="2">${board.description || ''}</textarea>
              <div class="form-actions">
                <button type="submit" class="btn btn-primary">저장</button>
                <button type="button" id="cancel-edit-btn" class="btn btn-secondary">취소</button>
              </div>
            </form>
          ` : `
            <h1>${board.name}</h1>
            ${board.description ? `<p class="board-desc">${board.description}</p>` : ''}
            ${isOwner ? `
              <div class="board-actions">
                <button id="edit-board-btn" class="btn btn-secondary btn-sm">수정</button>
                <button id="delete-board-btn" class="btn btn-danger btn-sm">삭제</button>
              </div>
            ` : ''}
          `}
        </div>

        <div class="board-toolbar">
          <div class="sort-select">
            <select id="sort-select">
              <option value="latest" ${currentSort === 'latest' ? 'selected' : ''}>최신순</option>
              <option value="oldest" ${currentSort === 'oldest' ? 'selected' : ''}>오래된순</option>
              <option value="views" ${currentSort === 'views' ? 'selected' : ''}>조회수순</option>
              <option value="likes" ${currentSort === 'likes' ? 'selected' : ''}>좋아요순</option>
            </select>
          </div>
          ${loggedIn ? `<a href="/boards/${boardId}/posts/new" data-link class="btn btn-primary">글쓰기</a>` : ''}
        </div>

        ${posts.length === 0 ? `
          <p class="empty-message">게시글이 없습니다.</p>
        ` : `
          <table class="post-table">
            <thead>
              <tr>
                <th class="col-title">제목</th>
                <th class="col-author">작성자</th>
                <th class="col-views">조회</th>
                <th class="col-likes">좋아요</th>
                <th class="col-date">날짜</th>
              </tr>
            </thead>
            <tbody>
              ${posts.map(post => `
                <tr>
                  <td class="col-title">
                    <a href="/boards/${boardId}/posts/${post.id}" data-link>${post.title}</a>
                  </td>
                  <td class="col-author">${post.nickname}</td>
                  <td class="col-views">${post.viewCount}</td>
                  <td class="col-likes">${post.likeCount ?? 0}</td>
                  <td class="col-date">${formatDate(post.createdAt)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="pagination">
            <button class="btn btn-sm" id="prev-page" ${currentPage <= 0 ? 'disabled' : ''}>이전</button>
            <span class="page-numbers" id="page-numbers">
              ${Array.from({ length: tp }, (_, i) => `
                <button class="btn btn-sm page-num ${i === currentPage ? 'active' : ''}" data-page="${i}">${i + 1}</button>
              `).join('')}
            </span>
            <button class="btn btn-sm" id="next-page" ${currentPage >= tp - 1 ? 'disabled' : ''}>다음</button>
          </div>
        `}
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    const editBtn = container.querySelector('#edit-board-btn');
    const deleteBtn = container.querySelector('#delete-board-btn');
    const editForm = container.querySelector('#board-edit-form');
    const cancelEditBtn = container.querySelector('#cancel-edit-btn');
    const prevBtn = container.querySelector('#prev-page');
    const nextBtn = container.querySelector('#next-page');

    if (editBtn) {
      editBtn.addEventListener('click', () => {
        editing = true;
        render();
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (!confirm('정말 이 게시판을 삭제하시겠습니까?')) return;
        try {
          await apiFetch(`/api/v1/boards/${boardId}`, { method: 'DELETE' });
          navigate('/');
        } catch (err) {
          alert('삭제에 실패했습니다: ' + err.message);
        }
      });
    }

    if (editForm) {
      editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = container.querySelector('#edit-board-name').value.trim();
        const description = container.querySelector('#edit-board-desc').value.trim();
        if (!name) return;
        try {
          board = await apiFetch(`/api/v1/boards/${boardId}`, {
            method: 'PUT',
            body: JSON.stringify({ name, description }),
          });
          editing = false;
          render();
        } catch (err) {
          alert('수정에 실패했습니다: ' + err.message);
        }
      });
    }

    if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', () => {
        editing = false;
        render();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => goToPage(currentPage - 1));
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => goToPage(currentPage + 1));
    }

    const sortSelect = container.querySelector('#sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', async () => {
        currentSort = sortSelect.value;
        try {
          await fetchPosts(0);
          render();
        } catch (err) {
          alert('게시글을 불러오지 못했습니다: ' + err.message);
        }
      });
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
      alert('게시글을 불러오지 못했습니다: ' + err.message);
    }
  }

  async function init() {
    try {
      await Promise.all([fetchBoard(), fetchPosts(0)]);
      render();
    } catch (err) {
      container.innerHTML = `
        <div class="page board-detail">
          <a href="/" data-link class="back-link">&larr; 게시판 목록</a>
          <p class="error-message">게시판을 불러오지 못했습니다.</p>
        </div>
      `;
    }
  }

  init();
}
