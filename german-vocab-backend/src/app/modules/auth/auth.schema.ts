import { model, Schema } from "mongoose";
import { TAccount } from "./auth.interface";

const personalVocabularySchema = new Schema({
    bangla: { type: String, required: true, trim: true },
    english: { type: [String], required: true },
    sentence: { type: String, trim: true },
}, { _id: false });

const authSchema = new Schema<TAccount>({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    lastPasswordChange: { type: String },
    isDeleted: { type: Boolean, default: false },
    accountStatus: { type: String, default: "ACTIVE" },
    role: { type: String, default: "USER" },
    isVerified: { type: Boolean, default: true },
    learned: { type: [personalVocabularySchema], default: [] },
    pending: { type: [personalVocabularySchema], default: [] },
}, {
    versionKey: false,
    timestamps: true
});


export const Account_Model = model("account", authSchema)
