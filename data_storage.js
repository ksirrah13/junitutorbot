const mongoose = require('mongoose');
const { Prompt } = require('./models/prompt');
require('dotenv').config();

const connectDb = async () => {
    try {
        console.log('connecting to db...');
        await mongoose.connect(process.env.DB_URI);
    } catch (e) {
        console.error('error connecting to db', e);
    }
}

const recordNewPrompt = async ({input, prompt, responses}) => {
    await Prompt.create({input, prompt, responses })
}

module.exports = { connectDb, recordNewPrompt };
