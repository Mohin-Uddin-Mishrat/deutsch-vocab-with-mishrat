export type TUsedWord = {
    german: string;
    bangla: string;
};

export type TParagraph = {
    german: string[];
    bangla: string[];
    usedWords: TUsedWord[];
};

export type TParagraphCategory = {
    name: string;
    normalizedName: string;
    createdBy: Types.ObjectId;
    paragraphs: TParagraph[];
};
import { Types } from 'mongoose';
