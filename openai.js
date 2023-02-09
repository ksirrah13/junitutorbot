const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const doCompletion = async (prompt, thread) => {
  try {
    const enhancedPrompt = `Solve ${prompt} ### Answer:`;
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: enhancedPrompt,
      max_tokens: 200,
    });
    console.log('completion result', { prompt: enhancedPrompt, completion: completion.data.choices[0].text });
    const result = completion.data.choices[0].text;
    await sendResponse(result, thread);
    return result;
  } catch (error) {
    console.error(error);
  }
}

const sendResponse = async (result, thread) => {
  await thread.send(`OpenAi: ${result}`)
}

module.exports = { doCompletion }