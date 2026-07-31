import { ValueTransformer } from 'typeorm';

// pg returns numeric columns as strings to avoid float precision loss
// (DATABASE.md §6) — this transformer restores the JS number on read.
export const decimalTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) =>
    value === null || value === undefined ? value : parseFloat(value),
};
