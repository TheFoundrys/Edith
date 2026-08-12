import { Link, NavLink, Outlet, Navigate } from "react-router-dom";
import { APP_NAME } from "@shared/constants/brand";
import { STUDENT_NAV } from "@shared/constants/roles";
import { useAuth } from "@frontend/store/auth";
import { Button } from "@frontend/components/common/button";

export function StudentLayout() {
  const { loading, me, logout } = useAuth();
  if (loading) return <div className="p-8 text-sm text-fg-muted">Loading…</div>;
  if (!me) return <Navigate to="/login" replace />;
  if (me.isStaff) return <Navigate to="/admin" replace />;

  return (
    <div className="min-h-full flex">
      <aside className="w-56 shrink-0 border-r border-border bg-bg-elevated p-4">
        <Link to="/student/dashboard" className="font-display text-lg text-brand block mb-6">
          {APP_NAME}
        </Link>
        <nav className="flex flex-col gap-1 text-sm">
          {STUDENT_NAV.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                `px-2 py-1.5 rounded-[var(--radius-sm)] ${
                  isActive ? "bg-brand text-accent-fg" : "text-fg-muted hover:text-fg"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Button variant="ghost" size="sm" className="mt-6" onClick={() => void logout()}>
          Log out
        </Button>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
