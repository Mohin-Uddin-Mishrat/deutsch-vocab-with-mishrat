import httpStatus from 'http-status';
import { AppError } from '../../utils/app_error';
import { TUsedWord } from './paragraph.interface';
import { Account_Model } from '../auth/auth.schema';
import { ParagraphCategory_Model } from './paragraph.schema';
import { Types } from 'mongoose';

type Requester = { email: string; role: string };

const cleanText = (value: string) => value.trim().replace(/\s+/g, ' ');

const splitSentences = (paragraph: string, language: 'German' | 'Bangla') => {
    const sentences = paragraph.match(/[^.।]+[.।]+|[^.।]+$/g)
        ?.map(cleanText)
        .filter(Boolean) ?? [];

    if (!sentences.length) {
        throw new AppError(`${language} paragraph must contain at least one sentence`, httpStatus.BAD_REQUEST);
    }
    return sentences;
};

const parseUsedWords = (input: string): TUsedWord[] => {
    const rows = input.split(/[\r\n,]+/).map(cleanText).filter(Boolean);
    if (!rows.length) throw new AppError('Used words are required', httpStatus.BAD_REQUEST);

    return rows.map((row, index) => {
        const separatorIndex = row.indexOf('=');
        if (separatorIndex === -1 || row.indexOf('=', separatorIndex + 1) !== -1) {
            throw new AppError(`Used word ${index + 1} must use "German = Bangla" format`, httpStatus.BAD_REQUEST);
        }

        const german = cleanText(row.slice(0, separatorIndex));
        const bangla = cleanText(row.slice(separatorIndex + 1));
        if (!german || !bangla) {
            throw new AppError(`Used word ${index + 1} needs both German and Bangla text`, httpStatus.BAD_REQUEST);
        }
        return { german, bangla };
    });
};

export const parseParagraphInput = (input: string) => {
    const sections = input.split('<>');
    if (sections.length !== 3) {
        throw new AppError('Input must contain exactly three sections: German paragraph <> Bangla paragraph <> used words', httpStatus.BAD_REQUEST);
    }

    const [germanSection, banglaSection, usedWordsSection] = sections.map(section => section.trim());
    if (!germanSection || !banglaSection || !usedWordsSection) {
        throw new AppError('German paragraph, Bangla paragraph, and used words are all required', httpStatus.BAD_REQUEST);
    }

    const german = splitSentences(germanSection, 'German');
    const bangla = splitSentences(banglaSection, 'Bangla');
    if (german.length !== bangla.length) {
        throw new AppError(`German and Bangla paragraphs must have the same number of sentences (received ${german.length} German and ${bangla.length} Bangla)`, httpStatus.BAD_REQUEST);
    }

    return { german, bangla, usedWords: parseUsedWords(usedWordsSection) };
};

const normalizeCategoryName = (name: string) => cleanText(name).toLocaleLowerCase();

const getUserId = async (email: string) => {
    const user = await Account_Model.findOne({ email }).select('_id');
    if (!user) throw new AppError('Account not found', httpStatus.NOT_FOUND);
    return user._id;
};

const findCategory = async (categoryId: string) => {
    if (!Types.ObjectId.isValid(categoryId)) throw new AppError('Invalid paragraph category ID', httpStatus.BAD_REQUEST);
    const category = await ParagraphCategory_Model.findById(categoryId);
    if (!category) throw new AppError('Paragraph category not found', httpStatus.NOT_FOUND);
    return category;
};

const serializeCategory = (category: Awaited<ReturnType<typeof findCategory>>) => ({
    _id: category._id,
    name: category.name,
    paragraphs: category.paragraphs,
});

const create_category_into_db = async (name: string, requester: Requester) => ParagraphCategory_Model.create({
    name: cleanText(name),
    normalizedName: normalizeCategoryName(name),
    createdBy: await getUserId(requester.email),
    paragraphs: [],
});

const create_paragraph_into_category = async (categoryId: string, input: string) => {
    const category = await findCategory(categoryId);
    category.paragraphs.push(parseParagraphInput(input));
    await category.save();
    return serializeCategory(category);
};

const get_category_list_from_db = async () => ParagraphCategory_Model.find().select('_id name').sort({ name: 1 });

const get_specific_category_from_db = async (categoryId: string) => serializeCategory(await findCategory(categoryId));

const delete_paragraph_from_category = async (categoryId: string, paragraphIndex: string) => {
    const category = await findCategory(categoryId);
    const index = Number(paragraphIndex);
    if (!Number.isInteger(index) || index < 0 || index >= category.paragraphs.length) {
        throw new AppError('Paragraph was not found in this category', httpStatus.NOT_FOUND);
    }
    category.paragraphs.splice(index, 1);
    await category.save();
    return serializeCategory(category);
};

export const paragraph_services = { create_category_into_db, create_paragraph_into_category, get_category_list_from_db, get_specific_category_from_db, delete_paragraph_from_category };
