export type PasteurWorkRow = {
  title: string;
  progressPct?: number;
  kpiPct?: number;
  healthLabel?: string;
  intelligenceLabel?: string;
  actionPct?: number;
  riskNote?: string;
  sentiment?: 'positive' | 'negative';
  sentimentNote?: string;
};

export type PasteurWorkPayload = {
  priorities: PasteurWorkRow[];
  kpis: PasteurWorkRow[];
  organizationalHealth: PasteurWorkRow[];
  strategicAlignment: PasteurWorkRow[];
  riskManagement: PasteurWorkRow[];
  emotionalAwareness: PasteurWorkRow[];
  lastingIdeas: string;
};

export const PASTEUR_WORK_ROW_COUNT = 7;

function emptyRows(): PasteurWorkRow[] {
  return Array.from({ length: PASTEUR_WORK_ROW_COUNT }, () => ({ title: '' }));
}

export function emptyPasteurWorkPayload(): PasteurWorkPayload {
  return {
    priorities: emptyRows(),
    kpis: emptyRows(),
    organizationalHealth: emptyRows(),
    strategicAlignment: emptyRows(),
    riskManagement: emptyRows(),
    emotionalAwareness: emptyRows(),
    lastingIdeas: '',
  };
}

export function parsePasteurWorkPayload(raw: unknown): PasteurWorkPayload {
  const base = emptyPasteurWorkPayload();
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Partial<PasteurWorkPayload>;
  const mergeRows = (key: keyof PasteurWorkPayload, fallback: PasteurWorkRow[]) => {
    if (key === 'lastingIdeas') return;
    const arr = o[key];
    if (!Array.isArray(arr)) return;
    fallback.forEach((row, i) => {
      const src = arr[i];
      if (src && typeof src === 'object') {
        Object.assign(row, src);
        row.title = String((src as PasteurWorkRow).title || '').trim();
      }
    });
  };
  mergeRows('priorities', base.priorities);
  mergeRows('kpis', base.kpis);
  mergeRows('organizationalHealth', base.organizationalHealth);
  mergeRows('strategicAlignment', base.strategicAlignment);
  mergeRows('riskManagement', base.riskManagement);
  mergeRows('emotionalAwareness', base.emotionalAwareness);
  if (typeof o.lastingIdeas === 'string') base.lastingIdeas = o.lastingIdeas;
  return base;
}
