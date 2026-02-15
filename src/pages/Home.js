export function Home(container) {
  container.innerHTML = `
    <div class="page">
      <h1>Nomad</h1>
      <p>Welcome to Nomad.</p>
      <nav>
        <a href="/about" data-link>About</a>
      </nav>
    </div>
  `;
}
