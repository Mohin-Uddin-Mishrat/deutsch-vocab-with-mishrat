import { z } from 'zod';

const createCategory = z.object({
    name: z.string().trim().min(1, 'Category name is required').max(100),
});

const uploadVocabulary = z.object({
    input: z.string().trim().min(1, 'Vocabulary input is required'),
});

export const vocabulary_validation = { createCategory, uploadVocabulary };
