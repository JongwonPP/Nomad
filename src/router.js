let _navigate;

function compileRoute(path) {
  if (path === '*') {
    return { regex: /.*/, keys: [] };
  }
  const keys = [];
  const pattern = path
    .replace(/:([^/]+)/g, (_, key) => {
      keys.push(key);
      return '([^/]+)';
    });
  return { regex: new RegExp('^' + pattern + '$'), keys };
}

export function navigate(path) {
  if (_navigate) {
    _navigate(path);
  }
}

export function createRouter(routes) {
  const compiled = routes.map((r) => ({
    ...r,
    ...compileRoute(r.path),
  }));

  function _nav(path) {
    window.history.pushState({}, '', path);
    render();
  }

  _navigate = _nav;

  function render() {
    const path = window.location.pathname;
    let params = {};
    let matched = null;

    for (const route of compiled) {
      const match = path.match(route.regex);
      if (match) {
        matched = route;
        route.keys.forEach((key, i) => {
          params[key] = match[i + 1];
        });
        break;
      }
    }

    const app = document.getElementById('app');
    app.innerHTML = '';

    if (matched) {
      matched.component(app, params);
    }
  }

  window.addEventListener('popstate', render);

  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[data-link]');
    if (anchor) {
      e.preventDefault();
      _nav(anchor.getAttribute('href'));
    }
  });

  render();

  return { navigate: _nav };
}
