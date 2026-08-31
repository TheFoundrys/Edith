import { CapabilityMatrixEditor } from "@/components/admin/capability-matrix-editor";
import type { AppRole, Capability } from "@/lib/auth/roles";

export function CapabilityMatrix({
  matrix,
}: {
  matrix: Record<AppRole, Capability[]>;
}) {
  return <CapabilityMatrixEditor matrix={matrix} />;
}
