import { PRIVATE_PAGE_ROBOTS } from '@/lib/seo';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  robots: PRIVATE_PAGE_ROBOTS,
};

export default function AccountSectionLayout({ children }: { children: ReactNode }) {
  return children;
}
