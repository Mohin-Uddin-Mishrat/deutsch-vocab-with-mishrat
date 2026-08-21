import { model, Schema } from 'mongoose';
import { TParagraph, TParagraphCategory } from './paragraph.interface';

const usedWordSchema = new Schema({
    german: { type: String, required: true, trim: true },
    bangla: { type: String, required: true, trim: true },
}, { _id: false });

const embeddedParagraphSchema = new Schema<TParagraph>({
    german: { type: [String], required: true },
    bangla: { type: [String], required: true },
    usedWords: { type: [usedWordSchema], required: true },
}, { _id: false });

const paragraphCategorySchema = new Schema<TParagraphCategory>({
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'account' },
    paragraphs: { type: [embeddedParagraphSchema], default: [] },
}, { versionKey: false, timestamps: true });

paragraphCategorySchema.index({ normalizedName: 1, createdBy: 1 }, { unique: true });

export const ParagraphCategory_Model = model<TParagraphCategory>('paragraph_category', paragraphCategorySchema);
