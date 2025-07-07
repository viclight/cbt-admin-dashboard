import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion extends Document {
  subject: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  difficulty: string;
  className?: string;
  published: boolean;
  // ...other fields as needed
}

const QuestionSchema: Schema = new Schema({
  subject: { type: String, required: true },
  questionText: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswer: { type: String, required: true },
  difficulty: { type: String, default: 'medium' },
  className: { type: String },
  published: { type: Boolean, default: false },
  // ...other fields as needed
});

export default (mongoose.models.Question as mongoose.Model<IQuestion>) || mongoose.model<IQuestion>('Question', QuestionSchema);
