import { notFound } from "next/navigation";
import { DevUiKitShell } from "@/components/dev/ui-kit-shell";

export const metadata = { title: "dev: ui-kit list fixtures" };

export default async function DevUiKitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <DevUiKitShell>{children}</DevUiKitShell>;
}
