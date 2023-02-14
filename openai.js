import { Configuration, OpenAIApi } from "openai";
import { recordNewResponse } from "./data_storage.js";
import { createEmbedWrapper } from './discord_utils.js';



// TODO figure out why sometimes open ai refuses to answer or hangs
export const doCompletion = async (prompt, thread, parentPromptId) => {
  try {
    // how to enable this outside of the method call? process env not yet set
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    const enhancedPrompt = createPromptTemplate(prompt);
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: enhancedPrompt,
      max_tokens: 1000,
      stop: [HUMAN]
    });
    const result = completion.data.choices[0].text;
    const responseId = await recordNewResponse({ prompt: enhancedPrompt, response: result, source: 'openai', parentPromptId });
    await sendResponse(result, thread, responseId);
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

const sendResponse = async (result, thread, responseId) => {
  await thread.send(createEmbedWrapper('OpenAI', result, responseId));
}

// const createPromptTemplate = (prompt) => `Answer the following question by first describing the problem and the way it will be solved. Then use step by step examples with explanations for each step. Finally, provide the solution to the question. 

// Question: ${prompt}

// Answer:`

const HUMAN = '\n\nHuman:';
const AI = '\n\nAssistant:';

const createPromptTemplate = (prompt) => `${HUMAN}${prompt}${AI}`;
