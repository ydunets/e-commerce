export interface CartLine {
  sku: string;
  quantity: number;
}

// Lines carry sku + quantity only; prices are joined from inventory at read
// time, never snapshotted (ADR 0002).
export interface CartEntity {
  id: string;
  createdAt: Date;
  lines: CartLine[];
}
