"use client";

import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/ui/Card";
import {
  emptyPasteurWorkPayload,
  PASTEUR_WORK_ROW_COUNT,
  type PasteurWorkPayload,
  type PasteurWorkRow,
} from "@/lib/pasteur-work-report/payload";

export type PasteurWorkReportFormState = {
  title: string;
  reportedAtLocal: string;
  payload: PasteurWorkPayload;
};

export function emptyPasteurWorkReportFormState(): PasteurWorkReportFormState {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const reportedAtLocal = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return {
    title: "",
    reportedAtLocal,
    payload: emptyPasteurWorkPayload(),
  };
}

export function reportedAtLocalFromIso(iso?: string): string {
  if (!iso) return emptyPasteurWorkReportFormState().reportedAtLocal;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return emptyPasteurWorkReportFormState().reportedAtLocal;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function reportedAtIsoFromLocal(local: string): string {
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function updateRow(
  payload: PasteurWorkPayload,
  key: keyof Omit<PasteurWorkPayload, "lastingIdeas">,
  index: number,
  patch: Partial<PasteurWorkRow>,
): PasteurWorkPayload {
  const rows = [...payload[key]] as PasteurWorkRow[];
  rows[index] = { ...rows[index], ...patch };
  return { ...payload, [key]: rows };
}

type RowSectionProps = {
  title: string;
  payload: PasteurWorkPayload;
  rowKey: keyof Omit<PasteurWorkPayload, "lastingIdeas">;
  onChange: (next: PasteurWorkPayload) => void;
  renderExtra: (row: PasteurWorkRow, index: number) => import("react").ReactNode;
};

function RowSection({ title, payload, rowKey, onChange, renderExtra }: RowSectionProps) {
  const rows = payload[rowKey] as PasteurWorkRow[];
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <h3 className="mb-3 text-sm font-extrabold text-slate-900">{title}</h3>
      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={index} className="grid gap-2 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <FormLabel>
                {index + 1}. عنوان
              </FormLabel>
              <FormInput
                value={row.title}
                onChange={(e) =>
                  onChange(updateRow(payload, rowKey, index, { title: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-wrap gap-2">{renderExtra(row, index)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PasteurWorkReportFormFields({
  state,
  onChange,
  readOnly = false,
}: {
  state: PasteurWorkReportFormState;
  onChange: (next: PasteurWorkReportFormState) => void;
  readOnly?: boolean;
}) {
  const setPayload = (payload: PasteurWorkPayload) => onChange({ ...state, payload });

  if (readOnly) {
    return (
      <div className="space-y-4 text-sm text-slate-700">
        <p>
          <span className="font-bold">ثبت:</span>{" "}
          {state.reportedAtLocal.replace("T", " ")}
        </p>
        {state.payload.lastingIdeas ? (
          <p className="whitespace-pre-wrap">{state.payload.lastingIdeas}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <FormLabel>عنوان گزارش (اختیاری)</FormLabel>
          <FormInput
            value={state.title}
            onChange={(e) => onChange({ ...state, title: e.target.value })}
          />
        </div>
        <div>
          <FormLabel>تاریخ و ساعت ثبت</FormLabel>
          <FormInput
            type="datetime-local"
            value={state.reportedAtLocal}
            onChange={(e) => onChange({ ...state, reportedAtLocal: e.target.value })}
            dir="ltr"
            className="text-left"
          />
        </div>
      </div>

      <RowSection
        title="۱) اولویت‌ها و پیشرفت روزانه"
        payload={state.payload}
        rowKey="priorities"
        onChange={setPayload}
        renderExtra={(row, index) => (
          <div className="w-28">
            <FormLabel>٪ پیشرفت</FormLabel>
            <FormInput
              type="number"
              min={0}
              max={100}
              inputMode="numeric"
              value={row.progressPct ?? ""}
              onChange={(e) =>
                setPayload(
                  updateRow(state.payload, "priorities", index, {
                    progressPct: e.target.value === "" ? undefined : Number(e.target.value),
                  }),
                )
              }
            />
          </div>
        )}
      />

      <RowSection
        title="۲) پایش و تحلیل اندیکاتورها (KPI)"
        payload={state.payload}
        rowKey="kpis"
        onChange={setPayload}
        renderExtra={(row, index) => (
          <div className="w-28">
            <FormLabel>٪ تحقق</FormLabel>
            <FormInput
              type="number"
              min={0}
              max={100}
              inputMode="numeric"
              value={row.kpiPct ?? ""}
              onChange={(e) =>
                setPayload(
                  updateRow(state.payload, "kpis", index, {
                    kpiPct: e.target.value === "" ? undefined : Number(e.target.value),
                  }),
                )
              }
            />
          </div>
        )}
      />

      <RowSection
        title="۳) سلامت سازمانی و هوش سازمانی"
        payload={state.payload}
        rowKey="organizationalHealth"
        onChange={setPayload}
        renderExtra={(row, index) => (
          <>
            <div className="min-w-[8rem]">
              <FormLabel>سلامت</FormLabel>
              <FormInput
                value={row.healthLabel ?? ""}
                onChange={(e) =>
                  setPayload(
                    updateRow(state.payload, "organizationalHealth", index, {
                      healthLabel: e.target.value,
                    }),
                  )
                }
              />
            </div>
            <div className="min-w-[8rem]">
              <FormLabel>هوش</FormLabel>
              <FormInput
                value={row.intelligenceLabel ?? ""}
                onChange={(e) =>
                  setPayload(
                    updateRow(state.payload, "organizationalHealth", index, {
                      intelligenceLabel: e.target.value,
                    }),
                  )
                }
              />
            </div>
          </>
        )}
      />

      <RowSection
        title="۴) همسویی راهبردی"
        payload={state.payload}
        rowKey="strategicAlignment"
        onChange={setPayload}
        renderExtra={(row, index) => (
          <div className="w-28">
            <FormLabel>٪ اقدام</FormLabel>
            <FormInput
              type="number"
              min={0}
              max={100}
              inputMode="numeric"
              value={row.actionPct ?? ""}
              onChange={(e) =>
                setPayload(
                  updateRow(state.payload, "strategicAlignment", index, {
                    actionPct: e.target.value === "" ? undefined : Number(e.target.value),
                  }),
                )
              }
            />
          </div>
        )}
      />

      <RowSection
        title="۵) مدیریت ریسک و بحران"
        payload={state.payload}
        rowKey="riskManagement"
        onChange={setPayload}
        renderExtra={(row, index) => (
          <div className="min-w-[12rem] flex-1">
            <FormLabel>توضیحات</FormLabel>
            <FormInput
              value={row.riskNote ?? ""}
              onChange={(e) =>
                setPayload(
                  updateRow(state.payload, "riskManagement", index, { riskNote: e.target.value }),
                )
              }
            />
          </div>
        )}
      />

      <RowSection
        title="۶) خودآگاهی و خودتنظیمی عاطفی"
        payload={state.payload}
        rowKey="emotionalAwareness"
        onChange={setPayload}
        renderExtra={(row, index) => (
          <>
            <div className="w-28">
              <FormLabel>مثبت/منفی</FormLabel>
              <FormSelect
                value={row.sentiment ?? ""}
                onChange={(e) =>
                  setPayload(
                    updateRow(state.payload, "emotionalAwareness", index, {
                      sentiment:
                        e.target.value === "positive" || e.target.value === "negative"
                          ? e.target.value
                          : undefined,
                    }),
                  )
                }
              >
                <option value="">—</option>
                <option value="positive">مثبت</option>
                <option value="negative">منفی</option>
              </FormSelect>
            </div>
            <div className="min-w-[10rem] flex-1">
              <FormLabel>توضیح</FormLabel>
              <FormInput
                value={row.sentimentNote ?? ""}
                onChange={(e) =>
                  setPayload(
                    updateRow(state.payload, "emotionalAwareness", index, {
                      sentimentNote: e.target.value,
                    }),
                  )
                }
              />
            </div>
          </>
        )}
      />

      <div className="rounded-xl border border-slate-200 p-4">
        <h3 className="mb-2 text-sm font-extrabold text-slate-900">
          ۷) ثبت تجربیات و ایده‌های ماندگار
        </h3>
        <FormTextarea
          rows={4}
          value={state.payload.lastingIdeas}
          onChange={(e) =>
            onChange({
              ...state,
              payload: { ...state.payload, lastingIdeas: e.target.value },
            })
          }
        />
      </div>
    </div>
  );
}

export { PASTEUR_WORK_ROW_COUNT };
