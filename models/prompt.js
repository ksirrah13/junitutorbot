const schema = new Schema({
    input: String,
    prompt: String,
    responses: [{model: String, response: String}],
  });
  
const Prompt = mongoose.model('Prompt', schema);

module.exports = { Prompt };
