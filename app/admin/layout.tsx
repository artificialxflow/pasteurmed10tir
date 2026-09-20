import { PRIVATE_PAGE_ROBOTS } from '@/lib/seo';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/** Admin UI must never be statically prerendered / publicly cached. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  robots: PRIVATE_PAGE_ROBOTS,
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return children;
}
