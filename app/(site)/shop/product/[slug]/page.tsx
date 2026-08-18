import { ShopProductDetail } from "@/components/shop/ShopProductDetail";
import type { Metadata } from "next";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `محصول — ${decodeURIComponent(slug)}`,
    description: "جزئیات محصول فروشگاه تجهیزات پاستور پلاس",
  };
}

export default async function ShopProductPage({ params }: PageProps) {
  const { slug } = await params;
  return <ShopProductDetail slug={slug} variant="web" />;
}
