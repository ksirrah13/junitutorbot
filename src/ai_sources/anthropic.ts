import { AI_PROMPT, Client, HUMAN_PROMPT } from '@anthropic-ai/sdk';
import { CONFIG } from '../config';
import { recordNewResponse } from "../db";
import { createEmbedWrapper } from '../utils/discord_utils';


export const doAnthropic = async ({prompt, thread, interaction, parentPromptId, preferredResponse}) => {
  try {
    // how to enable this outside of the method call? process env not yet set
    if (!CONFIG.ANTHROPIC_API_KEY) {
      console.log('missing key for anthropic');
      return;
    }
    const client = new Client(CONFIG.ANTHROPIC_API_KEY);

    const enhancedPrompt = createPromptTemplate(prompt);
    const completion = await client
      .completeStream(
        {
          prompt: enhancedPrompt,
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
    const responseId = await recordNewResponse({ prompt: enhancedPrompt, response: result, source: 'anthropic', parentPromptId, preferredResponse });
    await sendResponse(result, thread, responseId, preferredResponse, interaction);
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

const sendResponse = async (results, thread, responseId, preferredResponse, interaction) => {
  const embed = createEmbedWrapper({title: 'Anthropic', results, responseId, preferredResponse});
  // if we have a slash command we can send using ephemeral messages
  if (interaction && !preferredResponse) {
    interaction.followUp({...embed, ephemeral: true});
    return;
  }
  await thread.send(createEmbedWrapper({title: 'Anthropic', results, responseId, preferredResponse}));
}

// const createPromptTemplate = (prompt) => `${HUMAN_PROMPT}Answer the following question by first describing the problem and the way it will be solved. Then use step by step examples with explanations for each step. Finally, provide the solution to the question. 

// Question: ${prompt}

// ${AI_PROMPT}`

const createPromptTemplate = (prompt) => `${HUMAN_PROMPT}${prompt}${AI_PROMPT}`;
 