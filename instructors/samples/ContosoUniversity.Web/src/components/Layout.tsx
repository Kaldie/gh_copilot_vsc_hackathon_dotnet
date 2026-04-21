import { NavLink, Outlet, useLocation } from "react-router-dom";
import NavBar from "./NavBar";

export default function Layout({ unreadCount = 0 }: { unreadCount?: number }) {
  const { pathname } = useLocation();
  const isFullScreen = pathname === "/schedule";

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900">
      <header className="border-b border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <NavLink to="/" className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              Contoso University
            </NavLink>
            <NavBar unreadCount={unreadCount} />
          </div>
        </div>
      </header>
      <main className={isFullScreen ? "" : "mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"}>
        <Outlet />
      </main>
    </div>
  );
}
