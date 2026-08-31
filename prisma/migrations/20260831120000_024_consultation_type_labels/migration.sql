-- Rename consultation type labels (video → ویزیت اورژانسی, phone → ویزیت صوتی)
UPDATE "ConsultationType"
SET
  "label" = 'ویزیت اورژانسی',
  "desc" = 'ویزیت فوری — هماهنگی سریع با پزشک در بستر اپلیکیشن'
WHERE "id" = 'video';

UPDATE "ConsultationType"
SET
  "label" = 'ویزیت صوتی',
  "desc" = 'تماس صوتی با پزشک یا کارشناس مربوطه'
WHERE "id" = 'phone';
