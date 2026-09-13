import { buildSimpleTextPdf } from '@/lib/commerce/visitor-qr-pdf';
import { visitorRefAppPath, visitorRefPath } from '@/lib/commerce/referral-ref';
import { requireAdmin } from '@/lib/content/require-admin';
import { toAbsolutePublicUrl } from '@/lib/content/qr-url';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const auth = await requireAdmin('visitors');
  if (auth.error) return auth.error;

  const { id: idRaw } = await ctx.params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'شناسه نامعتبر است.' }, { status: 400 });
  }

  const visitor = await prisma.visitor.findUnique({ where: { id } });
  if (!visitor) {
    return NextResponse.json({ error: 'ویزیتور یافت نشد.' }, { status: 404 });
  }

  const web = toAbsolutePublicUrl(visitorRefPath(visitor.code));
  const app = toAbsolutePublicUrl(visitorRefAppPath(visitor.code));
  const pdf = buildSimpleTextPdf([
    'Pasteur Plus — Visitor QR',
    `Name: ${visitor.name}`,
    `Code: ${visitor.code}`,
    `Web: ${web}`,
    `App: ${app}`,
    'Scan the matching PNG QR or open the Web URL with ?ref=CODE.',
  ]);

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="visitor-${visitor.code}-qr.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
