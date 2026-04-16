import { prisma } from "@/lib/db";
import { safeStringArray } from "@/lib/utils";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
}

export async function createCollectionSubmission(input: {
  name: string;
  description: string;
  tags: string[];
  repositoryNames: string[];
  submitterName?: string | null;
  submitterEmail: string;
  coverImage?: string | null;
}) {
  return prisma.collectionSubmission.create({
    data: {
      slugCandidate: slugify(input.name),
      name: input.name.trim(),
      description: input.description.trim(),
      coverImage: input.coverImage?.trim() || `signal://${slugify(input.name)}`,
      tagsJson: JSON.stringify(input.tags.map((item) => item.trim()).filter(Boolean)),
      repositoryNamesJson: JSON.stringify(input.repositoryNames.map((item) => item.trim()).filter(Boolean)),
      submitterName: input.submitterName?.trim() || null,
      submitterEmail: input.submitterEmail.trim().toLowerCase(),
    },
  });
}

export async function listCollectionSubmissions(status?: string) {
  const items = await prisma.collectionSubmission.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      publishedCollection: true,
    },
  });

  return items.map((item) => ({
    id: item.id,
    slugCandidate: item.slugCandidate,
    name: item.name,
    description: item.description,
    coverImage: item.coverImage,
    tags: safeStringArray(item.tagsJson),
    repositoryNames: safeStringArray(item.repositoryNamesJson),
    submitterName: item.submitterName,
    submitterEmail: item.submitterEmail,
    status: item.status,
    moderationNotes: item.moderationNotes,
    reviewedBy: item.reviewedBy,
    reviewedAt: item.reviewedAt?.toISOString() ?? null,
    publishedCollection: item.publishedCollection
      ? {
          id: item.publishedCollection.id,
          slug: item.publishedCollection.slug,
          name: item.publishedCollection.name,
        }
      : null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));
}

export async function assignCollectionEditor(input: {
  collectionId: number;
  name: string;
  email?: string | null;
  role?: string;
}) {
  return prisma.collectionEditor.create({
    data: {
      collectionId: input.collectionId,
      name: input.name.trim(),
      email: input.email?.trim().toLowerCase() || null,
      role: input.role?.trim() || "editor",
    },
  });
}

export async function listCollectionWorkspaces() {
  const collections = await prisma.collection.findMany({
    where: { isPublished: true },
    include: {
      editors: {
        orderBy: { createdAt: "asc" },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      _count: {
        select: {
          items: true,
          subscriptions: true,
        },
      },
    },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  return collections.map((collection) => ({
    id: collection.id,
    slug: collection.slug,
    name: collection.name,
    description: collection.description,
    coverImage: collection.coverImage,
    featured: collection.featured,
    tags: collection.tags.map((item) => item.tag.name),
    repositoryCount: collection._count.items,
    subscriptionCount: collection._count.subscriptions,
    editors: collection.editors.map((editor) => ({
      id: editor.id,
      name: editor.name,
      email: editor.email,
      role: editor.role,
      status: editor.status,
    })),
  }));
}

export async function reviewCollectionSubmission(input: {
  submissionId: number;
  action: "approve" | "reject";
  moderationNotes?: string | null;
  reviewedBy?: string | null;
}) {
  const submission = await prisma.collectionSubmission.findUnique({
    where: { id: input.submissionId },
  });

  if (!submission) {
    return null;
  }

  if (input.action === "reject") {
    return prisma.collectionSubmission.update({
      where: { id: submission.id },
      data: {
        status: "rejected",
        moderationNotes: input.moderationNotes?.trim() || null,
        reviewedBy: input.reviewedBy?.trim() || "moderator",
        reviewedAt: new Date(),
      },
    });
  }

  const repositoryNames = safeStringArray(submission.repositoryNamesJson);
  const repositories = repositoryNames.length
    ? await prisma.repository.findMany({
        where: {
          fullName: {
            in: repositoryNames,
          },
        },
      })
    : [];
  const tags = safeStringArray(submission.tagsJson);
  const slug = submission.slugCandidate || slugify(submission.name);

  return prisma.$transaction(async (tx) => {
    const collection = await tx.collection.upsert({
      where: { slug },
      update: {
        name: submission.name,
        description: submission.description,
        coverImage: submission.coverImage,
        curationSource: "community",
        isPublished: true,
      },
      create: {
        slug,
        name: submission.name,
        description: submission.description,
        coverImage: submission.coverImage,
        curationSource: "community",
        isPublished: true,
      },
    });

    await tx.collectionItem.deleteMany({
      where: {
        collectionId: collection.id,
      },
    });
    await tx.collectionTagMap.deleteMany({
      where: {
        collectionId: collection.id,
      },
    });

    for (const tagName of tags) {
      const tag = await tx.collectionTag.upsert({
        where: { slug: slugify(tagName) },
        update: { name: tagName },
        create: {
          slug: slugify(tagName),
          name: tagName,
        },
      });

      await tx.collectionTagMap.create({
        data: {
          collectionId: collection.id,
          tagId: tag.id,
        },
      });
    }

    if (repositories.length) {
      await tx.collectionItem.createMany({
        data: repositories.map((repository, index) => ({
          collectionId: collection.id,
          repositoryId: repository.id,
          position: index + 1,
          note: "Submitted by community review flow.",
        })),
      });
    }

    const existingEditor = await tx.collectionEditor.findFirst({
      where: {
        collectionId: collection.id,
        email: submission.submitterEmail,
      },
    });

    if (!existingEditor) {
      await tx.collectionEditor.create({
        data: {
          collectionId: collection.id,
          name: submission.submitterName?.trim() || submission.submitterEmail,
          email: submission.submitterEmail,
          role: "community-editor",
        },
      });
    }

    return tx.collectionSubmission.update({
      where: { id: submission.id },
      data: {
        status: "approved",
        moderationNotes: input.moderationNotes?.trim() || null,
        reviewedBy: input.reviewedBy?.trim() || "moderator",
        reviewedAt: new Date(),
        publishedCollectionId: collection.id,
      },
    });
  });
}
