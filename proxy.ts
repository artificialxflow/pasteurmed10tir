import {
  ADMIN_SESSION_COOKIE,
  decodeSession,
  type AdminSessionPayload,
} from "@/lib/auth/session";
import { type NextRequest, NextResponse } from "next/server";

function noStoreHeaders(res: NextResponse): NextResponse {
  res.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private",
  );
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminApp =
    pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");

  if (isAdminApp) {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const session = token
      ? decodeSession<AdminSessionPayload>(token)
      : null;

    if (!session?.adminUserId) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return noStoreHeaders(NextResponse.redirect(loginUrl));
    }
  }

  const res = NextResponse.next();
  if (pathname.startsWith("/admin")) {
    return noStoreHeaders(res);
  }
  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
