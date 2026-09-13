import { requireAdmin } from '@/lib/content/require-admin';
import { toAbsolutePublicUrl } from '@/lib/content/qr-url';
import { visitorRefPath } from '@/lib/commerce/referral-ref';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';
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

  const url = toAbsolutePublicUrl(visitorRefPath(visitor.code));
  const png = await QRCode.toBuffer(url, {
    type: 'png',
    width: 512,
    margin: 2,
    errorCorrectionLevel: 'M',
  });

  return new NextResponse(new Uint8Array(png), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="visitor-${visitor.code}-qr.png"`,
      'Cache-Control': 'no-store',
    },
  });
}
