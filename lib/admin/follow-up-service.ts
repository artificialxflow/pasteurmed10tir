import type { Prisma } from '@prisma/client';
import {
  FOLLOW_UP_ATTENDED_ACTION_OPTIONS,
  FOLLOW_UP_DISSATISFACTION_OPTIONS,
  FOLLOW_UP_SERVICE_OPTIONS,
  normalizePhoneDigits,
  parseIsoDateOnly,
  parseRating,
  todayDateOnlyUtc,
} from '@/lib/follow-up/types';
import {
  isAwaitingAppointment,
  isAwaitingFollowUp,
  isCompletedCase,
  type FollowUpTab,
} from '@/lib/follow-up/mappers';

export function parseFollowUpTab(raw: string | null): FollowUpTab {
  const t = String(raw || 'new').toLowerCase();
  if (t === 'appointment' || t === 'followup' || t === 'completed' || t === 'satisfaction') {
    return t;
  }
  return 'new';
}

export function buildFollowUpWhere(
  tab: FollowUpTab,
  input: { followUpDate?: string | null; serviceCategory?: string | null; search?: string },
): Prisma.FollowUpCaseWhereInput {
  const search = input.search?.trim();
  const phoneDigits = search ? normalizePhoneDigits(search) : '';
  const searchFilter: Prisma.FollowUpCaseWhereInput | undefined = search
    ? {
        OR: [
          { patientName: { contains: search, mode: 'insensitive' } },
          ...(phoneDigits.length >= 4
            ? [{ patientPhone: { contains: phoneDigits } }]
            : []),
          { doctorName: { contains: search, mode: 'insensitive' } },
        ],
      }
    : undefined;

  const category: Prisma.FollowUpCaseWhereInput | undefined =
    input.serviceCategory &&
    FOLLOW_UP_SERVICE_OPTIONS.some((o) => o.id === input.serviceCategory)
      ? {
          serviceCategory: input.serviceCategory as
            | 'dental'
            | 'medical'
            | 'nursing'
            | 'laser',
        }
      : undefined;

  let tabFilter: Prisma.FollowUpCaseWhereInput = {};
  if (tab === 'appointment') {
    tabFilter = {
      outcome: 'attended',
      attendedAction: 'appointment_needed',
      appointmentGiven: false,
    };
  } else if (tab === 'followup') {
    tabFilter = {
      outcome: 'attended',
      attendedAction: 'follow_up_needed',
      followUpDone: false,
    };
    const d = parseIsoDateOnly(input.followUpDate);
    if (d) tabFilter.followUpDate = d;
  } else if (tab === 'completed') {
    tabFilter = {
      OR: [
        { outcome: 'no_show' },
        { outcome: 'dissatisfied' },
        { outcome: 'attended', attendedAction: 'appointment_needed', appointmentGiven: true },
        { outcome: 'attended', attendedAction: 'follow_up_needed', followUpDone: true },
      ],
    };
  } else if (tab === 'new') {
    tabFilter = { workDate: todayDateOnlyUtc() };
  }

  return {
    AND: [tabFilter, ...(category ? [category] : []), ...(searchFilter ? [searchFilter] : [])],
  };
}

export type CreateFollowUpInput = {
  patientName?: unknown;
  patientPhone?: unknown;
  doctorName?: unknown;
  serviceCategory?: unknown;
  satisfactionDoctor?: unknown;
  satisfactionAssistants?: unknown;
  satisfactionReception?: unknown;
  outcome?: unknown;
  attendedAction?: unknown;
  dissatisfactionTarget?: unknown;
  followUpDate?: unknown;
  workDate?: unknown;
  notes?: unknown;
};

export function parseCreateFollowUpBody(body: CreateFollowUpInput) {
  const patientName = String(body.patientName || '').trim();
  const patientPhone = normalizePhoneDigits(body.patientPhone);
  const doctorName = String(body.doctorName || '').trim();
  const serviceCategory = String(body.serviceCategory || '');
  const outcome = String(body.outcome || '');

  if (patientName.length < 2) throw new Error('نام بیمار الزامی است.');
  if (patientPhone.length < 10) throw new Error('شماره تماس معتبر نیست.');
  if (doctorName.length < 2) throw new Error('نام دکتر الزامی است.');
  if (!FOLLOW_UP_SERVICE_OPTIONS.some((o) => o.id === serviceCategory)) {
    throw new Error('بخش خدمت را انتخاب کنید.');
  }
  if (!['attended', 'no_show', 'dissatisfied'].includes(outcome)) {
    throw new Error('نتیجه مراجعه نامعتبر است.');
  }

  const satisfactionDoctor = parseRating(body.satisfactionDoctor);
  const satisfactionAssistants = parseRating(body.satisfactionAssistants);
  const satisfactionReception = parseRating(body.satisfactionReception);

  let attendedAction: 'appointment_needed' | 'follow_up_needed' | null = null;
  let dissatisfactionTarget: 'doctor' | 'staff' | 'environment' | null = null;
  let followUpDate: Date | null = null;

  if (outcome === 'attended') {
    const action = String(body.attendedAction || '');
    if (!FOLLOW_UP_ATTENDED_ACTION_OPTIONS.some((o) => o.id === action)) {
      throw new Error('برای «آمد» یکی از گزینه‌های نوبت یا پیگیری را انتخاب کنید.');
    }
    attendedAction = action as 'appointment_needed' | 'follow_up_needed';
    if (attendedAction === 'follow_up_needed') {
      followUpDate = parseIsoDateOnly(body.followUpDate);
      if (!followUpDate) throw new Error('تاریخ پیگیری بعدی را انتخاب کنید.');
    }
  } else {
    const target = String(body.dissatisfactionTarget || '');
    if (!FOLLOW_UP_DISSATISFACTION_OPTIONS.some((o) => o.id === target)) {
      throw new Error('علت نارضایتی / عدم مراجعه را انتخاب کنید.');
    }
    dissatisfactionTarget = target as 'doctor' | 'staff' | 'environment';
  }

  const workDate = parseIsoDateOnly(body.workDate) || todayDateOnlyUtc();
  const notes = String(body.notes || '').trim() || null;

  return {
    workDate,
    patientName,
    patientPhone,
    doctorName,
    serviceCategory: serviceCategory as 'dental' | 'medical' | 'nursing' | 'laser',
    satisfactionDoctor,
    satisfactionAssistants,
    satisfactionReception,
    outcome: outcome as 'attended' | 'no_show' | 'dissatisfied',
    attendedAction,
    dissatisfactionTarget,
    followUpDate,
    notes,
  };
}

export { isAwaitingAppointment, isAwaitingFollowUp, isCompletedCase };
