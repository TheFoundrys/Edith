import { PageSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-full p-6 md:p-8 max-w-6xl w-full mx-auto">
      <PageSkeleton />
    </div>
  );
}
