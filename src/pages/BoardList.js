import { apiFetch } from '../api/client.js';
import { isLoggedIn } from '../store/auth.js';

export function BoardList(container) {
  container.innerHTML = `
    <div class="page board-list">
      <h1>게시판 목록</h1>
      <div id="create-board-section"></div>
      <div class="loading" id="board-loading">로딩 중...</div>
      <div class="error-message" id="board-error" style="display:none;"></div>
      <div id="boards-container"></div>
    </div>
  `;

  if (isLoggedIn()) {
    renderCreateForm(container);
  }

  loadBoards(container);
}

async function loadBoards(container) {
  const loadingEl = container.querySelector('#board-loading');
  const errorEl = container.querySelector('#board-error');
  const boardsEl = container.querySelector('#boards-container');

  try {
    const boards = await apiFetch('/api/v1/boards');
    loadingEl.style.display = 'none';

    if (!boards || boards.length === 0) {
      boardsEl.innerHTML = '<p class="empty-message">등록된 게시판이 없습니다.</p>';
      return;
    }

    boardsEl.innerHTML = boards.map((board) => `
      <a href="/boards/${board.id}" data-link class="board-card">
        <h3 class="board-card-title">${board.name}</h3>
        ${board.description ? `<p class="board-card-desc">${board.description}</p>` : ''}
      </a>
    `).join('');
  } catch (err) {
    loadingEl.style.display = 'none';
    errorEl.textContent = err.message || '게시판 목록을 불러올 수 없습니다.';
    errorEl.style.display = 'block';
  }
}

function renderCreateForm(container) {
  const section = container.querySelector('#create-board-section');

  section.innerHTML = `
    <details class="create-board-details">
      <summary class="btn btn-primary">게시판 만들기</summary>
      <div class="error-message" id="create-error" style="display:none;"></div>
      <form id="create-board-form" class="form">
        <div class="form-group">
          <label for="board-name">게시판 이름</label>
          <input type="text" id="board-name" name="name" maxlength="50" placeholder="게시판 이름 (최대 50자)" required>
        </div>
        <div class="form-group">
          <label for="board-desc">설명 (선택)</label>
          <textarea id="board-desc" name="description" rows="2" placeholder="게시판 설명"></textarea>
        </div>
        <button type="submit" class="btn btn-primary">만들기</button>
      </form>
    </details>
  `;

  const form = section.querySelector('#create-board-form');
  const errorEl = section.querySelector('#create-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.style.display = 'none';

    const name = form.name.value.trim();
    const description = form.description.value.trim();

    if (!name) {
      errorEl.textContent = '게시판 이름을 입력해주세요.';
      errorEl.style.display = 'block';
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = '생성 중...';

    try {
      await apiFetch('/api/v1/boards', {
        method: 'POST',
        body: JSON.stringify({ name, description: description || null }),
      });
      form.reset();
      section.querySelector('details').removeAttribute('open');
      loadBoards(container);
    } catch (err) {
      errorEl.textContent = err.message || '게시판 생성에 실패했습니다.';
      errorEl.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = '만들기';
    }
  });
}
