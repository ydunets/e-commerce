import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import { useHydrated } from '../src/shared/lib/useHydrated';

function Probe() {
  return <span data-testid="flag">{String(useHydrated())}</span>;
}

const renders: string[] = [];

function Recorder() {
  renders.push(String(useHydrated()));
  return null;
}

test('the first mount runs two passes, later mounts start hydrated', () => {
  const first = render(<Recorder />);
  expect(renders).toEqual(['false', 'true']);
  first.unmount();

  render(<Probe />);
  expect(screen.getByTestId('flag')).toHaveTextContent('true');
});
