import mongoose from 'mongoose';

const schema = new mongoose.Schema({
    input: String,
    prompt: String,
    responses: [{model: String, response: String}],
  });
  
export const Prompt = mongoose.model('Prompt', schema);
