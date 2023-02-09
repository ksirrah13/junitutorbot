const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    input: String,
    prompt: String,
    responses: [{model: String, response: String}],
  });
  
const Prompt = mongoose.model('Prompt', schema);

module.exports = { Prompt };
