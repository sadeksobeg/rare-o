import {
  CreateTraderForm,
  TraderStatusButton,
} from "@/components/admin/trader-forms";
import { prisma } from "@/lib/db/prisma";

export default async function AdminTradersPage() {
  const traders = await prisma.traderAccount.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { deals: true } } },
  });

  return (
    <section className="space-y-8">
      <h1 className="text-3xl">Traders</h1>
      <CreateTraderForm />
      <div className="overflow-x-auto border border-ro-line">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-ro-line bg-ro-surface">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Status</th>
              <th className="p-3">Deals</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {traders.map((t) => (
              <tr key={t.id} className="border-b border-ro-line">
                <td className="p-3">
                  {t.displayName}
                  {t.companyName ? (
                    <div className="text-ro-muted">{t.companyName}</div>
                  ) : null}
                </td>
                <td className="p-3">{t.email}</td>
                <td className="p-3">{t.status}</td>
                <td className="p-3">{t._count.deals}</td>
                <td className="p-3">
                  <TraderStatusButton
                    traderId={t.id}
                    nextStatus={t.status === "active" ? "disabled" : "active"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
