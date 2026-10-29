-- CreateEnum
CREATE TYPE "AiKnowledgeSource" AS ENUM ('site_map', 'admin_manual', 'from_pending', 'org_policy');

-- CreateEnum
CREATE TYPE "AiPendingStatus" AS ENUM ('open', 'answered', 'dismissed');

-- CreateTable
CREATE TABLE "AiSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "voiceMaxSeconds" INTEGER NOT NULL DEFAULT 180,
    "similarityThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.42,
    "retrievalTopK" INTEGER NOT NULL DEFAULT 5,
    "preferredProvider" TEXT NOT NULL DEFAULT 'gapgpt',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiKnowledgeDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" "AiKnowledgeSource" NOT NULL DEFAULT 'admin_manual',
    "organizationId" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "body" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiKnowledgeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiKnowledgeChunk" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiKnowledgeChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiPendingQuestion" (
    "id" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "organizationId" TEXT,
    "status" "AiPendingStatus" NOT NULL DEFAULT 'open',
    "answerDocumentId" TEXT,
    "adminAnswerText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "answeredAt" TIMESTAMP(3),

    CONSTRAINT "AiPendingQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiKnowledgeDocument_organizationId_idx" ON "AiKnowledgeDocument"("organizationId");

-- CreateIndex
CREATE INDEX "AiKnowledgeDocument_source_idx" ON "AiKnowledgeDocument"("source");

-- CreateIndex
CREATE INDEX "AiKnowledgeDocument_published_idx" ON "AiKnowledgeDocument"("published");

-- CreateIndex
CREATE INDEX "AiKnowledgeChunk_documentId_idx" ON "AiKnowledgeChunk"("documentId");

-- CreateIndex
CREATE INDEX "AiPendingQuestion_status_idx" ON "AiPendingQuestion"("status");

-- CreateIndex
CREATE INDEX "AiPendingQuestion_createdAt_idx" ON "AiPendingQuestion"("createdAt");

-- CreateIndex
CREATE INDEX "AiPendingQuestion_organizationId_idx" ON "AiPendingQuestion"("organizationId");

-- AddForeignKey
ALTER TABLE "AiKnowledgeDocument" ADD CONSTRAINT "AiKnowledgeDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiKnowledgeChunk" ADD CONSTRAINT "AiKnowledgeChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "AiKnowledgeDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiPendingQuestion" ADD CONSTRAINT "AiPendingQuestion_answerDocumentId_fkey" FOREIGN KEY ("answerDocumentId") REFERENCES "AiKnowledgeDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Vector index (cosine)
CREATE INDEX "AiKnowledgeChunk_embedding_hnsw_idx" ON "AiKnowledgeChunk" USING hnsw ("embedding" vector_cosine_ops);

-- Default settings row
INSERT INTO "AiSetting" ("id", "voiceMaxSeconds", "similarityThreshold", "retrievalTopK", "preferredProvider", "updatedAt")
VALUES ('default', 180, 0.42, 5, 'gapgpt', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
