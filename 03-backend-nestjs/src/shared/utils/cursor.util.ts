// Opaque keyset-pagination cursor: base64-encodes the (sortValue, id) of the
// last row seen, so listing endpoints can resume a `(col DESC, id)` index
// scan instead of paying for an OFFSET scan (API_SPEC.md §3, DATABASE.md §2).
export interface DecodedCursor {
  sortValue: string | number;
  id: string;
}

export function encodeCursor(cursor: DecodedCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64');
}

export function decodeCursor(cursor: string): DecodedCursor {
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, 'base64').toString('utf8'),
    ) as DecodedCursor;
    if (parsed.id === undefined || parsed.sortValue === undefined) {
      throw new Error('malformed cursor');
    }
    return parsed;
  } catch {
    throw new Error('Invalid cursor');
  }
}
