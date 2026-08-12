import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { APP_NAME } from "@shared/constants/brand";
import { useAuth } from "@frontend/store/auth";
import { Button } from "@frontend/components/common/button";

export function MarketingLayout() {
  const { me, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-border bg-bg-elevated">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="font-display text-xl text-brand tracking-tight">
            {APP_NAME}
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <NavLink to="/courses" className="text-fg-muted hover:text-fg">
              Courses
            </NavLink>
            <NavLink to="/programs" className="text-fg-muted hover:text-fg">
              Programs
            </NavLink>
            {me ? (
              <>
                <NavLink
                  to={me.isStaff ? "/admin" : "/student/dashboard"}
                  className="text-fg-muted hover:text-fg"
                >
                  {me.isStaff ? "Admin" : "Dashboard"}
                </NavLink>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void logout().then(() => navigate("/"))}
                >
                  Log out
                </Button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="text-fg-muted hover:text-fg">
                  Log in
                </NavLink>
                <Link
                  to="/register"
                  className="inline-flex h-8 items-center px-3 text-xs tracking-wide rounded-[var(--radius-sm)] bg-accent text-accent-fg"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-fg-muted">
        {APP_NAME} — Map Your Future.
      </footer>
    </div>
  );
}
