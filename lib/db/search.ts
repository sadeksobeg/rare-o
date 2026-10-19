/**
 * Case-insensitive "contains" filter.
 * SQLite's LIKE is ASCII case-insensitive by default; PostgreSQL's is not, so (D2) admin/catalog
 * search must opt in with `mode: "insensitive"` (ILIKE). The `mode` key does not exist on SQLite
 * clients, so it is only emitted when DATABASE_URL points at Postgres.
 */
const isPostgres = /^postgres(ql)?:\/\//.test(process.env.DATABASE_URL ?? "");

export function containsCI(value: string): { contains: string; mode: "insensitive" } {
  return (isPostgres ? { contains: value, mode: "insensitive" } : { contains: value }) as {
    contains: string;
    mode: "insensitive";
  };
}
