import mongoose from 'mongoose';
import { Prompt } from './models/prompt';
import dotenv from 'dotenv';
import { ResponseResult } from './models/response_result';
import assert from 'assert';
dotenv.config();

export const connectDb = async () => {
  try {
    console.log('connecting to db...');
    // suppress warnings
    mongoose.set('strictQuery', false);
    assert(process.env.DB_URI, 'Missing DB URI');
    await mongoose.connect(process.env.DB_URI);
    console.log('connected to db');
  } catch (e) {
    console.error('error connecting to db', e);
  }
}

export const recordNewResponse = async ({ prompt, response, source, parentPromptId }) => {
  const { _id } = await ResponseResult.create({ prompt, response, source });
  await Prompt.findByIdAndUpdate(parentPromptId, { $push: { responses:  _id }});
  return _id.toString();
}

export const startNewPrompt = async ({ user, input }) => {
  const { _id } = await Prompt.create({ user, input });
  return _id.toString();
}

export const Rating = {
  Yes: 'yes',
  No: 'no',
}

export const incrementRatingCount = async ({responseId, rating}) => {
  const ratingKey = `correctAnswer.${rating}`;
  const {correctAnswer} = await ResponseResult.findByIdAndUpdate(responseId, {$inc: {[ratingKey] : 1}}, {new: true}).lean().exec() ?? {};
  return correctAnswer;
}

export const updateSelectedAnswerSource = async ({promptId, source}) => {
  return Prompt.findByIdAndUpdate(promptId, {bestAnswerSelected: source}, {new: true}).lean().exec();
}

export const AnswerResult = {
  Answered: 'answered',
  RequestHelp: 'requestHelp'
} as const;

export type AnswerResultChoice = typeof AnswerResult[keyof typeof AnswerResult]

export const setPromptAnsweredResult = async ({promptId, answerResult}) => {
  const updateResult = answerResult === AnswerResult.Answered ? {answeredQuestion: true, requestedHelp: false} : {answeredQuestion: false, requestedHelp: true};
  return Prompt.findByIdAndUpdate(promptId, updateResult, {new: true}).lean().exec();
}
