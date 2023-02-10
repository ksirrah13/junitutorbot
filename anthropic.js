import { AI_PROMPT, Client, HUMAN_PROMPT } from '@anthropic-ai/sdk';
import { createEmbedWrapper } from './discord_utils.js';


export const doAnthropic = async (prompt, thread) => {
  try {
    // how to enable this outside of the method call? process env not yet set
    const client = new Client(process.env.ANTHROPIC_API_KEY);

    const completion = await client
      .completeStream(
        {
          prompt: createPromptTemplate(prompt),
          stop_sequences: [HUMAN_PROMPT],
          max_tokens_to_sample: 1000,
          model: "claude-v1",
        },
        {
          onOpen: (response) => {
            console.log("Opened anthropic stream, HTTP status code", response.status);
          },
          // onUpdate: (completion) => {
          //   console.log(completion.completion);
          // },
        }
      );
    const result = completion.completion;
    await sendResponse(result, thread);
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

const sendResponse = async (result, thread) => {
  await thread.send(createEmbedWrapper('Anthropic', result));
}

const createPromptTemplate = (prompt) => `${HUMAN_PROMPT}Answer the following question by first describing the problem and the way it will be solved. Then use step by step examples with explanations for each step. Finally, provide the solution to the question. 

Question: ${prompt}

${AI_PROMPT}`
