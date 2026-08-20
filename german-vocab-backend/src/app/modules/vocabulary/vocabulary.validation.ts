import { z } from 'zod';

const createCategory = z.object({
    name: z.string().trim().min(1, 'Category name is required').max(100),
});

const uploadVocabulary = z.object({
    input: z.string().trim().min(1, 'Vocabulary input is required'),
});

const updateVocabularyBangla = z.object({
    bangla: z.string().trim().min(1, 'Bangla meaning is required').max(500),
});

const updateVocabularyBanglaBulk = z.object({
    updates: z.array(z.object({
        vocabularyIndex: z.number().int().min(0),
        bangla: z.string().trim().min(1, 'Bangla meaning is required').max(500),
    })).min(1, 'At least one vocabulary update is required').max(500),
}).superRefine(({ updates }, context) => {
    const indexes = new Set<number>();
    updates.forEach((update, index) => {
        if (indexes.has(update.vocabularyIndex)) {
            context.addIssue({ code: 'custom', path: ['updates', index, 'vocabularyIndex'], message: 'Each vocabulary can only be updated once' });
        }
        indexes.add(update.vocabularyIndex);
    });
});

export const vocabulary_validation = { createCategory, uploadVocabulary, updateVocabularyBangla, updateVocabularyBanglaBulk };
