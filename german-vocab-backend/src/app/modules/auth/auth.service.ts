import { AppError } from "../../utils/app_error";
import { TAccount, TLoginPayload, TPersonalVocabulary, TRegisterPayload } from "./auth.interface";
import { Account_Model } from "./auth.schema";
import httpStatus from 'http-status';
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { jwtHelpers } from "../../utils/JWT";
import { configs } from "../../configs";
import { JwtPayload, Secret } from "jsonwebtoken";
import sendMail from "../../utils/mail_sender";
import { isAccountExist } from "../../utils/isAccountExist";
import { Category_Model } from "../vocabulary/vocabulary.schema";
import { Progress_Model } from "../progress/progress.schema";
// register user
const register_user_into_db = async (payload: TRegisterPayload) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // Check if the account already exists
        const isExistAccount = await Account_Model.findOne(
            { email: payload?.email },
            null,
            { session }
        );
        if (isExistAccount) {
            throw new AppError("Account already exist!!", httpStatus.BAD_REQUEST);
        }

        // Hash the password
        const hashPassword = bcrypt.hashSync(payload?.password, 10);

        // Create account
        const accountPayload: TAccount = {
            name: payload.name.trim(),
            email: payload.email,
            password: hashPassword,
            lastPasswordChange: new Date()
        };
        const newAccount = await Account_Model.create([accountPayload], { session });

        // Create user
        // make verified link
        const verifiedToken = jwtHelpers.generateToken(
            {
                email: payload?.email
            },
            configs.jwt.verified_token as Secret,
            '5m'
        );
        const verificationLink = `${configs.jwt.front_end_url}/verified?token=${verifiedToken}`;
        // Commit the transaction
        await session.commitTransaction();
        // await sendMail({
        //     to: payload?.email,
        //     subject: "Thanks for creating account!",
        //     textBody: `New Account successfully created on ${new Date().toLocaleDateString()}`,
        //     name: payload?.name,
        //     htmlBody: `
        //     <p>Thanks for creating an account with us. We’re excited to have you on board! Click the button below to
        //         verify your email and activate your account:</p>


        //     <div style="text-align: center; margin: 30px 0;">
        //         <a href="${verificationLink}" target="_blank"
        //             style="background-color: #4CAF50; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block; font-size: 18px;"
        //             class="btn">
        //             Verify My Email
        //         </a>
        //     </div>

        //     <p>If you did not create this account, please ignore this email.</p>
        //     `
        // })
        const createdAccount = newAccount[0];
        const accessToken = jwtHelpers.generateToken(
            { email: createdAccount.email, role: createdAccount.role },
            configs.jwt.access_token as Secret,
            configs.jwt.access_expires as string,
        );
        const refreshToken = jwtHelpers.generateToken(
            { email: createdAccount.email, role: createdAccount.role },
            configs.jwt.refresh_token as Secret,
            configs.jwt.refresh_expires as string,
        );
        return { accessToken, refreshToken, role: createdAccount.role };
    } catch (error) {
        console.log(error)
        // Rollback the transaction
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};


// login user
const login_user_from_db = async (payload: TLoginPayload) => {
    // check account info 
    const isExistAccount = await isAccountExist(payload?.email)

    const isPasswordMatch = await bcrypt.compare(
        payload.password,
        isExistAccount.password,
    );
    if (!isPasswordMatch) {
        throw new AppError('Invalid password', httpStatus.UNAUTHORIZED);
    }
    const accessToken = jwtHelpers.generateToken(
        {
            email: isExistAccount.email,
            role: isExistAccount.role,
        },
        configs.jwt.access_token as Secret,
        configs.jwt.access_expires as string,
    );

    const refreshToken = jwtHelpers.generateToken(
        {
            email: isExistAccount.email,
            role: isExistAccount.role,
        },
        configs.jwt.refresh_token as Secret,
        configs.jwt.refresh_expires as string,
    );
    return {
        accessToken: accessToken,
        refreshToken: refreshToken,
        role: isExistAccount.role
    };

}

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

const parsePersonalVocabularyInput = (input: string): TPersonalVocabulary[] => {
    const parsedByBangla = new Map<string, TPersonalVocabulary>();
    splitVocabularyRows(input).forEach((row, index) => {
        const separatorIndex = row.indexOf('=');
        if (separatorIndex === -1) throw new AppError(`Entry ${index + 1} must use "Bangla = Meaning" format`, httpStatus.BAD_REQUEST);
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

        const english = rightHand.split('+').map(word => word.trim()).filter(Boolean);
        if (!bangla || !english.length) throw new AppError(`Entry ${index + 1} needs both a Bangla word and at least one meaning`, httpStatus.BAD_REQUEST);
        const existing = parsedByBangla.get(bangla);
        if (existing) {
            existing.english = [...new Set([...existing.english, ...english])];
            if (sentence) existing.sentence = sentence;
        } else parsedByBangla.set(bangla, { bangla, english: [...new Set(english)], sentence });
    });
    return [...parsedByBangla.values()];
};

const upload_personal_vocabulary_into_db = async (email: string, listType: string, input: string) => {
    if (listType !== 'learned' && listType !== 'pending') throw new AppError('Vocabulary list must be learned or pending', httpStatus.BAD_REQUEST);
    const account = await isAccountExist(email);
    const entries = parsePersonalVocabularyInput(input);
    const list = account[listType] || [];
    const existingByBangla = new Map(list.map(vocabulary => [vocabulary.bangla, vocabulary]));
    let created = 0;
    let updated = 0;
    entries.forEach(entry => {
        const existing = existingByBangla.get(entry.bangla);
        if (!existing) {
            list.push(entry);
            created += 1;
            return;
        }
        const meanings = [...new Set([...existing.english, ...entry.english])];
        const sentenceChanged = Boolean(entry.sentence && entry.sentence !== existing.sentence);
        if (meanings.length !== existing.english.length || sentenceChanged) {
            existing.english = meanings;
            if (entry.sentence) existing.sentence = entry.sentence;
            updated += 1;
        }
    });
    account[listType] = list;
    if (listType === 'learned') {
        const learnedBanglaSet = new Set(entries.map(e => e.bangla));
        account.pending = (account.pending || []).filter(item => !learnedBanglaSet.has(item.bangla));
    }
    account.lastVocabularyActivityAt = new Date();
    account.lastVocabularyActivityType = listType === 'learned' ? 'LEARNED' : 'PENDING';
    await account.save();

    // Record daily progress when new vocabulary is added to 'learned'
    if (listType === 'learned' && created > 0) {
        const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
        await Progress_Model.findOneAndUpdate(
            { userId: account._id, date: today },
            { $inc: { count: created } },
            { upsert: true, new: true },
        );
    }

    return { processed: entries.length, created, updated };
};

const delete_personal_vocabulary_from_db = async (email: string, listType: string, bangla: string) => {
    if (listType !== 'learned' && listType !== 'pending') throw new AppError('Vocabulary list must be learned or pending', httpStatus.BAD_REQUEST);
    const account = await isAccountExist(email);
    const list = account[listType] || [];
    const nextList = list.filter(vocabulary => vocabulary.bangla !== bangla);
    if (nextList.length === list.length) throw new AppError('Vocabulary was not found in this list', httpStatus.NOT_FOUND);
    account[listType] = nextList;
    await account.save();
    return { deleted: bangla, listType };
};

const delete_personal_vocabularies_from_db = async (email: string, listType: string, bangla: string[]) => {
    if (listType !== 'learned' && listType !== 'pending') throw new AppError('Vocabulary list must be learned or pending', httpStatus.BAD_REQUEST);
    const account = await isAccountExist(email);
    const selected = new Set(bangla);
    const list = account[listType] || [];
    const nextList = list.filter(vocabulary => !selected.has(vocabulary.bangla));
    const deleted = list.length - nextList.length;
    if (!deleted) throw new AppError('None of the selected vocabulary items were found', httpStatus.NOT_FOUND);
    account[listType] = nextList;
    await account.save();
    return { deleted, listType };
};

const get_all_users_from_db = async () => Account_Model.aggregate([
    { $match: { role: 'USER', isDeleted: false } },
    {
        $project: {
            name: 1,
            email: 1,
            accountStatus: 1,
            isVerified: 1,
            createdAt: 1,
            learnedVocabularyCount: { $size: { $ifNull: ['$learned', []] } },
            pendingVocabularyCount: { $size: { $ifNull: ['$pending', []] } },
            lastVocabularyActivityAt: 1,
            lastVocabularyActivityType: 1,
        },
    },
    { $sort: { createdAt: -1 } },
]);

const delete_user_from_db = async (userId: string) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new AppError('Invalid user ID', httpStatus.BAD_REQUEST);
    const user = await Account_Model.findOne({ _id: userId, role: 'USER', isDeleted: false });
    if (!user) throw new AppError('User not found', httpStatus.NOT_FOUND);
    user.isDeleted = true;
    await user.save();
    return { deletedUserId: userId };
};

const get_my_profile_from_db = async (email: string) => {
    const account = await isAccountExist(email);
    const { password, learned = [], pending = [], ...accountDetails } = account.toObject();
    const serializePersonalVocabulary = (vocabulary: TPersonalVocabulary) => ({
        bangla: vocabulary.bangla,
        english: vocabulary.english,
        ...(vocabulary.sentence ? { sentence: vocabulary.sentence } : {}),
    });
    const profileAccount = {
        ...accountDetails,
        learned: learned.map(serializePersonalVocabulary),
        pending: pending.map(serializePersonalVocabulary),
    };

    const serializeCategory = (category: typeof account & { name: string; vocabularies: { bangla: string; german: string[]; sentence?: string }[] }) => ({
        _id: category._id,
        name: category.name,
        vocabularies: category.vocabularies.map(vocabulary => ({
            bangla: vocabulary.bangla,
            german: vocabulary.german,
            ...(vocabulary.sentence ? { sentence: vocabulary.sentence } : {}),
        })),
    });
    const categoryNameList = (categories: ReturnType<typeof serializeCategory>[]) => categories.map(category => ({ _id: category._id, name: category.name }));

    if (account.role === 'ADMIN') {
        const allCategories = (await Category_Model.find().sort({ name: 1 })).map(category => serializeCategory(category as never));
        return {
            account: profileAccount,
            categories: { all: allCategories },
            categoryNameList: { all: categoryNameList(allCategories) },
        };
    }

    const adminIds = await Account_Model.find({ role: 'ADMIN' }).distinct('_id');
    const [ownCategories, adminCategories] = await Promise.all([
        Category_Model.find({ createdBy: account._id }).sort({ name: 1 }),
        Category_Model.find({ createdBy: { $in: adminIds } }).sort({ name: 1 }),
    ]);
    const own = ownCategories.map(category => serializeCategory(category as never));
    const admin = adminCategories.map(category => serializeCategory(category as never));
    return {
        account: profileAccount,
        categories: { own, admin },
        categoryNameList: {
            own: categoryNameList(own),
            admin: categoryNameList(admin),
        },
    };
};


const refresh_token_from_db = async (token: string) => {
    let decodedData;
    try {
        decodedData = jwtHelpers.verifyToken(
            token,
            configs.jwt.refresh_token as Secret,
        );
    } catch (err) {
        throw new Error('You are not authorized!');
    }

    const userData = await Account_Model.findOne({ email: decodedData.email, status: "ACTIVE", isDeleted: false })

    const accessToken = jwtHelpers.generateToken(
        {
            email: userData!.email,
            role: userData!.role,
        },
        configs.jwt.access_token as Secret,
        configs.jwt.access_expires as string,
    );

    return accessToken;
};

const change_password_from_db = async (
    user: JwtPayload,
    payload: {
        oldPassword: string;
        newPassword: string;
    },
) => {
    const isExistAccount = await isAccountExist(user?.email)

    const isCorrectPassword: boolean = await bcrypt.compare(
        payload.oldPassword,
        isExistAccount.password,
    );

    if (!isCorrectPassword) {
        throw new AppError('Old password is incorrect', httpStatus.UNAUTHORIZED);
    }

    const hashedPassword: string = await bcrypt.hash(payload.newPassword, 10);
    await Account_Model.findOneAndUpdate({ email: isExistAccount.email }, {
        password: hashedPassword,
        lastPasswordChange: Date()
    })
    return 'Password changed successful.';
};

const forget_password_from_db = async (email: string) => {
    const isAccountExists = await isAccountExist(email)
    const resetToken = jwtHelpers.generateToken(
        {
            email: isAccountExists.email,
            role: isAccountExists.role,
        },
        configs.jwt.reset_secret as Secret,
        configs.jwt.reset_expires as string,
    );

    const resetPasswordLink = `${configs.jwt.front_end_url}/reset?token=${resetToken}&email=${isAccountExists.email}`;
    const emailTemplate = `<p>Click the link below to reset your password:</p><a href="${resetPasswordLink}">Reset Password</a>`;

    await sendMail({
        to: email,
        subject: "Password reset successful!",
        textBody: "Your password is successfully reset.",
        htmlBody: emailTemplate
    });

    return 'Check your email for reset link';
};

const reset_password_into_db = async (
    token: string,
    email: string,
    newPassword: string,
) => {
    let decodedData: JwtPayload;
    try {
        decodedData = jwtHelpers.verifyToken(
            token,
            configs.jwt.reset_secret as Secret,
        );
    } catch (err) {
        throw new AppError(
            'Your reset link is expire. Submit new link request!!',
            httpStatus.UNAUTHORIZED,
        );
    }

    const isAccountExists = await isAccountExist(email)

    const hashedPassword: string = await bcrypt.hash(newPassword, 10);

    await Account_Model.findOneAndUpdate({ email: isAccountExists.email }, {
        password: hashedPassword,
        lastPasswordChange: Date()
    })
    return 'Password reset successfully!';
};

const verified_account_into_db = async (token: string) => {
    try {
        const { email } = jwtHelpers.verifyToken(token, configs.jwt.verified_token as string)
        // check account is already verified or blocked
        const isExistAccount = await Account_Model.findOne({ email })
        // check account
        if (!isExistAccount) {
            throw new AppError("Account not found!!", httpStatus.NOT_FOUND)
        }
        if (isExistAccount.isDeleted) {
            throw new AppError("Account deleted !!", httpStatus.BAD_REQUEST)
        }
        const result = await Account_Model.findOneAndUpdate({ email }, { isVerified: true }, { new: true })

        return result
    } catch (error) {
        throw new AppError("Invalid or Expired token!!!", httpStatus.BAD_REQUEST)
    }

}

const get_new_verification_link_from_db = async (email: string) => {
    const isExistAccount = await isAccountExist(email)

    const verifiedToken = jwtHelpers.generateToken(
        {
            email
        },
        configs.jwt.verified_token as Secret,
        '5m'
    );
    const verificationLink = `${configs.jwt.front_end_url}/verified?token=${verifiedToken}`;
    await sendMail({
        to: email,
        subject: "New Verification link",
        textBody: `New Account verification link is successfully created on ${new Date().toLocaleDateString()}`,
        htmlBody: `
            <p>Thanks for creating an account with us. We’re excited to have you on board! Click the button below to
                verify your email and activate your account:</p>


            <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}" target="_blank"
                    style="background-color: #4CAF50; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block; font-size: 18px;"
                    class="btn">
                    Verify My Email
                </a>
            </div>

            <p>If you did not create this account, please ignore this email.</p>
            `
    })

    return null
}

export const auth_services = {
    register_user_into_db,
    login_user_from_db,
    get_my_profile_from_db,
    upload_personal_vocabulary_into_db,
    delete_personal_vocabulary_from_db,
    delete_personal_vocabularies_from_db,
    get_all_users_from_db,
    delete_user_from_db,
    refresh_token_from_db,
    change_password_from_db,
    forget_password_from_db,
    reset_password_into_db,
    verified_account_into_db,
    get_new_verification_link_from_db
}
