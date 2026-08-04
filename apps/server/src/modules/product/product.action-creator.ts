import { actionCreatorFactory } from '#src/shared/cqrs/action-creator.ts';

// Lives outside index.ts so handlers can import it without creating a cycle
// with the query re-exports in index.ts (same split as the review module).
export const productActionCreator = actionCreatorFactory('product');
