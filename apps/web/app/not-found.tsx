import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-full flex items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-wide text-fg-muted">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-2 text-sm text-fg-muted">
          The page you requested does not exist or may have moved.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/">
            <Button>Home</Button>
          </Link>
          <Link href="/programs">
            <Button variant="secondary">Programs</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
