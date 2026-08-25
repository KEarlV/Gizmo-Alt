export function filterUserOwnedRows<T extends { userId: number }>(rows: T[], userId: number) {
  return rows.filter((row) => row.userId === userId);
}
