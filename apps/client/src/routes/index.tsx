import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/shared/ui/button';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return (
    <main>
      <section className="mx-auto flex min-h-[40vh] max-w-[1280px] flex-col items-start justify-center gap-6 px-4 py-16 md:px-8">
        <h1 className="text-4xl font-bold text-ink md:text-5xl">
          Discover the StyleNest collection
        </h1>
        <p className="max-w-xl text-lg text-muted">
          Timeless pieces, honest materials. Server-rendered with TanStack
          Router, styled with Tailwind.
        </p>
        <Button href="/products" size="lg">
          Shop now
        </Button>
      </section>
    </main>
  );
}
