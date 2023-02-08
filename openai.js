const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const doCompletion = async (prompt) => {
  try {
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      max_tokens: 200,
    });
    console.log('completion result', { prompt, completion: completion.data.choices[0].text });
    return completion.data.choices[0].text;
  } catch (error) {
    console.error(error);
  }
}

module.exports = { doCompletion }