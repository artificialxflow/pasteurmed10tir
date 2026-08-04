const MAX_INT32 = 2_147_483_647;

export function isValidInt32Id(id: number): boolean {
  return Number.isInteger(id) && id > 0 && id <= MAX_INT32;
}

/** Replace missing/invalid ids with sequential values within PostgreSQL Int range. */
export function assignIntIds<T extends { id: number }>(items: T[]): T[] {
  let nextId = items.reduce((max, item) => {
    const id = Number(item.id);
    return isValidInt32Id(id) ? Math.max(max, id) : max;
  }, 0);

  return items.map((item) => {
    const id = Number(item.id);
    if (isValidInt32Id(id)) return item;
    nextId += 1;
    return { ...item, id: nextId };
  });
}
