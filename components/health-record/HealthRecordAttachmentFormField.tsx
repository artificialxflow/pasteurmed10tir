"use client";

import { FormLabel } from "@/components/ui/Card";
import {
  HEALTH_RECORD_FILE_ACCEPT,
  sectionAllowsUpload,
  sectionCreateHint,
  sectionUploadHint,
  type HealthSectionId,
} from "@/lib/health-record/sections";

export function HealthRecordAttachmentFormField({
  section,
  file,
  onFileChange,
}: {
  section: HealthSectionId;
  file: File | null;
  onFileChange: (file: File | null) => void;
}) {
  if (!sectionAllowsUpload(section)) return null;

  const hint = sectionCreateHint(section);

  return (
    <div className="space-y-2 rounded-xl border border-dashed border-teal-200 bg-teal-50/40 p-3">
      {hint ? <p className="text-xs leading-6 text-slate-600">{hint}</p> : null}
      <div>
        <FormLabel>{sectionUploadHint(section)}</FormLabel>
        <input
          type="file"
          accept={HEALTH_RECORD_FILE_ACCEPT}
          className="mt-1 block w-full text-xs"
          onChange={(e) => onFileChange(e.target.files?.[0] || null)}
        />
        {file ? (
          <p className="mt-1 text-xs font-bold text-teal-800">انتخاب‌شده: {file.name}</p>
        ) : (
          <p className="mt-1 text-xs text-slate-500">می‌توانید بعد از ذخیره هم از لیست سوابق پیوست کنید.</p>
        )}
      </div>
    </div>
  );
}
