import { model, Schema, Types } from "mongoose";
import { TDailyProgress } from "./progress.interface";

const progressSchema = new Schema<TDailyProgress>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "account", required: true },
        date: { type: String, required: true },   // "YYYY-MM-DD"
        count: { type: Number, default: 0 },
    },
    { versionKey: false, timestamps: false }
);

// One document per user per day
progressSchema.index({ userId: 1, date: 1 }, { unique: true });

export const Progress_Model = model<TDailyProgress>("progress", progressSchema);
