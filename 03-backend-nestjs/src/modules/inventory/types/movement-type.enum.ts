// text + CHECK in the DB, not a PG enum type — this set is expected to
// churn (DATABASE.md §4), so no shared/enums mirror is needed.
export enum MovementType {
  Restock = 'restock',
  Correction = 'correction',
  Damage = 'damage',
  Return = 'return',
  ManualAdjustment = 'manual_adjustment',
}
