"use client";

import { FormInput } from "@/components/ui/Card";
import { uploadAdminImage } from "@/lib/content/client";
import { ChangeEvent, useState } from "react";

type ImageUploadFieldProps = {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
};

export function ImageUploadField({
  value,
  onChange,
  placeholder,
  className,
  inputClassName,
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { path } = await uploadAdminImage(file);
      onChange(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "آپلود ناموفق");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className={className}>
      <FormInput
        type="text"
        dir="ltr"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "/uploads/... یا https://..."}
        className={inputClassName}
      />
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <label className="cursor-pointer text-xs font-bold text-teal-700">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFile}
            disabled={uploading}
          />
          <span className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 hover:bg-teal-100">
            {uploading ? "در حال آپلود..." : "انتخاب فایل"}
          </span>
        </label>
        {value ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={value} alt="" className="h-10 w-10 rounded object-cover" />
        ) : null}
      </div>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
