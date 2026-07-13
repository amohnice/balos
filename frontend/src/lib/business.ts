interface BusinessLike {
  id?: unknown;
  business?: {
    id?: unknown;
  };
}

export function getFirstBusinessId(data: unknown): string | null {
  if (!Array.isArray(data) || data.length === 0) return null;

  const first = data[0] as BusinessLike;
  if (typeof first.id === 'string') return first.id;
  if (typeof first.business?.id === 'string') return first.business.id;

  return null;
}
