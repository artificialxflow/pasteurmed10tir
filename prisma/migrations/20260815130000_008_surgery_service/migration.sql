-- Replace mistaken "دندان سازی" homepage card with surgery service.

UPDATE "Service"
SET
  "id" = 'surgery',
  "title" = 'جراحی',
  "emoji" = '🔪',
  "description" = 'مشاوره پیش از عمل و بررسی نیاز به جراحی',
  "href" = '/medical/specialty',
  "image" = 'https://images.unsplash.com/photo-1551190822-a933c784bdaf?w=600&h=400&fit=crop',
  "color" = 'blue',
  "active" = true
WHERE "title" ILIKE '%دندان%sاز%'
   OR "title" = 'دندان سازی'
   OR "title" = 'دندانسازی';

INSERT INTO "Service" (
  "id",
  "title",
  "emoji",
  "description",
  "href",
  "image",
  "color",
  "active",
  "sortOrder"
)
SELECT
  'surgery',
  'جراحی',
  '🔪',
  'مشاوره پیش از عمل و بررسی نیاز به جراحی',
  '/medical/specialty',
  'https://images.unsplash.com/photo-1551190822-a933c784bdaf?w=600&h=400&fit=crop',
  'blue',
  true,
  COALESCE((SELECT MAX("sortOrder") FROM "Service"), -1) + 1
WHERE NOT EXISTS (
  SELECT 1 FROM "Service" WHERE "id" = 'surgery' OR "title" = 'جراحی'
);
