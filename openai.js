const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const doCompletion = async (prompt) => {
  if (!prompt) {
    console.log('no prompt data');
    return;
  }
  const cleanedPrompt = prompt.replace('<@1072617337951367188>', '').trim();
  console.log('querying for completion', { cleanedPrompt });
  const completion = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: cleanedPrompt,
    max_tokens: 200,
  });
  console.log('completion result', { cleanedPrompt, completion: completion.data.choices[0].text });
  return completion.data.choices[0].text;
}

module.exports = { doCompletion }