import { McqGenerationStatus } from "@prisma/client";

/** Status after bulk JSON import — append to a live bank stays READY. */
export function resolveMcqStatusAfterImport(opts: {
  wasReady: boolean;
  replace: boolean;
}): { status: McqGenerationStatus; needsRepublish: boolean } {
  const needsRepublish = opts.replace || !opts.wasReady;
  return {
    status:
      opts.replace || !opts.wasReady
        ? McqGenerationStatus.PENDING
        : McqGenerationStatus.READY,
    needsRepublish,
  };
}
