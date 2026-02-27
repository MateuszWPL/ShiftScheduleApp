import { notFound } from "next/navigation";
import Link from "next/link";
import { posts } from "../../../../../.velite";

export async function generateStaticParams() {
  return (posts || []).map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: `${post.title} | Staffer.pl Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <article className="py-12 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <Link
          href="/blog"
          className="text-sm font-medium text-brand hover:underline mb-6 inline-block"
        >
          ← Wróć do bloga
        </Link>
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-brand-dark">
            {post.title}
          </h1>
          <time
            dateTime={post.date}
            className="text-sm text-brand-dark-soft mt-2 block"
          >
            {new Date(post.date).toLocaleDateString("pl-PL", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
        </header>
        <div
          className="blog-content text-brand-dark-muted leading-relaxed [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:font-semibold [&_h2]:text-brand-dark [&_h2]:text-xl [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:font-semibold [&_h3]:text-brand-dark [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-1 [&_a]:text-brand [&_a]:underline [&_a:hover]:no-underline"
          dangerouslySetInnerHTML={{ __html: post.body }}
        />
      </div>
    </article>
  );
}
