export function Home(container) {
  container.innerHTML = `
    <div class="page home">
      <h1>Nomad</h1>
      <p class="clock"></p>
      <nav>
        <a href="/about" data-link>About</a>
      </nav>
    </div>
  `;

  const clock = container.querySelector('.clock');

  function updateClock() {
    const now = new Date();
    clock.textContent = now.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  updateClock();
  const timer = setInterval(updateClock, 1000);

  const observer = new MutationObserver(() => {
    if (!container.contains(clock)) {
      clearInterval(timer);
      observer.disconnect();
    }
  });
  observer.observe(container, { childList: true });
}
