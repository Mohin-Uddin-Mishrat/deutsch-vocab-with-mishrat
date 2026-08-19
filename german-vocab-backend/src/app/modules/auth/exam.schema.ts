import { model, Schema, Types } from "mongoose";

export type TExamAnswer = { bangla: string; expected: string[]; answer: string; correct: boolean };
export type TExam = {
    userId: Types.ObjectId;
    questions: { bangla: string; english: string[]; sentence?: string }[];
    answers: TExamAnswer[];
    score: number;
    total: number;
    submittedAt?: Date;
};

const questionSchema = new Schema({
    bangla: { type: String, required: true },
    english: { type: [String], required: true },
    sentence: { type: String },
}, { _id: false });

const answerSchema = new Schema({
    bangla: { type: String, required: true },
    expected: { type: [String], required: true },
    answer: { type: String, default: "" },
    correct: { type: Boolean, required: true },
}, { _id: false });

const examSchema = new Schema<TExam>({
    userId: { type: Schema.Types.ObjectId, ref: "account", required: true },
    questions: { type: [questionSchema], required: true },
    answers: { type: [answerSchema], default: [] },
    score: { type: Number, default: 0 },
    total: { type: Number, required: true },
    submittedAt: { type: Date },
}, { versionKey: false, timestamps: true });

examSchema.index({ userId: 1, createdAt: -1 });

export const Exam_Model = model<TExam>("exam", examSchema);
