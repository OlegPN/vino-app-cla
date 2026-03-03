import { createBrowserRouter } from 'react-router';
import Root from './pages/Root';
import Home from './pages/Home';
import Explore from './pages/Explore';
import MyWines from './pages/MyWines';
import More from './pages/More';
import WineDetail from './pages/WineDetail';
import WineryDetail from './pages/WineryDetail';
import Journal from './pages/Journal';
import ArticleDetail from './pages/ArticleDetail';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: 'explore', Component: Explore },
      { path: 'my-wines', Component: MyWines },
      { path: 'journal', Component: Journal },
      { path: 'more', Component: More },
      { path: 'wine/:id', Component: WineDetail },
      { path: 'winery/:id', Component: WineryDetail },
      { path: 'article/:id', Component: ArticleDetail },
    ],
  },
]);