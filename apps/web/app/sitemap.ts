import type { MetadataRoute } from "next";
import { getSiteOrigin, ROUTES } from "@/lib/urls";
import { loadPublishedCatalogPrograms } from "@/lib/catalog/service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteOrigin();
  const base = origin || undefined;
  const now = new Date();

  let courseEntries: MetadataRoute.Sitemap = [];
  try {
    const courses = await loadPublishedCatalogPrograms();
    courseEntries = courses.map((course) => ({
      url: base ? `${base}${ROUTES.course(course.slug)}` : ROUTES.course(course.slug),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {
    courseEntries = [];
  }

  return [
    {
      url: base ? `${base}${ROUTES.home}` : ROUTES.home,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: base ? `${base}${ROUTES.courses}` : ROUTES.courses,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: base ? `${base}${ROUTES.personalityProfile}` : ROUTES.personalityProfile,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    ...courseEntries,
  ];
}
