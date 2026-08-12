import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { enroll, getProgramBySlug } from "@frontend/services/api/programs";
import { useAuth } from "@frontend/store/auth";
import { Button } from "@frontend/components/common/button";
import { PageHeader, Panel } from "@frontend/components/layout/page";
import { formatCurrency } from "@shared/utils/string";
import { ApiClientError } from "@frontend/services/api/client";

export function CourseDetailPage() {
  const { slug = "" } = useParams();
  const { me } = useAuth();
  const [program, setProgram] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void getProgramBySlug(slug).then((r) => setProgram(r.program)).catch(() => setProgram(null));
  }, [slug]);

  if (!program) {
    return <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-fg-muted">Loading…</div>;
  }

  async function onEnroll() {
    if (!me) return;
    setLoading(true);
    setMessage(null);
    try {
      await enroll(String(program!.id));
      setMessage("Enrolled. Open My courses from your dashboard.");
    } catch (e) {
      setMessage(e instanceof ApiClientError ? e.message : "Enroll failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader title={String(program.name)} description={String(program.summary || "")} />
      <Panel className="p-5 space-y-3">
        <p className="text-sm">
          Tuition:{" "}
          {formatCurrency(
            program.tuitionAmount as number | null,
            String(program.tuitionCurrency || "INR"),
          )}
        </p>
        {!me ? (
          <Link to="/login" className="text-sm underline text-brand">
            Log in to enroll
          </Link>
        ) : me.isStaff ? (
          <p className="text-sm text-fg-muted">Staff accounts cannot enroll as students.</p>
        ) : (
          <Button loading={loading} onClick={() => void onEnroll()}>
            Enroll
          </Button>
        )}
        {message ? <p className="text-sm">{message}</p> : null}
      </Panel>
    </div>
  );
}
