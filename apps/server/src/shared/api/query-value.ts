export function unwrapQueryValue(value: unknown): unknown {
  return Array.isArray(value) && value.length === 1 ? value[0] : value;
}

export function numericQueryValue(value: unknown): unknown {
  const scalar = unwrapQueryValue(value);
  return typeof scalar === 'string' && scalar !== '' ? Number(scalar) : scalar;
}
