import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-[1280px] flex-col items-start justify-center gap-6 px-4 py-16 md:px-8">
      <h1 className="text-4xl font-bold text-ink md:text-5xl">
        Discover the StyleNest collection
      </h1>
      <p className="max-w-xl text-lg text-muted">
        Timeless pieces, honest materials. Server-rendered with TanStack Router,
        styled with Tailwind.
      </p>
      <Link
        to="/products/$productId"
        params={{ productId: 'voyager-hoodie' }}
        className="focus-ring rounded-lg bg-brand px-6 py-3 font-medium text-white transition-colors hover:bg-brand-dark"
      >
        Shop the Voyager Hoodie
      </Link>
    </main>
  );
}
