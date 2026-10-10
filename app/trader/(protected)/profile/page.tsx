import { requireTraderSession } from "@/lib/auth/trader-session";
import { prisma } from "@/lib/db/prisma";

export default async function TraderProfilePage() {
  const session = await requireTraderSession();
  const trader = await prisma.traderAccount.findUnique({
    where: { id: session.sub },
  });
  if (!trader) return null;

  return (
    <section className="space-y-6">
      <h1 className="text-3xl">Profile</h1>
      <dl className="grid max-w-xl gap-3 text-sm">
        <div>
          <dt className="text-ro-muted">Display name</dt>
          <dd>{trader.displayName}</dd>
        </div>
        <div>
          <dt className="text-ro-muted">Email</dt>
          <dd>{trader.email}</dd>
        </div>
        <div>
          <dt className="text-ro-muted">Company</dt>
          <dd>{trader.companyName || "—"}</dd>
        </div>
        <div>
          <dt className="text-ro-muted">Phone</dt>
          <dd>{trader.phone || "—"}</dd>
        </div>
        <div>
          <dt className="text-ro-muted">Status</dt>
          <dd>{trader.status}</dd>
        </div>
      </dl>
      <p className="text-sm text-ro-muted">
        Profile changes are managed by RARE OUD admin. This is not a public
        seller identity.
      </p>
    </section>
  );
}
