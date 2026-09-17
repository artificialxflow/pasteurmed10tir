"use client";

import { FormInput, FormLabel, FormTextarea } from "@/components/ui/Card";
import { JalaliBirthDateField } from "@/components/ui/JalaliBirthDateField";
import type { HealthSectionField } from "@/lib/health-record/sections";

export function HealthRecordFormFields({
  fields,
  values,
  onChange,
}: {
  fields: HealthSectionField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.key} className={field.kind === "textarea" || field.kind === "date" ? "sm:col-span-2" : ""}>
          {field.kind === "date" ? (
            <JalaliBirthDateField
              label={field.label}
              value={values[field.key] || ""}
              onChange={(iso) => onChange(field.key, iso)}
            />
          ) : (
            <>
              <FormLabel>{field.label}</FormLabel>
              {field.hint ? <p className="mb-1 text-[0.65rem] text-slate-500">{field.hint}</p> : null}
              {field.kind === "textarea" ? (
                <FormTextarea
                  rows={3}
                  value={values[field.key] || ""}
                  onChange={(e) => onChange(field.key, e.target.value)}
                />
              ) : (
                <FormInput
                  value={values[field.key] || ""}
                  onChange={(e) => onChange(field.key, e.target.value)}
                />
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
