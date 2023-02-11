import mongoose from 'mongoose';
import { ResponseResultSchema } from './response_result.js';

const PromptSchema = new mongoose.Schema({
    user: String,
    input: String,
    responses: [ResponseResultSchema],
    answeredQuestion: Boolean,
    requestedHelp: Boolean,
    bestAnswerSelected: String,
  }, {timestamps: true});
  
export const Prompt = mongoose.model('Prompt', PromptSchema);
