import type { DashboardItem } from "@/lib/dashboard-types";

export type CollectionSeedDefinition = {
  slug: string;
  name: string;
  description: string;
  coverImage?: string;
  tags: string[];
  featured: boolean;
  sortOrder: number;
  match: string[];
};

export const collectionSeedDefinitions: CollectionSeedDefinition[] = [
  {
    slug: "ai-agents",
    name: "AI Agents",
    description: "Fast-moving repositories for agent runtimes, orchestration layers, prompts, and LLM-native tooling.",
    coverImage: "signal://ai-agents",
    tags: ["AI", "Agents", "LLM"],
    featured: true,
    sortOrder: 10,
    match: ["ai", "llm", "agent", "rag", "prompt", "model"],
  },
  {
    slug: "frontend-systems",
    name: "Frontend Systems",
    description: "Curated frontend infrastructure, component tooling, frameworks, and design-system adjacent repositories.",
    coverImage: "signal://frontend-systems",
    tags: ["Frontend", "UI", "DX"],
    featured: true,
    sortOrder: 20,
    match: ["react", "next", "frontend", "ui", "design", "component", "tailwind"],
  },
  {
    slug: "cloud-infrastructure",
    name: "Cloud Infrastructure",
    description: "Infrastructure, platform engineering, containers, orchestration, and cloud-facing repos with visible momentum.",
    coverImage: "signal://cloud-infrastructure",
    tags: ["Infrastructure", "Cloud", "DevOps"],
    featured: true,
    sortOrder: 30,
    match: ["kubernetes", "docker", "infra", "devops", "cloud", "server", "platform"],
  },
  {
    slug: "data-engineering",
    name: "Data Engineering",
    description: "Trending data tooling across analytics, databases, ETL, ML foundations, and processing workflows.",
    coverImage: "signal://data-engineering",
    tags: ["Data", "Analytics", "ML"],
    featured: false,
    sortOrder: 40,
    match: ["data", "database", "analytics", "etl", "ml", "python"],
  },
  {
    slug: "developer-productivity",
    name: "Developer Productivity",
    description: "Workflow accelerators, local tooling, and general-purpose developer experience projects worth watching.",
    coverImage: "signal://developer-productivity",
    tags: ["Productivity", "Developer Tools"],
    featured: false,
    sortOrder: 50,
    match: ["productivity", "developer", "cli", "workflow", "automation", "tooling"],
  },
];

function includesText(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

export function matchesCollectionSeed(item: Pick<DashboardItem, "fullName" | "description" | "language" | "topics">, definition: CollectionSeedDefinition) {
  const text = `${item.fullName} ${item.description ?? ""} ${item.language ?? ""} ${item.topics.join(" ")}`.toLowerCase();
  return includesText(text, definition.match);
}
