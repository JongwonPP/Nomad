import { apiFetch } from '../api/client.js';
import { navigate } from '../router.js';

export function PostEdit(container, params) {
  const { boardId, postId } = params;

  container.innerHTML = '<div class="page post-edit"><p>로딩 중...</p></div>';

  async function init() {
    let post;
    try {
      post = await apiFetch(`/api/v1/boards/${boardId}/posts/${postId}`);
    } catch (err) {
      container.innerHTML = `
        <div class="page post-edit">
          <a href="/boards/${boardId}/posts/${postId}" data-link class="back-link">&larr; 돌아가기</a>
          <p class="error-message">게시글을 불러오지 못했습니다.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="page post-edit">
        <h1>게시글 수정</h1>
        <form id="post-form" class="post-form">
          <div class="form-group">
            <label for="post-title">제목</label>
            <input type="text" id="post-title" maxlength="200" required />
          </div>
          <div class="form-group">
            <label for="post-content">내용</label>
            <textarea id="post-content" rows="12" required></textarea>
          </div>
          <p class="error-message" id="error-msg" style="display:none;"></p>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">수정</button>
            <a href="/boards/${boardId}/posts/${postId}" data-link class="btn btn-secondary">취소</a>
          </div>
        </form>
      </div>
    `;

    const titleInput = container.querySelector('#post-title');
    const contentInput = container.querySelector('#post-content');
    titleInput.value = post.title;
    contentInput.value = post.content;

    const form = container.querySelector('#post-form');
    const errorMsg = container.querySelector('#error-msg');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorMsg.style.display = 'none';

      const title = titleInput.value.trim();
      const content = contentInput.value.trim();

      if (!title || !content) {
        errorMsg.textContent = '제목과 내용을 모두 입력해주세요.';
        errorMsg.style.display = 'block';
        return;
      }

      try {
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = '수정 중...';

        await apiFetch(`/api/v1/boards/${boardId}/posts/${postId}`, {
          method: 'PUT',
          body: JSON.stringify({ title, content }),
        });

        navigate(`/boards/${boardId}/posts/${postId}`);
      } catch (err) {
        errorMsg.textContent = '게시글 수정에 실패했습니다: ' + err.message;
        errorMsg.style.display = 'block';
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = '수정';
      }
    });
  }

  init();
}
