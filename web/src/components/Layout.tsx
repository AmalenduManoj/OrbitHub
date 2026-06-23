import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotif } from '../context/NotificationContext';

export default function Layout() {
  const { user } = useAuth();
  const { unreadCount } = useNotif();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Feed', icon: 'home' },
    { path: '/search', label: 'Search', icon: 'search' },
    { path: '/circles', label: 'Circles', icon: 'users' },
    { path: '/notifications', label: 'Notifications', icon: 'bell' },
    { path: '/highlights', label: 'Saved', icon: 'bookmark' },
  ] as const;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-nav/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 h-12 max-w-2xl mx-auto w-full">
          <Link to="/" className="text-lg font-bold text-primary tracking-tight">
            Orbit
          </Link>
          <Link
            to={user ? `/profile/${user.id}` : '/login'}
            className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center overflow-hidden transition-all duration-150 hover:ring-1 hover:ring-primary/40"
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-white">
                {user?.username[0]?.toUpperCase()}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 pb-28">
        <Outlet />
      </main>

      {/* Floating pill nav */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-nav/80 backdrop-blur-xl border border-[#2C2C2E] rounded-2xl px-3 py-1.5 flex items-center justify-around gap-1">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-150 ${
                active ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <div className="relative">
                <svg
                  className="w-5 h-5"
                  fill={active ? 'currentColor' : 'none'}
                  viewBox="0 0 24 24"
                  stroke={active ? 'none' : 'currentColor'}
                  strokeWidth={active ? 0 : 1.5}
                >
                  {item.icon === 'home' && (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  )}
                  {item.icon === 'search' && (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  )}
                  {item.icon === 'users' && (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  )}
                  {item.icon === 'bell' && (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  )}
                  {item.icon === 'bookmark' && (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  )}
                </svg>
                {item.icon === 'bell' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5 leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
