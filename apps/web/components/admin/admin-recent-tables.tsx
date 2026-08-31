import Link from "next/link";
import type { AdminRecentCourse, AdminRecentEnrollment } from "@/lib/admin/dashboard-data";
import { TRACK_LABELS } from "@/lib/programs/track";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AdminRecentEnrollmentsTable({
  rows,
}: {
  rows: AdminRecentEnrollment[];
}) {
  return (
    <section className="admin-dash-panel">
      <div className="admin-dash-panel-head">
        <h2 className="admin-dash-panel-title">Recent Enrollments</h2>
        <Link href="/admin/members" className="admin-dash-panel-link">
          View all
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="admin-dash-empty">No enrollments yet.</p>
      ) : (
        <div className="admin-dash-table-wrap">
          <table className="admin-dash-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Course</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link href={row.userHref} className="admin-dash-user-cell">
                      <span className="admin-dash-avatar" aria-hidden>
                        {initials(row.userName)}
                      </span>
                      <span>
                        <span className="admin-dash-cell-primary">{row.userName}</span>
                        <span className="admin-dash-cell-secondary">{row.userEmail}</span>
                      </span>
                    </Link>
                  </td>
                  <td>
                    <Link href={row.courseHref} className="admin-dash-course-cell">
                      <span className="admin-dash-badge">{row.categoryLabel}</span>
                      <span className="admin-dash-cell-primary block mt-1">{row.courseTitle}</span>
                    </Link>
                  </td>
                  <td>
                    <span className="admin-dash-cell-primary">{row.dateLabel}</span>
                    <span className="admin-dash-cell-secondary block">{row.timeLabel}</span>
                  </td>
                  <td>
                    <span
                      className={
                        row.status === "Completed"
                          ? "admin-dash-status admin-dash-status-success"
                          : "admin-dash-status admin-dash-status-info"
                      }
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function AdminRecentCoursesTable({ rows }: { rows: AdminRecentCourse[] }) {
  return (
    <section className="admin-dash-panel">
      <div className="admin-dash-panel-head">
        <h2 className="admin-dash-panel-title">Recent Courses</h2>
        <Link href="/admin/programs" className="admin-dash-panel-link">
          View all
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="admin-dash-empty">No courses yet.</p>
      ) : (
        <div className="admin-dash-table-wrap">
          <table className="admin-dash-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Students</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link href={row.href} className="admin-dash-course-cell">
                      <span className="admin-dash-course-icon" aria-hidden>
                        {TRACK_LABELS[row.track].slice(0, 1)}
                      </span>
                      <span>
                        <span className="admin-dash-cell-primary">{row.title}</span>
                        <span className="admin-dash-cell-secondary">{row.categoryLabel}</span>
                      </span>
                    </Link>
                  </td>
                  <td>
                    <span className="admin-dash-cell-primary">{row.students}</span>
                  </td>
                  <td>
                    <span
                      className={
                        row.status === "PUBLISHED"
                          ? "admin-dash-status admin-dash-status-success"
                          : "admin-dash-status admin-dash-status-neutral"
                      }
                    >
                      {row.status === "PUBLISHED" ? "Published" : "Draft"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
