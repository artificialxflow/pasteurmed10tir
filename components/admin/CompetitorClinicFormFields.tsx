"use client";

import { FormInput, FormLabel, FormTextarea } from "@/components/ui/Card";
import type { CompetitorClinicForm } from "@/lib/competitor/clinic-form";

export function CompetitorClinicFormFields({
  form,
  onChange,
  requireName = false,
}: {
  form: CompetitorClinicForm;
  onChange: (next: CompetitorClinicForm) => void;
  requireName?: boolean;
}) {
  const set = (patch: Partial<CompetitorClinicForm>) => onChange({ ...form, ...patch });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <FormLabel>نام کلینیک</FormLabel>
        <FormInput
          value={form.clinicName}
          onChange={(e) => set({ clinicName: e.target.value })}
          required={requireName}
        />
      </div>
      <div>
        <FormLabel>نام مدیریت</FormLabel>
        <FormInput
          value={form.managementName}
          onChange={(e) => set({ managementName: e.target.value })}
        />
      </div>
      <div>
        <FormLabel>شهر</FormLabel>
        <FormInput value={form.city} onChange={(e) => set({ city: e.target.value })} />
      </div>
      <div>
        <FormLabel>منطقه</FormLabel>
        <FormInput value={form.region} onChange={(e) => set({ region: e.target.value })} />
      </div>
      <div>
        <FormLabel>٪ تخصصی‌تر بودن</FormLabel>
        <FormInput
          type="number"
          inputMode="numeric"
          value={form.moreSpecializedPct}
          onChange={(e) => set({ moreSpecializedPct: e.target.value })}
        />
      </div>
      <div>
        <FormLabel>امتیاز استراتژی</FormLabel>
        <FormInput
          type="number"
          inputMode="numeric"
          value={form.strategyScore}
          onChange={(e) => set({ strategyScore: e.target.value })}
        />
      </div>
      <div>
        <FormLabel>تعداد دندانپزشک عمومی</FormLabel>
        <FormInput
          type="number"
          inputMode="numeric"
          value={form.generalDentistCount}
          onChange={(e) => set({ generalDentistCount: e.target.value })}
        />
      </div>
      <div>
        <FormLabel>تعداد دندانپزشک متخصص</FormLabel>
        <FormInput
          type="number"
          inputMode="numeric"
          value={form.specialistDentistCount}
          onChange={(e) => set({ specialistDentistCount: e.target.value })}
        />
      </div>
      <div className="md:col-span-2">
        <FormLabel>خدمات</FormLabel>
        <FormTextarea rows={2} value={form.services} onChange={(e) => set({ services: e.target.value })} />
      </div>
      <div className="md:col-span-2">
        <FormLabel>تجهیزات</FormLabel>
        <FormTextarea rows={2} value={form.equipment} onChange={(e) => set({ equipment: e.target.value })} />
      </div>
      <div>
        <FormLabel>وب‌سایت</FormLabel>
        <FormInput value={form.website} onChange={(e) => set({ website: e.target.value })} dir="ltr" className="text-left" />
      </div>
      <div>
        <FormLabel>دامنه</FormLabel>
        <FormInput
          value={form.websiteDomain}
          onChange={(e) => set({ websiteDomain: e.target.value })}
          dir="ltr"
          className="text-left"
        />
      </div>
      <div className="md:col-span-2">
        <FormLabel>خدمات آنلاین</FormLabel>
        <FormTextarea
          rows={2}
          value={form.onlineServices}
          onChange={(e) => set({ onlineServices: e.target.value })}
        />
      </div>
      <div>
        <FormLabel>اینستاگرام</FormLabel>
        <FormInput
          value={form.instagramPage}
          onChange={(e) => set({ instagramPage: e.target.value })}
          dir="ltr"
          className="text-left"
        />
      </div>
      <div>
        <FormLabel>تعداد فالوور</FormLabel>
        <FormInput
          type="number"
          inputMode="numeric"
          value={form.followerCount}
          onChange={(e) => set({ followerCount: e.target.value })}
        />
      </div>
      <div>
        <FormLabel>نرخ engagement</FormLabel>
        <FormInput
          type="number"
          inputMode="numeric"
          value={form.engagementRate}
          onChange={(e) => set({ engagementRate: e.target.value })}
        />
      </div>
      <div>
        <FormLabel>نوع محتوا</FormLabel>
        <FormInput value={form.contentType} onChange={(e) => set({ contentType: e.target.value })} />
      </div>
      <div className="md:col-span-2">
        <FormLabel>بازخورد نقشه</FormLabel>
        <FormTextarea rows={2} value={form.mapsFeedback} onChange={(e) => set({ mapsFeedback: e.target.value })} />
      </div>
      <div className="md:col-span-2">
        <FormLabel>واکنش به نظرات</FormLabel>
        <FormTextarea
          rows={2}
          value={form.commentReaction}
          onChange={(e) => set({ commentReaction: e.target.value })}
        />
      </div>
      <div className="md:col-span-2">
        <FormLabel>نقاط قوت</FormLabel>
        <FormTextarea rows={2} value={form.strengths} onChange={(e) => set({ strengths: e.target.value })} />
      </div>
      <div className="md:col-span-2">
        <FormLabel>نقاط ضعف</FormLabel>
        <FormTextarea rows={2} value={form.weaknesses} onChange={(e) => set({ weaknesses: e.target.value })} />
      </div>
      <div className="md:col-span-2">
        <FormLabel>یادداشت</FormLabel>
        <FormTextarea rows={3} value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
      </div>
    </div>
  );
}
