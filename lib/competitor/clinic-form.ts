export type CompetitorClinicForm = {
  clinicName: string;
  managementName: string;
  city: string;
  region: string;
  moreSpecializedPct: string;
  services: string;
  equipment: string;
  generalDentistCount: string;
  specialistDentistCount: string;
  website: string;
  websiteDomain: string;
  onlineServices: string;
  instagramPage: string;
  followerCount: string;
  engagementRate: string;
  contentType: string;
  mapsFeedback: string;
  commentReaction: string;
  strengths: string;
  weaknesses: string;
  strategyScore: string;
  notes: string;
};

export function emptyCompetitorClinicForm(): CompetitorClinicForm {
  return {
    clinicName: "",
    managementName: "",
    city: "",
    region: "",
    moreSpecializedPct: "",
    services: "",
    equipment: "",
    generalDentistCount: "",
    specialistDentistCount: "",
    website: "",
    websiteDomain: "",
    onlineServices: "",
    instagramPage: "",
    followerCount: "",
    engagementRate: "",
    contentType: "",
    mapsFeedback: "",
    commentReaction: "",
    strengths: "",
    weaknesses: "",
    strategyScore: "",
    notes: "",
  };
}

export function competitorFormFromApi(row: Record<string, unknown>): CompetitorClinicForm {
  const str = (k: string) => String(row[k] ?? "").trim();
  const num = (k: string) => {
    const v = row[k];
    if (v === null || v === undefined) return "";
    return String(v);
  };
  return {
    clinicName: str("clinicName"),
    managementName: str("managementName"),
    city: str("city"),
    region: str("region"),
    moreSpecializedPct: num("moreSpecializedPct"),
    services: str("services"),
    equipment: str("equipment"),
    generalDentistCount: num("generalDentistCount"),
    specialistDentistCount: num("specialistDentistCount"),
    website: str("website"),
    websiteDomain: str("websiteDomain"),
    onlineServices: str("onlineServices"),
    instagramPage: str("instagramPage"),
    followerCount: num("followerCount"),
    engagementRate: num("engagementRate"),
    contentType: str("contentType"),
    mapsFeedback: str("mapsFeedback"),
    commentReaction: str("commentReaction"),
    strengths: str("strengths"),
    weaknesses: str("weaknesses"),
    strategyScore: num("strategyScore"),
    notes: str("notes"),
  };
}

export function competitorFormToBody(form: CompetitorClinicForm): Record<string, unknown> {
  const num = (s: string) => {
    const t = s.trim();
    if (!t) return null;
    const v = Number(t);
    return Number.isFinite(v) ? Math.round(v) : null;
  };
  return {
    clinicName: form.clinicName.trim(),
    managementName: form.managementName.trim() || null,
    city: form.city.trim() || null,
    region: form.region.trim() || null,
    moreSpecializedPct: num(form.moreSpecializedPct),
    services: form.services.trim() || null,
    equipment: form.equipment.trim() || null,
    generalDentistCount: num(form.generalDentistCount),
    specialistDentistCount: num(form.specialistDentistCount),
    website: form.website.trim() || null,
    websiteDomain: form.websiteDomain.trim() || null,
    onlineServices: form.onlineServices.trim() || null,
    instagramPage: form.instagramPage.trim() || null,
    followerCount: num(form.followerCount),
    engagementRate: num(form.engagementRate),
    contentType: form.contentType.trim() || null,
    mapsFeedback: form.mapsFeedback.trim() || null,
    commentReaction: form.commentReaction.trim() || null,
    strengths: form.strengths.trim() || null,
    weaknesses: form.weaknesses.trim() || null,
    strategyScore: num(form.strategyScore),
    notes: form.notes.trim() || null,
  };
}
