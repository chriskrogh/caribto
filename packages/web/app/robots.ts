import type { MetadataRoute } from "next";

const ALLOWED_PATHS = ["/", "/sign-in", "/api/og/*", "/sitemap.xml"];
const DISALLOWED_PATHS = [
  "/dashboard/*",
  "/onboarding/*",
  "/api/auth/*",
  "/api/trpc/*",
  "/api/cron/*",
];
const SITE_URL = "https://www.caribto.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ALLOWED_PATHS,
        disallow: DISALLOWED_PATHS,
        crawlDelay: 10,
      },
      {
        userAgent: "Googlebot",
        allow: ALLOWED_PATHS,
        disallow: DISALLOWED_PATHS,
        crawlDelay: 3,
      },
      {
        userAgent: "Bingbot",
        allow: ALLOWED_PATHS,
        disallow: DISALLOWED_PATHS,
        crawlDelay: 3,
      },
      {
        userAgent: "Twitterbot",
        allow: ALLOWED_PATHS,
        disallow: DISALLOWED_PATHS,
        crawlDelay: 1,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
