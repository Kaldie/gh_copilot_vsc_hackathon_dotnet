import { NavLink } from "react-router-dom";

const links = [
  { to: "/students", label: "Students" },
  { to: "/courses", label: "Courses" },
  { to: "/instructors", label: "Instructors" },
  { to: "/departments", label: "Departments" },
  { to: "/statistics", label: "Statistics" },
  { to: "/notifications", label: "Notifications" },
];

export default function NavBar({ unreadCount = 0 }: { unreadCount?: number }) {
  return (
    <nav className="flex items-center space-x-1">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            }`
          }
        >
          {link.label}
          {link.to === "/notifications" && unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
