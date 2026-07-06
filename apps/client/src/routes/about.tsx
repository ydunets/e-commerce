import { createFileRoute } from '@tanstack/react-router';
import { ServerStatus } from '@/shared/ui/server-status';

export const Route = createFileRoute('/about')({
  // Runs on the server during SSR; the result is dehydrated to the client.
  loader: () => ({ renderedAt: new Date().toISOString() }),
  component: About,
});

function About() {
  const { renderedAt } = Route.useLoaderData();

  return (
    <main className="mx-auto flex max-w-[1280px] flex-col items-start gap-6 px-4 py-10 md:px-8">
      <h1 className="text-3xl font-bold text-ink">About</h1>
      <p className="text-muted">
        This page was server-rendered at {renderedAt}.
      </p>
      <ServerStatus />
    </main>
  );
}
