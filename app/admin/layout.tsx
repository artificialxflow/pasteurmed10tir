import type { ReactNode } from "react";

/** Admin UI must never be statically prerendered / publicly cached. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return children;
}
