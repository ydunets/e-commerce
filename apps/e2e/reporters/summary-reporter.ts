import type {
  Reporter,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

const SLOWEST_SHOWN = 3;
const MS_PER_SECOND = 1000;

type Finished = { title: string; durationMs: number };

/**
 * Prints one run-level summary: how many tests ended in each state, how the
 * tags divide them, and which ones cost the most wall clock. The list reporter
 * says what happened test by test; this says what the run as a whole cost.
 */
export default class SummaryReporter implements Reporter {
  private readonly statuses = new Map<string, number>();
  private readonly tags = new Map<string, number>();
  private readonly finished: Finished[] = [];

  onTestEnd(test: TestCase, result: TestResult): void {
    const seen = this.statuses.get(result.status) ?? 0;
    this.statuses.set(result.status, seen + 1);
    for (const tag of test.tags) {
      this.tags.set(tag, (this.tags.get(tag) ?? 0) + 1);
    }
    this.finished.push({ title: test.title, durationMs: result.duration });
  }

  onEnd(): void {
    if (this.finished.length === 0) {
      return;
    }

    const seconds = (ms: number) => `${(ms / MS_PER_SECOND).toFixed(1)}s`;
    const slowest = [...this.finished]
      .sort((left, right) => right.durationMs - left.durationMs)
      .slice(0, SLOWEST_SHOWN);
    const format = (counts: Map<string, number>) =>
      [...counts]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, count]) => `${key}=${count}`)
        .join(' ');

    console.log('\nRun summary');
    console.log(`  results: ${format(this.statuses)}`);
    const tags = this.tags.size > 0 ? format(this.tags) : 'none';
    console.log(`  tags:    ${tags}`);
    console.log(
      `  slowest: ${slowest
        .map(({ title, durationMs }) => `${title} (${seconds(durationMs)})`)
        .join(', ')}`,
    );
  }
}
