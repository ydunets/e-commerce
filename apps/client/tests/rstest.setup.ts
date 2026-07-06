import { afterEach, expect } from '@rstest/core';
import * as jestDomMatchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';

expect.extend(jestDomMatchers);

// Testing-library's automatic cleanup hooks into globals rstest doesn't
// expose, so unmount rendered trees between tests explicitly.
afterEach(cleanup);
