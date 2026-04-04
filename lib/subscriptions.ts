import { prisma } from "@/lib/db";
import { safeStringArray } from "@/lib/utils";

export async function listSubscriptions() {
  const items = await prisma.subscription.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      repository: true,
      collection: true,
    },
  });

  return items.map((item) => ({
    id: item.id,
    email: item.email,
    locale: item.locale,
    channel: item.channel,
    subscriptionType: item.subscriptionType,
    digestFrequency: item.digestFrequency,
    enabled: item.enabled,
    keywords: safeStringArray(item.keywordsJson),
    repository: item.repository
      ? {
          id: item.repository.id,
          fullName: item.repository.fullName,
          htmlUrl: item.repository.htmlUrl,
        }
      : null,
    collection: item.collection
      ? {
          id: item.collection.id,
          slug: item.collection.slug,
          name: item.collection.name,
          description: item.collection.description,
        }
      : null,
    lastNotifiedAt: item.lastNotifiedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));
}

export async function createSubscription(input: {
  email?: string | null;
  locale?: string;
  channel?: string;
  subscriptionType?: string;
  digestFrequency?: string;
  keywords?: string[];
  repositoryId?: number | null;
  collectionId?: number | null;
}) {
  const keywords = (input.keywords ?? []).map((item) => item.trim()).filter(Boolean);
  const subscriptionType =
    input.subscriptionType ??
    (input.collectionId ? "collection" : input.repositoryId ? "repository" : keywords.length ? "keyword" : "keyword");
  const channel = input.channel ?? (input.email ? "email" : "in_app");
  const existing = await prisma.subscription.findFirst({
    where: {
      email: input.email ?? null,
      channel,
      subscriptionType,
      repositoryId: input.repositoryId ?? null,
      collectionId: input.collectionId ?? null,
      keywordsJson: JSON.stringify(keywords),
    },
  });

  if (existing) {
    return prisma.subscription.update({
      where: { id: existing.id },
      data: {
        enabled: true,
        locale: input.locale ?? existing.locale,
        digestFrequency: input.digestFrequency ?? existing.digestFrequency,
      },
    });
  }

  return prisma.subscription.create({
    data: {
      email: input.email ?? null,
      locale: input.locale ?? "zh-CN",
      channel,
      subscriptionType,
      digestFrequency: input.digestFrequency ?? "weekly",
      keywordsJson: JSON.stringify(keywords),
      repositoryId: input.repositoryId ?? null,
      collectionId: input.collectionId ?? null,
    },
  });
}

export async function countCollectionSubscriptions(collectionId: number) {
  return prisma.subscription.count({
    where: {
      collectionId,
      enabled: true,
    },
  });
}
