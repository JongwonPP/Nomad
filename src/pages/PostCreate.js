import { apiFetch } from '../api/client.js';
import { navigate } from '../router.js';

export function PostCreate(container, params) {
  const { boardId } = params;

  container.innerHTML = `
    <div class="page post-create">
      <h1>새 게시글</h1>
      <form id="post-form" class="post-form">
        <div class="form-group">
          <label for="post-title">제목</label>
          <input type="text" id="post-title" maxlength="200" required placeholder="제목을 입력하세요" />
        </div>
        <div class="form-group">
          <label for="post-content">내용</label>
          <textarea id="post-content" rows="12" required placeholder="내용을 입력하세요"></textarea>
        </div>
        <p class="error-message" id="error-msg" style="display:none;"></p>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">등록</button>
          <a href="/boards/${boardId}" data-link class="btn btn-secondary">취소</a>
        </div>
      </form>
    </div>
  `;

  const form = container.querySelector('#post-form');
  const errorMsg = container.querySelector('#error-msg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.style.display = 'none';

    const title = container.querySelector('#post-title').value.trim();
    const content = container.querySelector('#post-content').value.trim();

    if (!title || !content) {
      errorMsg.textContent = '제목과 내용을 모두 입력해주세요.';
      errorMsg.style.display = 'block';
      return;
    }

    try {
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = '등록 중...';

      const result = await apiFetch(`/api/v1/boards/${boardId}/posts`, {
        method: 'POST',
        body: JSON.stringify({ title, content }),
      });

      navigate(`/boards/${boardId}/posts/${result.id}`);
    } catch (err) {
      errorMsg.textContent = '게시글 등록에 실패했습니다: ' + err.message;
      errorMsg.style.display = 'block';
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.textContent = '등록';
    }
  });
}
