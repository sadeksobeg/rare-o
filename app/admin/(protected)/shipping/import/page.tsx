import { ImportPanel } from "@/components/admin/shipping/import-panel";
import { getRequestDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminShippingImportPage() {
  const { locale } = await getRequestDictionary();
  return <ImportPanel locale={locale} />;
}
