"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setDocumentVerification } from "@/lib/actions/applications";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function DocumentReviewList({
  documents,
}: {
  documents: {
    id: string;
    fieldKey: string;
    fileName: string;
    storagePath: string;
    sizeBytes: number;
    verifiedAt: string | null;
  }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  if (documents.length === 0) {
    return <p className="text-sm text-fg-muted">No documents uploaded.</p>;
  }

  return (
    <ul className="space-y-3 text-sm">
      {documents.map((doc) => {
        const href = `/api/uploads/${doc.storagePath.split("\\").join("/")}`;
        return (
          <li
            key={doc.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-3 last:border-0"
          >
            <div>
              <p>
                <span className="text-fg-muted">{doc.fieldKey}:</span> {doc.fileName}
              </p>
              <p className="text-xs text-fg-muted mt-0.5">
                {(doc.sizeBytes / 1024).toFixed(1)} KB
                {doc.verifiedAt
                  ? ` · Verified ${new Date(doc.verifiedAt).toLocaleDateString()}`
                  : " · Unverified"}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={href}
                className="text-xs underline underline-offset-2 text-fg-muted hover:text-fg"
              >
                Download
              </a>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                loading={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await setDocumentVerification(
                      doc.id,
                      !doc.verifiedAt,
                    );
                    if (result.error) {
                      toast({
                        title: "Could not update",
                        description: result.error,
                        tone: "danger",
                      });
                      return;
                    }
                    toast({
                      title: doc.verifiedAt ? "Marked unverified" : "Document verified",
                      tone: "success",
                    });
                    router.refresh();
                  })
                }
              >
                {doc.verifiedAt ? "Unverify" : "Verify"}
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
