import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

function mapRow(i: {
  id: string;
  name: string;
  active: boolean;
  showOnSite: boolean;
  logoUrl: string | null;
}) {
  return {
    id: i.id,
    name: i.name,
    active: i.active,
    showOnSite: i.showOnSite,
    logoUrl: i.logoUrl || null,
  };
}

export async function GET() {
  const [baseRows, complementaryRows] = await Promise.all([
    prisma.baseInsurance.findMany({ orderBy: { id: 'asc' } }),
    prisma.complementaryInsurance.findMany({ orderBy: { id: 'asc' } }),
  ]);

  const baseAll = baseRows.map(mapRow);
  const complementaryAll = complementaryRows.map(mapRow);

  return NextResponse.json({
    /** Patient dropdown: active only */
    base: baseAll.filter((i) => i.active),
    complementary: complementaryAll.filter((i) => i.active),
    /** Homepage marketing: showOnSite (may include inactive-for-patient names) */
    site: [...baseAll, ...complementaryAll].filter((i) => i.showOnSite),
  });
}
