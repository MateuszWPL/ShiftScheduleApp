import { defineConfig, defineCollection, s } from "velite";

const posts = defineCollection({
  name: "Post",
  pattern: "blog/**/*.md",
  schema: s.object({
    title: s.string().max(99),
    slug: s.slug("blog"),
    date: s.isodate(),
    excerpt: s.excerpt(),
    body: s.markdown(),
  }),
});

export default defineConfig({
  root: "content",
  collections: { posts },
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    clean: true,
  },
});
