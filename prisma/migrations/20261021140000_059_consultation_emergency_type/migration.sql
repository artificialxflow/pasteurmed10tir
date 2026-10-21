-- Ensure standard consultation type `emergency` exists (058 only UPDATEd existing rows).
INSERT INTO "ConsultationType" ("id", "label", "emoji", "desc", "priceNum", "price")
VALUES (
  'emergency',
  'ویزیت اورژانسی',
  '🚨',
  'متن + صوت + تصویر — ویزیت اورژانسی فوری',
  1300000,
  '۱,۳۰۰,۰۰۰ تومان'
)
ON CONFLICT ("id") DO UPDATE SET
  "label" = EXCLUDED."label",
  "emoji" = EXCLUDED."emoji",
  "desc" = EXCLUDED."desc",
  "priceNum" = EXCLUDED."priceNum",
  "price" = EXCLUDED."price";
