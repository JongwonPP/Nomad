import { apiFetch } from '../api/client.js';
import { login } from '../store/auth.js';
import { navigate } from '../router.js';

export function Login(container) {
  container.innerHTML = `
    <div class="page login">
      <h1>로그인</h1>
      <p>계정에 로그인하세요.</p>
      <div class="error-message" style="display:none;"></div>
      <form class="form" id="login-form">
        <div class="form-group">
          <label for="email">이메일</label>
          <input type="email" id="email" name="email" placeholder="이메일을 입력하세요" required>
        </div>
        <div class="form-group">
          <label for="password">비밀번호</label>
          <input type="password" id="password" name="password" placeholder="비밀번호를 입력하세요" required>
        </div>
        <button type="submit" class="btn btn-primary btn-block">로그인</button>
      </form>
      <p class="form-footer">
        계정이 없으신가요? <a href="/signup" data-link>회원가입</a>
      </p>
    </div>
  `;

  const form = container.querySelector('#login-form');
  const errorEl = container.querySelector('.error-message');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.style.display = 'none';

    const email = form.email.value.trim();
    const password = form.password.value;

    if (!email || !password) {
      errorEl.textContent = '이메일과 비밀번호를 입력해주세요.';
      errorEl.style.display = 'block';
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = '로그인 중...';

    try {
      const data = await apiFetch('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      login(data.accessToken, data.refreshToken);
      navigate('/');
    } catch (err) {
      errorEl.textContent = err.message || '로그인에 실패했습니다.';
      errorEl.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '로그인';
    }
  });
}
