import { prisma } from "@/lib/db/prisma";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim();

  const customers = await prisma.customer.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query } },
            { phone: { contains: query } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      _count: { select: { requests: true } },
    },
  });

  return (
    <section className="space-y-6">
      <h1 className="text-3xl">Customers</h1>
      <p className="text-sm text-ro-muted">
        Contact records from retail requests. Phone is searchable but not a
        unique identity. No customer login in Week 2.
      </p>
      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={query ?? ""}
          placeholder="Search name or phone"
          className="border border-ro-line bg-transparent px-3 py-2 text-sm"
        />
        <button type="submit" className="bg-ro-purple px-4 py-2 text-sm text-ro-ivory">
          Search
        </button>
      </form>
      <div className="overflow-x-auto border border-ro-line">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-ro-line bg-ro-surface">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Notes</th>
              <th className="p-3">Requests</th>
              <th className="p-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-ro-line">
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.phone}</td>
                <td className="p-3">{c.notes ?? "—"}</td>
                <td className="p-3">{c._count.requests}</td>
                <td className="p-3">{c.createdAt.toISOString().slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
