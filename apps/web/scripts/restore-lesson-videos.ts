/**
 * Re-attach catalog video URLs to AI Fluency lessons that lost them after
 * admin text edits. Preserves existing reading content.
 *
 *   npx tsx scripts/restore-lesson-videos.ts
 */
import { PrismaClient } from "@prisma/client";
import { AI_FLUENCY_LESSONS } from "../prisma/catalog-data";
import {
  extractYouTubeUrls,
  mergeLessonReadingAndVideo,
} from "../lib/learning/youtube-content";

const catalogByTitle = new Map(
  AI_FLUENCY_LESSONS.map((lesson) => [lesson.title, lesson.content]),
);

async function main() {
  const prisma = new PrismaClient();
  const lessons = await prisma.syllabusLesson.findMany({
    where: { module: { syllabus: { program: { slug: "ai-fluency" } } } },
    select: { id: true, title: true, content: true },
  });

  for (const lesson of lessons) {
    const catalogContent = catalogByTitle.get(lesson.title);
    if (!catalogContent) continue;

    const catalogUrl = extractYouTubeUrls(catalogContent)[0];
    if (!catalogUrl) continue;

    if (extractYouTubeUrls(lesson.content ?? "").length > 0) {
      console.log(`skip (has video): ${lesson.title}`);
      continue;
    }

    const merged = mergeLessonReadingAndVideo(lesson.content ?? "", catalogUrl);
    await prisma.syllabusLesson.update({
      where: { id: lesson.id },
      data: { content: merged },
    });
    console.log(`restored: ${lesson.title}`);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
