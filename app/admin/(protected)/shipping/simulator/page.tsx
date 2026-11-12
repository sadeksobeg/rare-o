import { SimulatorPanel } from "@/components/admin/shipping/simulator-panel";
import { getRequestDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminShippingSimulatorPage() {
  const { locale } = await getRequestDictionary();
  return <SimulatorPanel locale={locale} />;
}
