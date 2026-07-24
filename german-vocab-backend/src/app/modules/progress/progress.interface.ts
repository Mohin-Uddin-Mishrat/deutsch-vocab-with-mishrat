import { Types } from "mongoose";

export type TDailyProgress = {
    userId: Types.ObjectId;
    date: string;   // "YYYY-MM-DD"
    count: number;  // accumulated total for that day
};
