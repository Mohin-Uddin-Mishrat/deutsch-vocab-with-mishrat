import { Account_Model } from '../auth/auth.schema';
import { AppError } from '../../utils/app_error';
import { Progress_Model } from './progress.schema';
import httpStatus from 'http-status';

const getUserId = async (email: string) => {
    const user = await Account_Model.findOne({ email }).select('_id');
    if (!user) throw new AppError('Account not found', httpStatus.NOT_FOUND);
    return user._id;
};

/** Return YYYY-MM-DD string for a Date offset by `offsetDays` from today */
const toDateString = (date: Date) => date.toISOString().slice(0, 10);

const get_progress_from_db = async (email: string, range: string) => {
    const daysMap: Record<string, number> = { week: 7, month: 30, '3month': 90, '6month': 180 };
    const days = daysMap[range] ?? 7;
    const userId = await getUserId(email);

    // Build a list of the last `days` date strings (inclusive of today)
    const dateStrings: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dateStrings.push(toDateString(d));
    }

    const startDate = dateStrings[0];
    const endDate   = dateStrings[dateStrings.length - 1];

    const records = await Progress_Model.find({
        userId,
        date: { $gte: startDate, $lte: endDate },
    }).select('date count -_id').lean();

    // Build a map for O(1) lookup
    const countByDate = new Map(records.map(r => [r.date, r.count]));

    // Fill gaps with 0 so every day is represented
    return dateStrings.map(date => ({ date, count: countByDate.get(date) ?? 0 }));
};

export const progress_services = { get_progress_from_db };
