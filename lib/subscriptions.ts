import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { getCollectionDetail } from "@/lib/collections";
import { getDashboardData } from "@/lib/dashboard";
import { getRepositoryTrend } from "@/lib/archive";
import { safeStringArray } from "@/lib/utils";

function createToken() {
  return randomUUID().replaceAll("-", "");
}

function normalizeEmail(value?: string | null) {
  const email = value?.trim().toLowerCase() ?? "";
  return email || null;
}

function normalizeChannel(value?: string | null) {
  const channel = value?.trim().toLowerCase();
  return channel || "in_app";
}

function resolveChannel(channel: string, email: string | null) {
  if (channel === "email" && !email) {
    return "in_app";
  }

  return channel;
}

function normalizeFrequency(value?: string | null) {
  const frequency = value?.trim().toLowerCase();
  return frequency === "monthly" ? "monthly" : "weekly";
}

function getVerificationStatus(input: {
  channel: string;
  email: string | null;
  verifiedAt: Date | null;
}) {
  if (input.channel === "in_app") {
    return "not_required";
  }

  if (input.channel === "wecom_webhook" || input.channel === "feishu_webhook" || input.channel === "webhook") {
    return "verified";
  }

  if (!input.email) {
    return "not_required";
  }

  return input.verifiedAt ? "verified" : "pending";
}

function safeJsonObject(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function parseChannels(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function serializeChannels(channels: string[]) {
  return JSON.stringify(Array.from(new Set(channels.map((item) => item.trim()).filter(Boolean))));
}

function buildCollectionDigestSubject(name: string, frequency: string) {
  return frequency === "monthly" ? `Monthly collection digest: ${name}` : `Weekly collection digest: ${name}`;
}

function buildKeywordDigestSubject(keywords: string[], frequency: string) {
  const head = keywords.slice(0, 3).join(", ");
  return frequency === "monthly" ? `Monthly keyword digest: ${head}` : `Weekly keyword digest: ${head}`;
}

function buildRepositoryDigestSubject(fullName: string, frequency: string) {
  return frequency === "monthly" ? `Monthly repository digest: ${fullName}` : `Weekly repository digest: ${fullName}`;
}

async function ensureSubscriber(input: {
  email: string | null;
  locale: string;
  channel: string;
}) {
  if (!input.email) {
    return null;
  }

  const existing = await prisma.subscriber.findUnique({
    where: { email: input.email },
  });

  const nextChannels = existing
    ? serializeChannels([...parseChannels(existing.channelsJson), input.channel])
    : serializeChannels([input.channel]);

  if (existing) {
    return prisma.subscriber.update({
      where: { id: existing.id },
      data: {
        locale: input.locale || existing.locale,
        channelsJson: nextChannels,
      },
    });
  }

  return prisma.subscriber.create({
    data: {
      email: input.email,
      locale: input.locale,
      verificationToken: createToken(),
      manageToken: createToken(),
      channelsJson: nextChannels,
    },
  });
}

async function buildCollectionDigestBody(subscription: {
  collection: { slug: string; name: string } | null;
  digestFrequency: string;
  notifyOnNewRepos: boolean;
}) {
  if (!subscription.collection) {
    return {
      subject: buildCollectionDigestSubject("Collection", subscription.digestFrequency),
      body: "Collection data is currently unavailable.",
      payload: {},
    };
  }

  const detail = await getCollectionDetail(subscription.collection.slug);
  const repositories = detail?.repositories.slice(0, subscription.notifyOnNewRepos ? 8 : 5) ?? [];
  const body = [
    buildCollectionDigestSubject(subscription.collection.name, subscription.digestFrequency),
    "",
    detail?.description ?? "",
    "",
    ...repositories.map((repo, index) => `${index + 1}. ${repo.fullName} | weekly stars +${repo.weeklyStars} | total stars ${repo.stars}`),
  ].join("\n");

  return {
    subject: buildCollectionDigestSubject(subscription.collection.name, subscription.digestFrequency),
    body,
    payload: {
      slug: subscription.collection.slug,
      repositories: repositories.map((repo) => repo.fullName),
    },
  };
}

async function buildKeywordDigestBody(subscription: {
  keywords: string[];
  digestFrequency: string;
}) {
  const dashboard = await getDashboardData({ range: subscription.digestFrequency === "monthly" ? "month" : "week" });
  const keywords = subscription.keywords.map((item) => item.toLowerCase());
  const matches = dashboard.items.filter((item) => {
    const text = `${item.fullName} ${item.description ?? ""} ${item.language ?? ""} ${item.topics.join(" ")}`.toLowerCase();
    return keywords.some((keyword) => text.includes(keyword));
  });
  const body = [
    buildKeywordDigestSubject(subscription.keywords, subscription.digestFrequency),
    "",
    ...matches.slice(0, 10).map((item, index) => `${index + 1}. ${item.fullName} | range stars +${item.rangeStars} | ${item.hotReason}`),
  ].join("\n");

  return {
    subject: buildKeywordDigestSubject(subscription.keywords, subscription.digestFrequency),
    body,
    payload: {
      keywords: subscription.keywords,
      repositories: matches.slice(0, 10).map((item) => item.fullName),
    },
  };
}

async function buildRepositoryDigestBody(subscription: {
  repository: { fullName: string } | null;
  digestFrequency: string;
}) {
  if (!subscription.repository) {
    return {
      subject: buildRepositoryDigestSubject("Repository", subscription.digestFrequency),
      body: "Repository data is currently unavailable.",
      payload: {},
    };
  }

  const detail = await getRepositoryTrend(subscription.repository.fullName);
  const body = [
    buildRepositoryDigestSubject(subscription.repository.fullName, subscription.digestFrequency),
    "",
    detail?.description ?? "",
    "",
    ...(detail?.starDailyStats.slice(-7).map((item) => `${item.date}: +${item.starsAdded} stars`) ?? []),
  ].join("\n");

  return {
    subject: buildRepositoryDigestSubject(subscription.repository.fullName, subscription.digestFrequency),
    body,
    payload: {
      repository: subscription.repository.fullName,
      recentDays: detail?.starDailyStats.slice(-7) ?? [],
    },
  };
}

export async function listSubscriptions(input?: {
  manageToken?: string | null;
  includeDisabled?: boolean;
  email?: string | null;
  limit?: number;
}) {
  let subscriberId: number | undefined;

  if (input?.manageToken) {
    const subscriber = await prisma.subscriber.findUnique({
      where: { manageToken: input.manageToken },
    });

    if (!subscriber) {
      return [];
    }

    subscriberId = subscriber.id;
  }

  const items = await prisma.subscription.findMany({
    where: {
      ...(input?.includeDisabled ? {} : { enabled: true }),
      ...(subscriberId ? { subscriberId } : {}),
      ...(input?.email ? { email: normalizeEmail(input.email) } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: input?.limit ?? 200,
    include: {
      subscriber: true,
      repository: true,
      collection: true,
      deliveryJobs: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          logs: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  return items.map((item) => ({
    id: item.id,
    email: item.email,
    locale: item.locale,
    channel: item.channel,
    channelTarget: item.channelTarget,
    subscriptionType: item.subscriptionType,
    digestFrequency: item.digestFrequency,
    enabled: item.enabled,
    verificationStatus: item.verificationStatus,
    notifyOnNewRepos: item.notifyOnNewRepos,
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
    subscriber: item.subscriber
      ? {
          id: item.subscriber.id,
          email: item.subscriber.email,
          verifiedAt: item.subscriber.verifiedAt?.toISOString() ?? null,
          verificationToken: item.subscriber.verificationToken,
          manageToken: item.subscriber.manageToken,
          channels: parseChannels(item.subscriber.channelsJson),
        }
      : null,
    lastNotifiedAt: item.lastNotifiedAt?.toISOString() ?? null,
    lastDigestAt: item.lastDigestAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    deliveryJobs: item.deliveryJobs.map((job) => ({
      id: job.id,
      channel: job.channel,
      status: job.status,
      subject: job.subject,
      body: job.body,
      payload: safeJsonObject(job.payloadJson),
      scheduledFor: job.scheduledFor.toISOString(),
      sentAt: job.sentAt?.toISOString() ?? null,
      createdAt: job.createdAt.toISOString(),
      logs: job.logs.map((log) => ({
        id: log.id,
        level: log.level,
        message: log.message,
        payload: safeJsonObject(log.payloadJson),
        createdAt: log.createdAt.toISOString(),
      })),
    })),
  }));
}

export async function createSubscription(input: {
  email?: string | null;
  locale?: string;
  channel?: string;
  channelTarget?: string | null;
  subscriptionType?: string;
  digestFrequency?: string;
  keywords?: string[];
  repositoryId?: number | null;
  collectionId?: number | null;
  notifyOnNewRepos?: boolean;
}) {
  const locale = input.locale ?? "zh-CN";
  const email = normalizeEmail(input.email);
  const channel = resolveChannel(normalizeChannel(input.channel), email);
  const digestFrequency = normalizeFrequency(input.digestFrequency);
  const keywords = (input.keywords ?? []).map((item) => item.trim()).filter(Boolean);
  const subscriber = await ensureSubscriber({ email, locale, channel });
  const verificationStatus = getVerificationStatus({
    channel,
    email,
    verifiedAt: subscriber?.verifiedAt ?? null,
  });
  const subscriptionType =
    input.subscriptionType ??
    (input.collectionId ? "collection" : input.repositoryId ? "repository" : keywords.length ? "keyword" : "keyword");
  const existing = await prisma.subscription.findFirst({
    where: {
      subscriberId: subscriber?.id ?? null,
      email,
      channel,
      channelTarget: input.channelTarget?.trim() || null,
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
        locale,
        digestFrequency,
        verificationStatus,
        notifyOnNewRepos: input.notifyOnNewRepos ?? existing.notifyOnNewRepos,
      },
    });
  }

  return prisma.subscription.create({
    data: {
      subscriberId: subscriber?.id ?? null,
      email,
      locale,
      channel,
      channelTarget: input.channelTarget?.trim() || null,
      subscriptionType,
      digestFrequency,
      verificationStatus,
      notifyOnNewRepos: input.notifyOnNewRepos ?? true,
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

export async function verifySubscriber(token: string) {
  const subscriber = await prisma.subscriber.findUnique({
    where: { verificationToken: token },
  });

  if (!subscriber) {
    return null;
  }

  const verifiedAt = new Date();
  await prisma.$transaction([
    prisma.subscriber.update({
      where: { id: subscriber.id },
      data: { verifiedAt },
    }),
    prisma.subscription.updateMany({
      where: {
        subscriberId: subscriber.id,
        verificationStatus: "pending",
      },
      data: {
        verificationStatus: "verified",
      },
    }),
  ]);

  return prisma.subscriber.findUnique({
    where: { id: subscriber.id },
  });
}

export async function updateSubscriptionState(input: {
  subscriptionId: number;
  enabled?: boolean;
  digestFrequency?: string;
  notifyOnNewRepos?: boolean;
}) {
  return prisma.subscription.update({
    where: { id: input.subscriptionId },
    data: {
      ...(typeof input.enabled === "boolean" ? { enabled: input.enabled } : {}),
      ...(input.digestFrequency ? { digestFrequency: normalizeFrequency(input.digestFrequency) } : {}),
      ...(typeof input.notifyOnNewRepos === "boolean" ? { notifyOnNewRepos: input.notifyOnNewRepos } : {}),
    },
  });
}

export async function unsubscribeSubscription(subscriptionId: number) {
  return prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      enabled: false,
    },
  });
}

export async function scheduleDigestDeliveries(input?: {
  frequency?: "weekly" | "monthly";
  triggeredBy?: string;
}) {
  const frequency = input?.frequency ?? "weekly";
  const subscriptions = await prisma.subscription.findMany({
    where: {
      enabled: true,
      digestFrequency: frequency,
      OR: [{ verificationStatus: "verified" }, { verificationStatus: "not_required" }],
    },
    include: {
      subscriber: true,
      repository: true,
      collection: true,
    },
  });

  let created = 0;

  for (const subscription of subscriptions) {
    const existing = await prisma.deliveryJob.findFirst({
      where: {
        subscriptionId: subscription.id,
        status: { in: ["pending", "processing"] },
      },
    });

    if (existing) {
      continue;
    }

    const digest =
      subscription.subscriptionType === "collection"
        ? await buildCollectionDigestBody({
            collection: subscription.collection
              ? { slug: subscription.collection.slug, name: subscription.collection.name }
              : null,
            digestFrequency: frequency,
            notifyOnNewRepos: subscription.notifyOnNewRepos,
          })
        : subscription.subscriptionType === "repository"
          ? await buildRepositoryDigestBody({
              repository: subscription.repository ? { fullName: subscription.repository.fullName } : null,
              digestFrequency: frequency,
            })
          : await buildKeywordDigestBody({
              keywords: safeStringArray(subscription.keywordsJson),
              digestFrequency: frequency,
            });

    await prisma.deliveryJob.create({
      data: {
        subscriptionId: subscription.id,
        subscriberId: subscription.subscriberId,
        channel: subscription.channel,
        subject: digest.subject,
        body: digest.body,
        payloadJson: JSON.stringify({
          ...digest.payload,
          triggeredBy: input?.triggeredBy ?? "system",
          notifyOnNewRepos: subscription.notifyOnNewRepos,
        }),
      },
    });
    created += 1;
  }

  return {
    created,
    frequency,
  };
}

async function deliverWebhook(channelTarget: string, payload: unknown) {
  const response = await fetch(channelTarget, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Webhook delivery failed with ${response.status}`);
  }

  return response.status;
}

async function deliverEmail(input: {
  to: string;
  subject: string;
  body: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const replyTo = process.env.EMAIL_REPLY_TO?.trim();

  if (!apiKey || !from) {
    return {
      mode: "outbox",
      provider: "none",
      providerMessageId: null,
    } as const;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      text: input.body,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`Email delivery failed with ${response.status}`);
  }

  const payload = (await response.json()) as { id?: string };

  return {
    mode: "provider",
    provider: "resend",
    providerMessageId: payload.id ?? null,
  } as const;
}

export async function processPendingDeliveries() {
  const jobs = await prisma.deliveryJob.findMany({
    where: {
      status: "pending",
      scheduledFor: { lte: new Date() },
    },
    orderBy: { createdAt: "asc" },
    include: {
      subscription: {
        include: {
          subscriber: true,
        },
      },
    },
  });

  let delivered = 0;
  let failed = 0;

  for (const job of jobs) {
    await prisma.deliveryJob.update({
      where: { id: job.id },
      data: {
        status: "processing",
      },
    });

    try {
      await prisma.deliveryLog.create({
        data: {
          deliveryJobId: job.id,
          message: "Delivery picked up by worker.",
          payloadJson: JSON.stringify({ channel: job.channel }),
        },
      });

      if (
        (job.channel === "webhook" || job.channel === "wecom_webhook" || job.channel === "feishu_webhook") &&
        job.subscription.channelTarget
      ) {
        await deliverWebhook(job.subscription.channelTarget, {
          subject: job.subject,
          body: job.body,
          payload: safeJsonObject(job.payloadJson),
        });
      }

      let deliveryMessage =
        job.channel === "in_app"
          ? "Delivered to in-app outbox."
          : job.channel === "email"
            ? "Delivered to email outbox."
            : "Delivered to webhook channel.";
      let deliveryMeta: Record<string, unknown> = {
        preview: job.body.slice(0, 200),
      };

      if (job.channel === "email" && job.subscription.subscriber?.email) {
        const emailResult = await deliverEmail({
          to: job.subscription.subscriber.email,
          subject: job.subject,
          body: job.body,
        });
        deliveryMeta = {
          ...deliveryMeta,
          ...emailResult,
        };
        deliveryMessage =
          emailResult.mode === "provider"
            ? "Delivered through configured email provider."
            : "Email provider not configured; stored in email outbox.";
      }

      await prisma.$transaction([
        prisma.deliveryJob.update({
          where: { id: job.id },
          data: {
            status: "delivered",
            sentAt: new Date(),
          },
        }),
        prisma.deliveryLog.create({
          data: {
            deliveryJobId: job.id,
            message: deliveryMessage,
            payloadJson: JSON.stringify(deliveryMeta),
          },
        }),
        prisma.subscription.update({
          where: { id: job.subscriptionId },
          data: {
            lastNotifiedAt: new Date(),
            lastDigestAt: new Date(),
          },
        }),
      ]);
      delivered += 1;
    } catch (error) {
      await prisma.$transaction([
        prisma.deliveryJob.update({
          where: { id: job.id },
          data: {
            status: "failed",
          },
        }),
        prisma.deliveryLog.create({
          data: {
            deliveryJobId: job.id,
            level: "error",
            message: error instanceof Error ? error.message : "Unknown delivery error",
          },
        }),
      ]);
      failed += 1;
    }
  }

  return {
    processed: jobs.length,
    delivered,
    failed,
  };
}

export async function listRecentDeliveryJobs(input?: {
  limit?: number;
  manageToken?: string | null;
}) {
  let subscriberId: number | undefined;

  if (input?.manageToken) {
    const subscriber = await prisma.subscriber.findUnique({
      where: { manageToken: input.manageToken },
    });

    if (!subscriber) {
      return [];
    }

    subscriberId = subscriber.id;
  }

  const jobs = await prisma.deliveryJob.findMany({
    where: {
      ...(subscriberId ? { subscriberId } : {}),
    },
    include: {
      subscription: {
        include: {
          repository: true,
          collection: true,
        },
      },
      logs: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: input?.limit ?? 50,
  });

  return jobs.map((job) => ({
    id: job.id,
    subscriptionId: job.subscriptionId,
    channel: job.channel,
    status: job.status,
    subject: job.subject,
    body: job.body,
    payload: safeJsonObject(job.payloadJson),
    scheduledFor: job.scheduledFor.toISOString(),
    sentAt: job.sentAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
    subscription: {
      id: job.subscription.id,
      type: job.subscription.subscriptionType,
      repository: job.subscription.repository?.fullName ?? null,
      collection: job.subscription.collection?.name ?? null,
    },
    logs: job.logs.map((log) => ({
      id: log.id,
      level: log.level,
      message: log.message,
      payload: safeJsonObject(log.payloadJson),
      createdAt: log.createdAt.toISOString(),
    })),
  }));
}
