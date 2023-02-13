import mongoose from 'mongoose';
import { Prompt } from './models/prompt.js';
import dotenv from 'dotenv';
import { ResponseResult } from './models/response_result.js';
dotenv.config();

export const connectDb = async () => {
  try {
    console.log('connecting to db...');
    // suppress warnings
    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.DB_URI);
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
  const { _id } = await Prompt.create({ user, input })
  return _id;
}
