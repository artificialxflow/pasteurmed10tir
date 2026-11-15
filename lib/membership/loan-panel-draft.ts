export const LOAN_PANEL_DRAFT_KEY = 'pasteur-loan-panel-draft';

export type LoanPanelDraft = {
  amount: string;
  tier: string;
  months: string;
  nationalId: string;
};

export function readLoanPanelDraft(): LoanPanelDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(LOAN_PANEL_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LoanPanelDraft;
  } catch {
    return null;
  }
}

export function writeLoanPanelDraft(draft: LoanPanelDraft) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(LOAN_PANEL_DRAFT_KEY, JSON.stringify(draft));
}

export function clearLoanPanelDraft() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(LOAN_PANEL_DRAFT_KEY);
}