export type Meta = null | Record<string, unknown>;

export interface TraceableAction {
  readonly type: string;
  readonly meta?: Meta;
}
