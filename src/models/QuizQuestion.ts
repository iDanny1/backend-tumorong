import mongoose, { Document, Schema } from 'mongoose';

export interface IQuizQuestion extends Document {
  day: number; // 1-30 representing the day of the month
  questionId: string; // unique identifier, could be UUID
  question: string;
  options: { key: string; text: string }[]; // e.g., [{key: 'A', text: 'Option 1'}, ...]
  correctKey: string; // key of the correct option
  explanation?: string; // optional explanation shown after answer
}

const QuizQuestionSchema = new Schema<IQuizQuestion>({
  day: { type: Number, required: true, min: 1, max: 31, unique: true },
  questionId: { type: String, required: true, unique: true },
  question: { type: String, required: true },
  options: [
    {
      key: { type: String, required: true },
      text: { type: String, required: true },
    },
  ],
  correctKey: { type: String, required: true },
  explanation: { type: String },
});

export const QuizQuestion = mongoose.model<IQuizQuestion>('QuizQuestion', QuizQuestionSchema);
