import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/wall", "/leaderboard", "/battle", "/claim", "/privacy", "/terms", "/guidelines", "/contact"];
  const now = new Date();
  return routes.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/leaderboard" ? "hourly" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
