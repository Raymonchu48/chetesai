import type { MetadataRoute } from "next";
import { exercisePath, getPublicExercises, PUBLIC_SITE_URL } from "@/lib/public-exercises";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const exercises = await getPublicExercises();
  const lastModified = new Date();

  return [
    { url: PUBLIC_SITE_URL, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${PUBLIC_SITE_URL}/privacy-policy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${PUBLIC_SITE_URL}/terms-of-service`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${PUBLIC_SITE_URL}/politica-cookies`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${PUBLIC_SITE_URL}/aviso-legal`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    ...exercises.map((exercise) => ({
      url: `${PUBLIC_SITE_URL}${exercisePath(exercise.codigo_interno)}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
      images: [`${PUBLIC_SITE_URL}/api/pinterest/${exercise.codigo_interno.toLowerCase()}`],
    })),
  ];
}
