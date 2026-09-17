import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const safe = String(id || 'ins')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 24) || 'ins';
  const letter = (safe[0] || 'ب').toUpperCase();
  const hue = [...safe].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="80" viewBox="0 0 160 80">
  <rect width="160" height="80" rx="16" fill="hsl(${hue} 45% 93%)"/>
  <rect x="8" y="8" width="144" height="64" rx="12" fill="white" stroke="hsl(${hue} 40% 70%)"/>
  <circle cx="36" cy="40" r="16" fill="hsl(${hue} 55% 42%)"/>
  <text x="36" y="45" text-anchor="middle" font-size="16" fill="white" font-family="Tahoma,sans-serif">${letter}</text>
  <text x="92" y="45" text-anchor="middle" font-size="13" fill="#0f172a" font-family="Tahoma,sans-serif">${safe.slice(0, 10)}</text>
</svg>`;
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
