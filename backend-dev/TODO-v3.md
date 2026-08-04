# TODO v3 — Clinical Operations (Phase 3)

## Backend

- [x] Prisma models: Booking, Consultation, InsuranceInquiry, Reminder, DoctorReview, Complaint, PartnerRequest
- [x] Migration `003_operations`
- [x] `scripts/seed-phase3.ts`
- [x] Patient API: `/api/operations/*` with IDOR checks on owned resources
- [x] Admin API: `/api/admin/operations/*`

## Frontend wired

- [x] BookingWizard — slot check + reservation fee from API
- [x] ConfirmPayment — insurances API, profile from `/api/auth/me`, booking + inquiry API
- [x] ConsultationForm → POST consultation API
- [x] PartnerRequestForm, DoctorReviewForm, ComplaintsPage → API
- [x] Admin: bookings, consultations, insurances inquiries, patients (DB), reviews, complaints, partners, reminders
- [x] RemindersPage + ReminderService → `/api/operations/reminders`
- [x] Admin dashboard → bookings/patients/complaints counts from API
- [x] Duplicate migration `20260804151107` removed (keep `20260804151000` only)

## Still mock (Phase 4+)

- Club points, commissions, wallet, membership payment paths
- Shop orders, installments reminders detail

## Run locally

```powershell
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run db:seed:phase3
npm run dev
```

## Runflare after deploy

```powershell
npx prisma migrate deploy
npm run db:seed:phase3
```

## Done when

- [ ] Manual tests phase 3 pass (see TEST-MANUAL.md)
- [x] `npm run build` OK (2026-08-04)
- [x] `npm run db:seed:phase3` OK locally
- [ ] Live deploy + seed on Runflare (`migrate deploy` + `db:seed:phase3`)
- [ ] Live IDOR check with two patients
- [ ] git commit
