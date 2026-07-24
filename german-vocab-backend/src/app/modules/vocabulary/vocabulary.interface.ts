import { Types } from 'mongoose';

export type TCategory = {
    name: string;
    normalizedName: string;
    createdBy: Types.ObjectId;
    vocabularies: TEmbeddedVocabulary[];
};

export type TEmbeddedVocabulary = {
    bangla: string;
    german: string[];
    sentence?: string;
};

export type TParsedVocabulary = {
    bangla: string;
    german: string[];
    sentence?: string;
};
