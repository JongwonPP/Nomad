import './style.css';
import { createRouter } from './router.js';
import { Home } from './pages/Home.js';
import { About } from './pages/About.js';
import { NotFound } from './pages/NotFound.js';

createRouter([
  { path: '/', component: Home },
  { path: '/about', component: About },
  { path: '*', component: NotFound },
]);
