const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const doCompletion = async (prompt, msg) => {
  try {
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      max_tokens: 200,
    });
    console.log('completion result', { prompt, completion: completion.data.choices[0].text });
    const result = completion.data.choices[0].text;
    await sendResponse(result, msg);
    return result;
  } catch (error) {
    console.error(error);
  }
}

const sendResponse = async (result, msg) => {
  await msg.channel.send(`OpenAi: ${result}`)
}

module.exports = { doCompletion }