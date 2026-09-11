import { RuntimeDependency } from './runtime-dependency.js';

export const COMPONENT_METADATA = 'compiled:component';

function component(target: object): void {
  Reflect.defineMetadata(COMPONENT_METADATA, true, target);
}

@component
export class CompilerProbe {
  constructor(readonly dependency: RuntimeDependency) {}
}

export function failWithSourceLocation(): never {
  throw new Error('source map probe');
}
