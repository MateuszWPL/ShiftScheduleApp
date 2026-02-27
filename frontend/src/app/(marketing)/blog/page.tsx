import Link from "next/link";
import { posts } from "../../../../.velite";

export default function BlogPage() {
  if (!posts || posts.length === 0) {
    return (
      <div className="py-12 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-brand-dark">
            Blog i baza wiedzy
          </h1>
          <p className="mt-4 text-brand-dark-muted max-w-2xl">
            Poradniki, wskazówki i aktualności dotyczące zarządzania grafikami i
            zespołem.
          </p>
          <div className="mt-12 text-center py-12 rounded-xl border border-brand-warm bg-brand-warm-light/20">
            <p className="text-brand-dark-muted">
              Wkrótce pojawią się tutaj pierwsze artykuły.
            </p>
            <Link
              href="/"
              className="inline-block mt-4 text-sm font-medium text-brand hover:underline"
            >
              Wróć na stronę główną
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-brand-dark">
          Blog i baza wiedzy
        </h1>
        <p className="mt-4 text-brand-dark-muted max-w-2xl">
          Poradniki, wskazówki i aktualności dotyczące zarządzania grafikami i
          zespołem.
        </p>
        <ul className="mt-12 space-y-6">
          {posts
            .sort(
              (a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            )
            .map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="block p-6 rounded-xl border border-brand-warm bg-white hover:border-brand/30 hover:shadow-md transition-all"
                >
                  <h2 className="text-lg font-semibold text-brand-dark">
                    {post.title}
                  </h2>
                  <time
                    dateTime={post.date}
                    className="text-xs text-brand-dark-soft mt-1 block"
                  >
                    {new Date(post.date).toLocaleDateString("pl-PL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </time>
                  <p className="mt-2 text-sm text-brand-dark-muted line-clamp-2">
                    {post.excerpt}
                  </p>
                </Link>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
