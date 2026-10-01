import mongoose, { Document, Schema } from 'mongoose';

export interface IUserQuizLog extends Document {
  zaloId: string; // user's Zalo identifier
  date: string; // YYYY-MM-DD representing the quiz date (UTC+7)
  questionDay: number; // day number (1-30) for which the question was served
  questionId: string; // reference to QuizQuestion.questionId
  answerKey?: string; // key chosen by the user
  isCorrect?: boolean; // whether the answer was correct
}

const UserQuizLogSchema = new Schema<IUserQuizLog>({
  zaloId: { type: String, required: true },
  date: { type: String, required: true },
  questionDay: { type: Number, required: true, min: 1, max: 31 },
  questionId: { type: String, required: true },
  answerKey: { type: String },
  isCorrect: { type: Boolean },
});

UserQuizLogSchema.index({ zaloId: 1, date: 1 }, { unique: true });

export const UserQuizLog = mongoose.model<IUserQuizLog>('UserQuizLog', UserQuizLogSchema);
