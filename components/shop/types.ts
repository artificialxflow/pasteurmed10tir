import { ROUTES } from "@/lib/routes";

export type ShopVariant = "web" | "app";

export function shopRoutes(variant: ShopVariant) {
  const product = (slug: string) =>
    variant === "app" ? `/app/shop-product/${slug}` : `/shop/product/${slug}`;

  return variant === "app"
    ? {
        home: ROUTES.app.shop,
        vip: ROUTES.app.shopVip,
        catalog: ROUTES.app.shopCatalog,
        cart: ROUTES.app.shopCart,
        success: ROUTES.app.shopSuccess,
        facility: ROUTES.app.shopFacility,
        confirm: ROUTES.app.dentalConfirm,
        root: ROUTES.app.home,
        product,
      }
    : {
        home: ROUTES.web.shop,
        vip: ROUTES.web.shopVip,
        catalog: ROUTES.web.shopCatalog,
        cart: ROUTES.web.shopCart,
        success: ROUTES.web.shopSuccess,
        facility: ROUTES.web.shopFacility,
        confirm: ROUTES.web.dentalConfirm,
        root: ROUTES.web.home,
        product,
      };
}
