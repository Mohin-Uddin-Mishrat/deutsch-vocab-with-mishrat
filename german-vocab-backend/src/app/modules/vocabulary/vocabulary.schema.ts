import { model, Schema } from 'mongoose';
import { TCategory } from './vocabulary.interface';

const embeddedVocabularySchema = new Schema({
    bangla: { type: String, required: true, trim: true },
    german: { type: [String], required: true },
    sentence: { type: String, trim: true },
}, { _id: false });

const categorySchema = new Schema<TCategory>({
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'account' },
    vocabularies: { type: [embeddedVocabularySchema], default: [] },
}, { versionKey: false, timestamps: true });

categorySchema.index({ normalizedName: 1, createdBy: 1 }, { unique: true });

export const Category_Model = model<TCategory>('category', categorySchema);
