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

    let images = [...(post.images || [])];
    let newFiles = [];

    function getTotalCount() {
      return images.length + newFiles.length;
    }

    function renderImageSection() {
      const section = container.querySelector('.image-upload-section');
      if (!section) return;

      const totalCount = getTotalCount();

      section.innerHTML = `
        <h3>이미지 관리 <span class="image-count" id="image-count">${totalCount}/5</span></h3>
        <div class="image-gallery" id="existing-images">
          ${images.map(img => `
            <div class="image-gallery-item" data-image-id="${img.id}">
              <img src="${img.imageUrl}" alt="${img.originalFilename}" />
              <button class="image-delete-btn" data-image-id="${img.id}">&times;</button>
              <span class="image-filename">${img.originalFilename}</span>
            </div>
          `).join('')}
        </div>
        <div class="image-preview-list" id="new-image-preview">
          ${newFiles.map((file, idx) => `
            <div class="image-preview-item" data-index="${idx}">
              <img src="${URL.createObjectURL(file)}" alt="${file.name}" />
              <button class="preview-remove-btn" data-index="${idx}">&times;</button>
              <span class="preview-filename">${file.name}</span>
            </div>
          `).join('')}
        </div>
        ${totalCount < 5 ? `
          <div class="image-upload-area" id="image-upload-area">
            <p class="upload-icon">📷</p>
            <p>클릭하여 새 이미지 추가</p>
            <p class="upload-hint">JPEG, PNG, GIF, WEBP (최대 5MB)</p>
          </div>
          <input type="file" id="image-file-input" accept="image/jpeg,image/png,image/gif,image/webp" multiple style="display:none" />
        ` : ''}
      `;

      bindImageEvents();
    }

    function bindImageEvents() {
      // Delete existing images
      container.querySelectorAll('.image-delete-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const imageId = btn.dataset.imageId;
          if (!confirm('이 이미지를 삭제하시겠습니까?')) return;
          try {
            await apiFetch(`/api/v1/posts/${postId}/images/${imageId}`, { method: 'DELETE' });
            images = images.filter(img => String(img.id) !== String(imageId));
            renderImageSection();
          } catch (err) {
            alert('이미지 삭제에 실패했습니다: ' + err.message);
          }
        });
      });

      // Remove new file previews
      container.querySelectorAll('.preview-remove-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.dataset.index);
          newFiles.splice(idx, 1);
          renderImageSection();
        });
      });

      // Upload area click
      const uploadArea = container.querySelector('#image-upload-area');
      const fileInput = container.querySelector('#image-file-input');
      if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => {
          const files = Array.from(fileInput.files);
          if (files.length === 0) return;

          const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
          const maxSize = 5 * 1024 * 1024;
          const remaining = 5 - getTotalCount();

          for (let i = 0; i < Math.min(files.length, remaining); i++) {
            const file = files[i];
            if (!allowedTypes.includes(file.type)) {
              alert(`${file.name}: 지원하지 않는 파일 형식입니다.`);
              continue;
            }
            if (file.size > maxSize) {
              alert(`${file.name}: 파일 크기가 5MB를 초과합니다.`);
              continue;
            }
            newFiles.push(file);
          }

          if (files.length > remaining) {
            alert(`최대 5개까지 이미지를 추가할 수 있습니다. ${remaining}개만 추가되었습니다.`);
          }

          renderImageSection();
        });
      }
    }

    const totalCount = getTotalCount();

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
          <div class="image-upload-section">
            <h3>이미지 관리 <span class="image-count" id="image-count">${totalCount}/5</span></h3>
            <div class="image-gallery" id="existing-images">
              ${images.map(img => `
                <div class="image-gallery-item" data-image-id="${img.id}">
                  <img src="${img.imageUrl}" alt="${img.originalFilename}" />
                  <button class="image-delete-btn" data-image-id="${img.id}">&times;</button>
                  <span class="image-filename">${img.originalFilename}</span>
                </div>
              `).join('')}
            </div>
            <div class="image-preview-list" id="new-image-preview"></div>
            ${totalCount < 5 ? `
              <div class="image-upload-area" id="image-upload-area">
                <p class="upload-icon">📷</p>
                <p>클릭하여 새 이미지 추가</p>
                <p class="upload-hint">JPEG, PNG, GIF, WEBP (최대 5MB)</p>
              </div>
              <input type="file" id="image-file-input" accept="image/jpeg,image/png,image/gif,image/webp" multiple style="display:none" />
            ` : ''}
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

    bindImageEvents();

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

      const submitBtn = form.querySelector('button[type="submit"]');

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = '수정 중...';

        // 1. Update post text
        await apiFetch(`/api/v1/boards/${boardId}/posts/${postId}`, {
          method: 'PUT',
          body: JSON.stringify({ title, content }),
        });

        // 2. Upload new images
        if (newFiles.length > 0) {
          submitBtn.textContent = `이미지 업로드 중... (0/${newFiles.length})`;
          for (let i = 0; i < newFiles.length; i++) {
            try {
              const formData = new FormData();
              formData.append('file', newFiles[i]);
              await apiFetch(`/api/v1/posts/${postId}/images`, {
                method: 'POST',
                body: formData,
              });
              submitBtn.textContent = `이미지 업로드 중... (${i + 1}/${newFiles.length})`;
            } catch (imgErr) {
              console.warn('Image upload failed:', imgErr.message);
            }
          }
        }

        navigate(`/boards/${boardId}/posts/${postId}`);
      } catch (err) {
        errorMsg.textContent = '게시글 수정에 실패했습니다: ' + err.message;
        errorMsg.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = '수정';
      }
    });
  }

  init();
}
