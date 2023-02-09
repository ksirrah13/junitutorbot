const { Configuration, OpenAIApi } = require("openai");
const { createEmbedWrapper } = require('./discord_utils');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const doCompletion = async (prompt, thread) => {
  try {
    const enhancedPrompt = createPromptTemplate(prompt);
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: enhancedPrompt,
      max_tokens: 1000,
    });
    const result = completion.data.choices[0].text;
    await sendResponse(result, thread);
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

const sendResponse = async (result, thread) => {
  await thread.send({ embeds: [createEmbedWrapper('OpenAI', result)] });
}

const createPromptTemplate = (prompt) => `Answer the following question by first describing the problem and the way it will be solved. Then use step by step examples with explanations for each step. Finally, provide the solution to the question. 

Question: ${prompt}

Answer:`

module.exports = { doCompletion }