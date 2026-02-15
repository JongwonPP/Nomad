import { apiFetch } from '../api/client.js';
import { getUser, logout } from '../store/auth.js';
import { navigate } from '../router.js';

export function Profile(container) {
  const user = getUser();
  if (!user) {
    navigate('/login');
    return;
  }

  container.innerHTML = `
    <div class="page profile">
      <h1>프로필</h1>
      <div class="loading">로딩 중...</div>
    </div>
  `;

  loadProfile(container, user.memberId);
}

async function loadProfile(container, memberId) {
  const page = container.querySelector('.page');

  try {
    const member = await apiFetch(`/api/v1/members/${memberId}`);
    renderProfile(page, member);
  } catch (err) {
    page.innerHTML = `
      <h1>프로필</h1>
      <div class="error-message">${err.message || '프로필을 불러올 수 없습니다.'}</div>
    `;
  }
}

function renderProfile(page, member) {
  page.innerHTML = `
    <h1>프로필</h1>

    <section class="profile-section">
      <h2>기본 정보</h2>
      <div class="form-group">
        <label>이메일</label>
        <input type="email" value="${member.email}" disabled>
      </div>
      <div class="form-group">
        <label>가입일</label>
        <input type="text" value="${new Date(member.createdAt).toLocaleDateString('ko-KR')}" disabled>
      </div>
    </section>

    <section class="profile-section">
      <h2>닉네임 변경</h2>
      <div class="message" id="nickname-msg"></div>
      <form id="nickname-form" class="form">
        <div class="form-group">
          <label for="nickname">닉네임</label>
          <input type="text" id="nickname" name="nickname" value="${member.nickname}" required>
        </div>
        <button type="submit" class="btn btn-primary">닉네임 변경</button>
      </form>
    </section>

    <section class="profile-section">
      <h2>비밀번호 변경</h2>
      <div class="message" id="password-msg"></div>
      <form id="password-form" class="form">
        <div class="form-group">
          <label for="old-password">현재 비밀번호</label>
          <input type="password" id="old-password" name="oldPassword" required>
        </div>
        <div class="form-group">
          <label for="new-password">새 비밀번호</label>
          <input type="password" id="new-password" name="newPassword" placeholder="8자 이상" required>
        </div>
        <button type="submit" class="btn btn-primary">비밀번호 변경</button>
      </form>
    </section>

    <section class="profile-section danger-zone">
      <h2>계정 삭제</h2>
      <p>계정을 삭제하면 복구할 수 없습니다.</p>
      <button class="btn btn-danger" id="delete-account">계정 삭제</button>
    </section>
  `;

  setupNicknameForm(page, member);
  setupPasswordForm(page, member);
  setupDeleteAccount(page, member);
}

function showMessage(el, text, type) {
  el.textContent = text;
  el.className = type === 'success' ? 'success-message' : 'error-message';
  el.style.display = 'block';
}

function setupNicknameForm(page, member) {
  const form = page.querySelector('#nickname-form');
  const msgEl = page.querySelector('#nickname-msg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msgEl.style.display = 'none';

    const nickname = form.nickname.value.trim();
    if (nickname.length < 2 || nickname.length > 20) {
      showMessage(msgEl, '닉네임은 2~20자여야 합니다.', 'error');
      return;
    }

    const btn = form.querySelector('button');
    btn.disabled = true;

    try {
      await apiFetch(`/api/v1/members/${member.id}`, {
        method: 'PUT',
        body: JSON.stringify({ nickname }),
      });
      showMessage(msgEl, '닉네임이 변경되었습니다.', 'success');
    } catch (err) {
      showMessage(msgEl, err.message || '닉네임 변경에 실패했습니다.', 'error');
    } finally {
      btn.disabled = false;
    }
  });
}

function setupPasswordForm(page, member) {
  const form = page.querySelector('#password-form');
  const msgEl = page.querySelector('#password-msg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msgEl.style.display = 'none';

    const oldPassword = form.oldPassword.value;
    const newPassword = form.newPassword.value;

    if (newPassword.length < 8) {
      showMessage(msgEl, '새 비밀번호는 8자 이상이어야 합니다.', 'error');
      return;
    }

    const btn = form.querySelector('button');
    btn.disabled = true;

    try {
      await apiFetch(`/api/v1/members/${member.id}/password`, {
        method: 'PATCH',
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      showMessage(msgEl, '비밀번호가 변경되었습니다.', 'success');
      form.reset();
    } catch (err) {
      showMessage(msgEl, err.message || '비밀번호 변경에 실패했습니다.', 'error');
    } finally {
      btn.disabled = false;
    }
  });
}

function setupDeleteAccount(page, member) {
  const btn = page.querySelector('#delete-account');

  btn.addEventListener('click', async () => {
    if (!confirm('정말 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    btn.disabled = true;
    btn.textContent = '삭제 중...';

    try {
      await apiFetch(`/api/v1/members/${member.id}`, {
        method: 'DELETE',
      });
      logout();
      navigate('/');
    } catch (err) {
      alert(err.message || '계정 삭제에 실패했습니다.');
      btn.disabled = false;
      btn.textContent = '계정 삭제';
    }
  });
}
