DELETE FROM "QuizAttempt" older
USING "QuizAttempt" newer
WHERE older."quizId" = newer."quizId"
  AND older."userId" = newer."userId"
  AND (
    older."submittedAt" < newer."submittedAt"
    OR (
      older."submittedAt" = newer."submittedAt"
      AND older."id" < newer."id"
    )
  );

DROP INDEX IF EXISTS "QuizAttempt_quizId_userId_idx";

CREATE UNIQUE INDEX "QuizAttempt_quizId_userId_key"
ON "QuizAttempt"("quizId", "userId");
