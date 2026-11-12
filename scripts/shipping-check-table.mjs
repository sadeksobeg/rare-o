import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
try {
  const tables = await p.$queryRawUnsafe(
    `select table_name from information_schema.tables where table_schema='public' and (table_name ilike 'Ship%' or table_name='TraderSavedAddress') order by 1`
  );
  console.log("tables:", tables.map((t) => t.table_name).join(", ") || "(none)");
  const mig = await p.$queryRawUnsafe(
    `select migration_name, finished_at is not null as done from "_prisma_migrations" order by started_at desc limit 4`
  );
  console.log("migrations:", JSON.stringify(mig));
  const cols = await p.$queryRawUnsafe(
    `select column_name from information_schema.columns where table_name='Product' and column_name in ('weightKg','shippingClass')`
  );
  console.log("product cols:", cols.map((c) => c.column_name).join(","));
  if (tables.length) {
    console.log(
      "counts:",
      JSON.stringify({
        countries: await p.shippingCountry.count(),
        methods: await p.shippingMethod.count(),
        rates: await p.shippingRate.count(),
      })
    );
    const cfg = await p.shippingConfig.findFirst();
    console.log("config optIn:", cfg?.whatsappOptInTextAr ?? "(no row)");
  }
} catch (e) {
  console.error("ERR", String(e.message).slice(0, 400));
} finally {
  await p.$disconnect();
}
