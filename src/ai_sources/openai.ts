import { Configuration, OpenAIApi } from "openai";
import { recordNewResponse } from "../db";
import { createEmbedWrapper } from '../utils/discord_utils';



// TODO figure out why sometimes open ai refuses to answer or hangs
export const doCompletion = async ({prompt, thread, parentPromptId, preferredResponse}) => {
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
    const result = completion.data?.choices?.[0]?.text;
    const responseId = await recordNewResponse({ prompt: enhancedPrompt, response: result, source: 'openai', parentPromptId, preferredResponse });
    await sendResponse(result, thread, responseId, preferredResponse);
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

const sendResponse = async (results, thread, responseId, preferredResponse) => {
  await thread.send(createEmbedWrapper({title: 'OpenAI', results, responseId, preferredResponse}));
}

// const createPromptTemplate = (prompt) => `Answer the following question by first describing the problem and the way it will be solved. Then use step by step examples with explanations for each step. Finally, provide the solution to the question. 

// Question: ${prompt}

// Answer:`

const HUMAN = '\n\nHuman:';
const AI = '\n\nAssistant:';

const createPromptTemplate = (prompt) => `${HUMAN}${prompt}${AI}`;
