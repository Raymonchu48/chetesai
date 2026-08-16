import type { MetadataRoute } from "next";
import { exercisePath, getPublicExercises, PUBLIC_SITE_URL } from "@/lib/public-exercises";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const exercises = await getPublicExercises();
  const lastModified = new Date();

  return [
    { url: PUBLIC_SITE_URL, lastModified, changeFrequency: "weekly", priority: 1 },
    ...exercises.map((exercise) => ({
      url: `${PUBLIC_SITE_URL}${exercisePath(exercise.codigo_interno)}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
      images: [`${PUBLIC_SITE_URL}/api/pinterest/${exercise.codigo_interno.toLowerCase()}`],
    })),
  ];
}
