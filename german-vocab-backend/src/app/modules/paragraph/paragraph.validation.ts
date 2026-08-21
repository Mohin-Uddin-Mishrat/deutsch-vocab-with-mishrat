import { z } from 'zod';

const createParagraph = z.object({
    input: z.string().trim().min(1, 'Paragraph input is required').max(100000, 'Paragraph input is too long'),
});

const createCategory = z.object({
    name: z.string().trim().min(1, 'Category name is required').max(100),
});

export const paragraph_validation = { createCategory, createParagraph };
