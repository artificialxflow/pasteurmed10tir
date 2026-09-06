-- CreateIndex
-- شماره پرونده باید یکتا باشد. مقدارهای NULL در ایندکس یکتای Postgres با هم
-- برابر شمرده نمی‌شوند، پس هر تعداد بیمار می‌توانند شماره پرونده نداشته باشند.
CREATE UNIQUE INDEX "PatientProfile_fileNumber_key" ON "PatientProfile"("fileNumber");
