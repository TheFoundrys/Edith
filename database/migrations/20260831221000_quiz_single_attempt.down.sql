DROP INDEX IF EXISTS "QuizAttempt_quizId_userId_key";

CREATE INDEX "QuizAttempt_quizId_userId_idx"
ON "QuizAttempt"("quizId", "userId");
