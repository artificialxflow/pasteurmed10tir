import { WalletPage } from "@/components/wallet/WalletPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "کیف اعتبار",
  description: "موجودی، سقف اعتبار و شرایط بازپرداخت — پاستور پلاس",
};

export default function WalletSitePage() {
  return (
    <main className="flex-1 py-10">
      <div className="px-4 sm:px-6">
        <WalletPage variant="web" />
      </div>
    </main>
  );
}
