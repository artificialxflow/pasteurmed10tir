"use client";

import { AdminTable } from "@/components/admin/AdminTable";
import { PasteurStorage, type ClubProfile } from "@/lib/storage";
import { useEffect, useState } from "react";

export default function AdminClubPage() {
  const [members, setMembers] = useState<ClubProfile[]>([]);

  useEffect(() => {
    const all =
      (PasteurStorage.get(PasteurStorage.KEYS.club) as Record<string, ClubProfile> | null) ||
      {};
    setMembers(Object.values(all));
  }, []);

  return (
    <AdminTable
      headers={["موبایل", "امتیاز", "مراجعه", "معرفی بیمار", "سطح", "پاداش دریافتی"]}
      empty="هنوز عضوی در باشگاه ثبت نشده."
    >
      {members.map((m) => {
        const tier = PasteurStorage.getClubTier(Number(m.points || 0));
        return (
          <tr key={m.phone} className="border-t border-slate-100">
            <td className="px-4 py-3">{m.phone}</td>
            <td className="px-4 py-3 font-bold text-teal-700">{m.points}</td>
            <td className="px-4 py-3">{m.visits}</td>
            <td className="px-4 py-3">{m.referrals || 0}</td>
            <td className="px-4 py-3">
              {tier.emoji} {tier.name}
            </td>
            <td className="px-4 py-3">{m.redeemed?.length || 0}</td>
          </tr>
        );
      })}
    </AdminTable>
  );
}
