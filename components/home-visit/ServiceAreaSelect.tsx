"use client";

import { FormLabel, FormSelect } from "@/components/ui/Card";
import { HOME_VISIT_SERVICE_AREAS } from "@/lib/home-visit/areas";

export function ServiceAreaSelect({
  value,
  onChange,
  required,
  id,
}: {
  value: string;
  onChange: (next: string) => void;
  required?: boolean;
  id?: string;
}) {
  return (
    <div>
      <FormLabel>منطقه</FormLabel>
      <FormSelect
        id={id}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">انتخاب منطقه</option>
        {HOME_VISIT_SERVICE_AREAS.map((area) => (
          <option key={area.id} value={area.id}>
            {area.label}
          </option>
        ))}
      </FormSelect>
    </div>
  );
}
