import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Golden Compass — Markets & Demo Investing" },
      {
        name: "description",
        content: "Explore Kenyan and global markets, technical analysis and demo investing on Golden Compass.",
      },
      { property: "og:title", content: "Golden Compass — Markets & Demo Investing" },
      {
        property: "og:description",
        content: "Kenya-focused market analysis, education and demo investing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/home" });
  },
  component: () => null,
});
