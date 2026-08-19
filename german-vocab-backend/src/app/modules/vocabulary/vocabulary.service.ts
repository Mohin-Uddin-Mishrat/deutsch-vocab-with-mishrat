import httpStatus from 'http-status';
import { Types } from 'mongoose';
import { AppError } from '../../utils/app_error';
import { Account_Model } from '../auth/auth.schema';
import { TParsedVocabulary } from './vocabulary.interface';
import { Category_Model } from './vocabulary.schema';

type Requester = { email: string; role: string };

const normalizeCategoryName = (name: string) => name.trim().replace(/\s+/g, ' ').toLocaleLowerCase();

const getUserId = async (email: string) => {
    const user = await Account_Model.findOne({ email }).select('_id');
    if (!user) throw new AppError('Account not found', httpStatus.NOT_FOUND);
    return user._id;
};

const splitVocabularyRows = (input: string) => {
    const rows: string[] = [];
    let currentRow = '';
    let insideSentence = false;
    for (const character of input) {
        if (character === '<') insideSentence = true;
        else if (character === '>') insideSentence = false;

        if ((character === '|' || character === '\n' || character === '\r') && !insideSentence) {
            if (currentRow.trim()) rows.push(currentRow.trim());
            currentRow = '';
        } else currentRow += character;
    }
    if (currentRow.trim()) rows.push(currentRow.trim());
    if (insideSentence) throw new AppError('Each example sentence must be wrapped and closed in angle brackets (<...>)', httpStatus.BAD_REQUEST);
    return rows;
};

const parseVocabularyInput = (input: string): TParsedVocabulary[] => {
    const parsedByBangla = new Map<string, TParsedVocabulary>();
    splitVocabularyRows(input).forEach((row, index) => {
        const separatorIndex = row.indexOf('=');
        if (separatorIndex === -1) throw new AppError(`Entry ${index + 1} must use "Bangla = German" format`, httpStatus.BAD_REQUEST);
        const bangla = row.slice(0, separatorIndex).trim();
        let rightHand = row.slice(separatorIndex + 1).trim();

        let sentence: string | undefined = undefined;
        const startIdx = rightHand.indexOf('<');
        const endIdx = rightHand.lastIndexOf('>');
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            sentence = rightHand.slice(startIdx + 1, endIdx).trim();
            rightHand = (rightHand.slice(0, startIdx) + rightHand.slice(endIdx + 1)).trim();
        } else if (startIdx !== -1 || endIdx !== -1) {
            throw new AppError(`Entry ${index + 1} must wrap its optional sentence in angle brackets (<...>)`, httpStatus.BAD_REQUEST);
        }

        const german = rightHand.split('+').map(word => word.trim()).filter(Boolean);
        if (!bangla || !german.length) throw new AppError(`Entry ${index + 1} needs both a Bangla word and at least one German meaning`, httpStatus.BAD_REQUEST);
        const existing = parsedByBangla.get(bangla);
        if (existing) {
            existing.german = [...new Set([...existing.german, ...german])];
            if (sentence) existing.sentence = sentence;
        } else parsedByBangla.set(bangla, { bangla, german: [...new Set(german)], sentence });
    });
    return [...parsedByBangla.values()];
};

const findCategory = async (categoryId: string) => {
    if (!Types.ObjectId.isValid(categoryId)) throw new AppError('Invalid category ID', httpStatus.BAD_REQUEST);
    const category = await Category_Model.findById(categoryId);
    if (!category) throw new AppError('Category not found', httpStatus.NOT_FOUND);
    return category;
};

const canAccessAdminCategory = async (categoryCreatorId: Types.ObjectId) => {
    const creator = await Account_Model.findById(categoryCreatorId).select('role');
    return creator?.role === 'ADMIN';
};

const getAccessibleCategory = async (categoryId: string, requester: Requester, allowAdminCategory: boolean, requireAdminCreatedCategory = false) => {
    const category = await findCategory(categoryId);
    if (requester.role === 'ADMIN') {
        if (!requireAdminCreatedCategory || await canAccessAdminCategory(category.createdBy)) return category;
        throw new AppError('Admins can upload only to admin-created categories', httpStatus.FORBIDDEN);
    }
    const requesterId = await getUserId(requester.email);
    if (category.createdBy.equals(requesterId)) return category;
    if (allowAdminCategory && await canAccessAdminCategory(category.createdBy)) return category;
    throw new AppError('You are not authorized to access this category', httpStatus.FORBIDDEN);
};

const serializeVocabulary = (vocabulary: TParsedVocabulary) => ({
    bangla: vocabulary.bangla,
    german: vocabulary.german,
    ...(vocabulary.sentence ? { sentence: vocabulary.sentence } : {}),
});

const serializeCategory = (category: Awaited<ReturnType<typeof findCategory>>) => ({
    _id: category._id,
    name: category.name,
    vocabularies: category.vocabularies.map(serializeVocabulary),
});

const create_category_into_db = async (name: string, requester: Requester) => Category_Model.create({
    name: name.trim().replace(/\s+/g, ' '),
    normalizedName: normalizeCategoryName(name),
    createdBy: await getUserId(requester.email),
    vocabularies: [],
});

const upload_vocabulary_into_category = async (categoryId: string, input: string, requester: Requester) => {
    const category = await getAccessibleCategory(categoryId, requester, false, true);
    const entries = parseVocabularyInput(input);
    const existingByBangla = new Map(category.vocabularies.map(vocabulary => [vocabulary.bangla, vocabulary]));
    let created = 0;
    let updated = 0;
    entries.forEach(entry => {
        const existing = existingByBangla.get(entry.bangla);
        if (!existing) {
            category.vocabularies.push(entry);
            created += 1;
            return;
        }
        const meanings = [...new Set([...existing.german, ...entry.german])];
        const sentenceChanged = Boolean(entry.sentence && entry.sentence !== existing.sentence);
        if (meanings.length !== existing.german.length || sentenceChanged) {
            existing.german = meanings;
            if (entry.sentence) existing.sentence = entry.sentence;
            updated += 1;
        }
    });
    await category.save();
    return { processed: entries.length, created, updated };
};

const update_vocabulary_bangla_in_category = async (categoryId: string, vocabularyIndex: string, bangla: string, requester: Requester) => {
    const category = await getAccessibleCategory(categoryId, requester, false, true);
    const index = Number(vocabularyIndex);
    if (!Number.isInteger(index) || index < 0 || index >= category.vocabularies.length) {
        throw new AppError('Vocabulary was not found in this category', httpStatus.NOT_FOUND);
    }

    const nextBangla = bangla.trim();
    const current = category.vocabularies[index];
    if (category.vocabularies.some((vocabulary, itemIndex) => itemIndex !== index && vocabulary.bangla === nextBangla)) {
        throw new AppError('Another vocabulary item already uses this Bangla meaning', httpStatus.CONFLICT);
    }
    current.bangla = nextBangla;
    await category.save();
    return serializeCategory(category);
};

const delete_category_from_db = async (categoryId: string, requester: Requester) => {
    const category = await getAccessibleCategory(categoryId, requester, false);
    await Category_Model.findByIdAndDelete(category._id);
};

const get_specific_category_from_db = async (categoryId: string, requester: Requester) => serializeCategory(await getAccessibleCategory(categoryId, requester, true));

const get_category_list_from_db = async (requester: Requester) => {
    if (requester.role === 'ADMIN') return Category_Model.find().select('_id name').sort({ name: 1 });
    const requesterId = await getUserId(requester.email);
    const adminIds = await Account_Model.find({ role: 'ADMIN' }).distinct('_id');
    const [own, admin] = await Promise.all([
        Category_Model.find({ createdBy: requesterId }).select('_id name').sort({ name: 1 }),
        Category_Model.find({ createdBy: { $in: adminIds } }).select('_id name').sort({ name: 1 }),
    ]);
    return { own, admin };
};

export const vocabulary_services = { create_category_into_db, upload_vocabulary_into_category, update_vocabulary_bangla_in_category, delete_category_from_db, get_specific_category_from_db, get_category_list_from_db };
