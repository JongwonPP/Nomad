export function createRouter(routes) {
  function navigate(path) {
    window.history.pushState({}, '', path);
    render();
  }

  function render() {
    const path = window.location.pathname;
    const route = routes.find((r) => r.path === path) || routes.find((r) => r.path === '*');

    const app = document.getElementById('app');
    app.innerHTML = '';

    if (route) {
      route.component(app);
    }
  }

  window.addEventListener('popstate', render);

  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[data-link]');
    if (anchor) {
      e.preventDefault();
      navigate(anchor.getAttribute('href'));
    }
  });

  render();

  return { navigate };
}
