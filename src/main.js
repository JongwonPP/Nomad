import './style.css';
import { createRouter, navigate } from './router.js';
import { isLoggedIn } from './store/auth.js';
import { Header } from './components/Header.js';
import { NotFound } from './pages/NotFound.js';
import { BoardList } from './pages/BoardList.js';
import { BoardDetail } from './pages/BoardDetail.js';
import { PostCreate } from './pages/PostCreate.js';
import { PostDetail } from './pages/PostDetail.js';
import { PostEdit } from './pages/PostEdit.js';
import { Login } from './pages/Login.js';
import { Signup } from './pages/Signup.js';
import { Profile } from './pages/Profile.js';
import { PostSearch } from './pages/PostSearch.js';
import { MyPosts } from './pages/MyPosts.js';
import { MyComments } from './pages/MyComments.js';

function withAuth(component) {
  return (container, params) => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    component(container, params);
  };
}

Header(document.getElementById('header'));

createRouter([
  { path: '/', component: BoardList },
  { path: '/login', component: Login },
  { path: '/signup', component: Signup },
  { path: '/search', component: PostSearch },
  { path: '/profile', component: withAuth(Profile) },
  { path: '/my/posts', component: withAuth(MyPosts) },
  { path: '/my/comments', component: withAuth(MyComments) },
  { path: '/boards/:boardId', component: BoardDetail },
  { path: '/boards/:boardId/posts/new', component: withAuth(PostCreate) },
  { path: '/boards/:boardId/posts/:postId', component: PostDetail },
  { path: '/boards/:boardId/posts/:postId/edit', component: withAuth(PostEdit) },
  { path: '*', component: NotFound },
]);
