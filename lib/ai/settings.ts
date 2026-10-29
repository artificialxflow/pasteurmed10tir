import { prisma } from '@/lib/prisma';

export type AiSettingsPublic = {
  voiceMaxSeconds: number;
  similarityThreshold: number;
  retrievalTopK: number;
  preferredProvider: string;
};

export async function getAiSettings(): Promise<AiSettingsPublic & { id: string }> {
  let row = await prisma.aiSetting.findUnique({ where: { id: 'default' } });
  if (!row) {
    row = await prisma.aiSetting.create({
      data: {
        id: 'default',
        voiceMaxSeconds: 180,
        similarityThreshold: 0.42,
        retrievalTopK: 5,
        preferredProvider: 'gapgpt',
      },
    });
  }
  return row;
}

export async function updateAiSettings(data: Partial<AiSettingsPublic>) {
  const patch: Partial<AiSettingsPublic> = {};
  if (data.voiceMaxSeconds !== undefined) patch.voiceMaxSeconds = data.voiceMaxSeconds;
  if (data.similarityThreshold !== undefined) patch.similarityThreshold = data.similarityThreshold;
  if (data.retrievalTopK !== undefined) patch.retrievalTopK = data.retrievalTopK;
  if (data.preferredProvider !== undefined) patch.preferredProvider = data.preferredProvider;

  return prisma.aiSetting.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      voiceMaxSeconds: patch.voiceMaxSeconds ?? 180,
      similarityThreshold: patch.similarityThreshold ?? 0.42,
      retrievalTopK: patch.retrievalTopK ?? 5,
      preferredProvider: patch.preferredProvider ?? 'gapgpt',
    },
    update: patch,
  });
}
