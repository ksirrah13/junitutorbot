import mongoose from 'mongoose';

export const ResponseResultSchema = new mongoose.Schema({
    prompt: String,
    response: String,
    source: String,
    correctAnswer: {yes: Number, no: Number},
  }, {timestamps: true});
  
export const ResponseResult = mongoose.model('ResponseResult', ResponseResultSchema);
