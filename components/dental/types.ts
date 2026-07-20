export type DentalBasePath = "/dental" | "/app/dental";

export function isAppDental(basePath: DentalBasePath): boolean {
  return basePath.startsWith("/app");
}
