import { getCollectionsIndex } from "@/lib/collections";

export async function getTopicBoards() {
  const collections = await getCollectionsIndex();

  return collections.map((collection) => ({
    name: collection.name,
    summary: collection.description,
    items: collection.topRepositories.map((item) => ({
      fullName: item.fullName,
      htmlUrl: item.htmlUrl,
      language: item.language,
      weeklyStars: item.weeklyStars,
      stars: item.stars,
      hotReason: item.hotReason,
    })),
  }));
}
