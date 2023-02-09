const { AI_PROMPT, Client, HUMAN_PROMPT } = require('@anthropic-ai/sdk');
const client = new Client(process.env.ANTHROPIC_API_KEY);

const doAnthropic = async (prompt, msg) => {
  try {
    const completion = await client
      .completeStream(
        {
          prompt: `${HUMAN_PROMPT}${prompt}${AI_PROMPT}`,
          stop_sequences: [HUMAN_PROMPT],
          max_tokens_to_sample: 200,
          model: "claude-v1",
        },
        {
          onOpen: (response) => {
            console.log("Opened stream, HTTP status code", response.status);
          },
          // onUpdate: (completion) => {
          //   console.log(completion.completion);
          // },
        }
      );
    console.log('completed sampling', completion);
    const result = completion.completion;
    await sendResponse(result, msg);
    return result;
  } catch (error) {
    console.error(error);
  }
}

const sendResponse = async (result, msg) => {
  await msg.channel.send(`Anthropic: ${result}`);
}

module.exports = { doAnthropic };