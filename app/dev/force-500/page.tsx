import { notFound } from "next/navigation";

export const metadata = { title: "dev: force 500" };

/** Dev-only route that throws so we can capture the themed error UI. */
export default function DevForce500Page() {
  if (process.env.NODE_ENV === "production") notFound();
  throw new Error("DEV_FORCE_500");
}
