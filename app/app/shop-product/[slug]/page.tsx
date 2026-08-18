import { ShopProductDetail } from "@/components/shop/ShopProductDetail";

type PageProps = { params: Promise<{ slug: string }> };

export default async function AppShopProductPage({ params }: PageProps) {
  const { slug } = await params;
  return <ShopProductDetail slug={slug} variant="app" />;
}
