export type TType =
  | 'null'
  | 'undefined'
  | 'string'
  | 'number'
  | 'boolean'
  | 'symbol'
  | 'bigint'
  | 'object'
  | 'array'
  | 'function'
  | 'date'
  | 'regexp'
  | 'map'
  | 'set'
  | 'weakmap'
  | 'weakset'
  | 'error'
  | 'promise'
  | 'arraybuffer'
  | string;

type TTypeMap = {
  null: null;
  undefined: undefined;
  string: string;
  number: number;
  boolean: boolean;
  symbol: symbol;
  bigint: bigint;
  object: object;
  array: unknown[];
  function: (...args: never[]) => unknown;
  date: Date;
  regexp: RegExp;
  map: Map<unknown, unknown>;
  set: Set<unknown>;
  weakmap: WeakMap<WeakKey, unknown>;
  weakset: WeakSet<WeakKey>;
  error: Error;
  promise: Promise<unknown>;
  arraybuffer: ArrayBuffer;
};

export const detectType = (value: unknown): TType => {
  if (value == null) {
    return `${value}`;
  }

  return Object.getPrototypeOf(value)?.constructor?.name.toLowerCase() ?? 'object';
};

// Reports the constructor's own name, so a subclass instance is not its base type
// ('apierror' is not 'error') and a boxed primitive reads as the primitive.
export const isType = <K extends keyof TTypeMap>(value: unknown, type: K): value is TTypeMap[K] =>
  detectType(value) === type;
