-- updates/35/09 — طرح اکوپلاس
INSERT INTO "MembershipPlan" (
  "id",
  "name",
  "price",
  "priceNum",
  "loanTermLabel",
  "loanLimit",
  "downPaymentPercent",
  "features",
  "terms",
  "highlighted",
  "sortOrder"
)
VALUES (
  'eco-plus',
  'اکوپلاس',
  '۵,۰۰۰,۰۰۰',
  5000000,
  '۱۸ ماهه',
  303000000,
  0,
  ARRAY[
    'بدون پیش‌پرداخت وام',
    'سقف وام ۳۰۳ میلیون تومان — ۱۸ ماه',
    'سود ۲۰٪ سالانه',
    'حق عضویت ۵M / ۷.۵M'
  ]::TEXT[],
  'طرح اکوپلاس (Eco Plus)',
  false,
  15
)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "price" = EXCLUDED."price",
  "priceNum" = EXCLUDED."priceNum",
  "loanTermLabel" = EXCLUDED."loanTermLabel",
  "loanLimit" = EXCLUDED."loanLimit",
  "downPaymentPercent" = EXCLUDED."downPaymentPercent",
  "features" = EXCLUDED."features",
  "terms" = EXCLUDED."terms",
  "sortOrder" = EXCLUDED."sortOrder";