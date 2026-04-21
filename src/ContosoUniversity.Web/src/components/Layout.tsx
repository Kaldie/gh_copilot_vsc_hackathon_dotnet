import { NavLink, Outlet } from "react-router-dom";
import NavBar from "./NavBar";

export default function Layout({ unreadCount = 0 }: { unreadCount?: number }) {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <NavLink to="/" className="text-lg font-semibold tracking-tight text-gray-900">
              Contoso University
            </NavLink>
            <NavBar unreadCount={unreadCount} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
