import { isLoggedIn, getUser, logout, onAuthChange } from '../store/auth.js';

export function Header(container) {
  function render() {
    const loggedIn = isLoggedIn();
    const user = loggedIn ? getUser() : null;

    container.innerHTML = `
      <header class="site-header">
        <div class="header-inner">
          <a href="/" data-link class="logo">Nomad</a>
          <nav>
            ${loggedIn ? `
              <span>${user?.nickname || ''}</span>
              <a href="/profile" data-link>프로필</a>
              <button class="btn btn-sm header-logout">로그아웃</button>
            ` : `
              <a href="/login" data-link>로그인</a>
              <a href="/signup" data-link>회원가입</a>
            `}
          </nav>
        </div>
      </header>
    `;

    const logoutBtn = container.querySelector('.header-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        logout();
      });
    }
  }

  render();
  onAuthChange(render);
}
