import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import StoryView from './pages/StoryView';
import Circles from './pages/Circles';
import CircleDetail from './pages/CircleDetail';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Highlights from './pages/Highlights';
import HighlightDetail from './pages/HighlightDetail';
import Notifications from './pages/Notifications';
import Search from './pages/Search';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            element={
              <ProtectedRoute>
                <NotificationProvider>
                  <Layout />
                </NotificationProvider>
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Feed />} />
            <Route path="/stories/:id" element={<StoryView />} />
            <Route path="/circles" element={<Circles />} />
            <Route path="/circles/:id" element={<CircleDetail />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/highlights" element={<Highlights />} />
            <Route path="/highlights/:id" element={<HighlightDetail />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/search" element={<Search />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
