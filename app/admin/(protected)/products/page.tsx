import Link from "next/link";
import { listAdminProducts } from "@/lib/catalog/service";

export default async function AdminProductsPage() {
  const products = await listAdminProducts();

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl">Products</h1>
        <Link
          href="/admin/products/new"
          className="bg-ro-purple px-4 py-2 text-sm text-ro-ivory"
        >
          New product
        </Link>
      </div>
      <div className="overflow-x-auto border border-ro-line">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-ro-line bg-ro-surface">
            <tr>
              <th className="p-3">Slug</th>
              <th className="p-3">Name</th>
              <th className="p-3">Status</th>
              <th className="p-3">Availability</th>
              <th className="p-3">Price</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-ro-line">
                <td className="p-3">{p.slug}</td>
                <td className="p-3">{p.nameEn || p.nameAr || "—"}</td>
                <td className="p-3">{p.status}</td>
                <td className="p-3">{p.availability}</td>
                <td className="p-3">
                  {Number(p.retailPrice)} {p.currency}
                </td>
                <td className="p-3">
                  <Link href={`/admin/products/${p.id}`} className="text-ro-purple">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
