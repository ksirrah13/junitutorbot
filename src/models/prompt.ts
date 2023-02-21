import mongoose from 'mongoose';

const PromptSchema = new mongoose.Schema({
    user: String,
    input: String,
    messageId: String,
    messageUrl: String,
    responses: [{type: mongoose.Types.ObjectId, ref: 'ResponseResult'}],
    answeredQuestion: Boolean,
    requestedHelp: Boolean,
    bestAnswerSelected: String,
  }, {timestamps: true});
  
export const Prompt = mongoose.model('Prompt', PromptSchema);
