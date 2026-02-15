export function NotFound(container) {
  container.innerHTML = `
    <div class="page">
      <h1>404</h1>
      <p>Page not found.</p>
      <nav>
        <a href="/" data-link>Home</a>
      </nav>
    </div>
  `;
}
