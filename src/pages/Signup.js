import { apiFetch } from '../api/client.js';
import { navigate } from '../router.js';

export function Signup(container) {
  container.innerHTML = `
    <div class="page signup">
      <h1>회원가입</h1>
      <p>새 계정을 만드세요.</p>
      <div class="error-message" style="display:none;"></div>
      <form class="form" id="signup-form">
        <div class="form-group">
          <label for="email">이메일</label>
          <input type="email" id="email" name="email" placeholder="이메일을 입력하세요" required>
        </div>
        <div class="form-group">
          <label for="password">비밀번호</label>
          <input type="password" id="password" name="password" placeholder="8자 이상 입력하세요" required>
        </div>
        <div class="form-group">
          <label for="nickname">닉네임</label>
          <input type="text" id="nickname" name="nickname" placeholder="2~20자 입력하세요" required>
        </div>
        <button type="submit" class="btn btn-primary btn-block">회원가입</button>
      </form>
      <p class="form-footer">
        이미 계정이 있으신가요? <a href="/login" data-link>로그인</a>
      </p>
    </div>
  `;

  const form = container.querySelector('#signup-form');
  const errorEl = container.querySelector('.error-message');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.style.display = 'none';

    const email = form.email.value.trim();
    const password = form.password.value;
    const nickname = form.nickname.value.trim();

    const errors = validate(email, password, nickname);
    if (errors.length > 0) {
      errorEl.innerHTML = errors.map((msg) => `<div>${msg}</div>`).join('');
      errorEl.style.display = 'block';
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = '가입 중...';

    try {
      await apiFetch('/api/v1/members', {
        method: 'POST',
        body: JSON.stringify({ email, password, nickname }),
      });
      navigate('/login');
    } catch (err) {
      let html = err.message || '회원가입에 실패했습니다.';
      if (err.errors && Array.isArray(err.errors)) {
        html += '<ul class="error-list">' +
          err.errors.map((msg) => `<li>${msg}</li>`).join('') +
          '</ul>';
      }
      errorEl.innerHTML = html;
      errorEl.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '회원가입';
    }
  });
}

function validate(email, password, nickname) {
  const errors = [];
  if (!email.includes('@')) {
    errors.push('올바른 이메일 형식을 입력해주세요.');
  }
  if (password.length < 8) {
    errors.push('비밀번호는 8자 이상이어야 합니다.');
  }
  if (nickname.length < 2 || nickname.length > 20) {
    errors.push('닉네임은 2~20자여야 합니다.');
  }
  return errors;
}
