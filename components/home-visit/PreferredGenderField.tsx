"use client";

import { FormLabel, FormSelect } from "@/components/ui/Card";
import type { PreferredGender } from "@/lib/home-visit/gender";

export function PreferredGenderField({
  value,
  onChange,
}: {
  value: PreferredGender;
  onChange: (next: PreferredGender) => void;
}) {
  return (
    <div>
      <FormLabel>ترجیح نیرو</FormLabel>
      <FormSelect
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          onChange(next === "male" || next === "female" ? next : "any");
        }}
      >
        <option value="any">فرقی ندارد</option>
        <option value="female">خانم</option>
        <option value="male">آقا</option>
      </FormSelect>
    </div>
  );
}
