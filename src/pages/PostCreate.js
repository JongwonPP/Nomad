import { apiFetch } from '../api/client.js';
import { navigate } from '../router.js';

export function PostCreate(container, params) {
  const { boardId } = params;
  let selectedFiles = [];

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
        <div class="image-upload-section">
          <h3>이미지 첨부 <span class="image-count" id="image-count">0/5</span></h3>
          <div class="image-preview-list" id="image-preview-list"></div>
          <div class="image-upload-area" id="image-upload-area">
            <p class="upload-icon">📷</p>
            <p>클릭하여 이미지 선택</p>
            <p class="upload-hint">JPEG, PNG, GIF, WEBP (최대 5MB, 최대 5장)</p>
          </div>
          <input type="file" id="image-file-input" accept="image/jpeg,image/png,image/gif,image/webp" multiple style="display:none" />
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
  const uploadArea = container.querySelector('#image-upload-area');
  const fileInput = container.querySelector('#image-file-input');
  const previewList = container.querySelector('#image-preview-list');
  const imageCount = container.querySelector('#image-count');

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxFileSize = 5 * 1024 * 1024;

  function renderPreviews() {
    imageCount.textContent = `${selectedFiles.length}/5`;

    previewList.querySelectorAll('.image-preview-item img').forEach((img) => {
      URL.revokeObjectURL(img.src);
    });

    previewList.innerHTML = selectedFiles
      .map(
        (file, index) => `
      <div class="image-preview-item">
        <img src="${URL.createObjectURL(file)}" alt="${file.name}" />
        <button class="preview-remove-btn" data-index="${index}">×</button>
        <span class="preview-filename">${file.name}</span>
      </div>
    `,
      )
      .join('');

    previewList.querySelectorAll('.preview-remove-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const index = parseInt(btn.dataset.index, 10);
        selectedFiles.splice(index, 1);
        renderPreviews();
      });
    });

    uploadArea.style.display = selectedFiles.length >= 5 ? 'none' : '';
  }

  uploadArea.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files);
    fileInput.value = '';

    const errors = [];
    const validFiles = [];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: 지원하지 않는 파일 형식입니다.`);
        continue;
      }
      if (file.size > maxFileSize) {
        errors.push(`${file.name}: 파일 크기가 5MB를 초과합니다.`);
        continue;
      }
      validFiles.push(file);
    }

    const remaining = 5 - selectedFiles.length;
    if (validFiles.length > remaining) {
      errors.push(`이미지는 최대 5장까지 첨부할 수 있습니다. ${validFiles.length - remaining}장이 무시되었습니다.`);
      validFiles.splice(remaining);
    }

    if (errors.length > 0) {
      errorMsg.textContent = errors.join(' ');
      errorMsg.style.display = 'block';
    } else {
      errorMsg.style.display = 'none';
    }

    selectedFiles.push(...validFiles);
    renderPreviews();
  });

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

      if (selectedFiles.length > 0) {
        submitBtn.textContent = `이미지 업로드 중... (0/${selectedFiles.length})`;
        for (let i = 0; i < selectedFiles.length; i++) {
          try {
            const formData = new FormData();
            formData.append('file', selectedFiles[i]);
            await apiFetch(`/api/v1/posts/${result.id}/images`, {
              method: 'POST',
              body: formData,
            });
            submitBtn.textContent = `이미지 업로드 중... (${i + 1}/${selectedFiles.length})`;
          } catch (imgErr) {
            console.warn('Image upload failed:', imgErr.message);
          }
        }
      }

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
