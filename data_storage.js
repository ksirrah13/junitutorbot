import mongoose from 'mongoose';
import { Prompt } from './models/prompt.js';
import dotenv from 'dotenv';
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

export const recordNewPrompt = async ({ input, prompt, responses }) => {
  await Prompt.create({ input, prompt, responses })
}