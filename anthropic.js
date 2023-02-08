const { AI_PROMPT, Client, HUMAN_PROMPT } = require('@anthropic-ai/sdk');
const client = new Client(process.env.ANTHROPIC_API_KEY);

const doAnthropic = async () => {
  client
    .completeStream(
      {
        prompt: `${HUMAN_PROMPT} How many toes do dogs have?${AI_PROMPT}`,
        stop_sequences: [HUMAN_PROMPT],
        max_tokens_to_sample: 200,
        model: "claude-v1",
      },
      {
        onOpen: (response) => {
          console.log("Opened stream, HTTP status code", response.status);
        },
        onUpdate: (completion) => {
          console.log(completion.completion);
        },
      }
    )
    .then((completion) => {
      console.log("Finished sampling:\n", completion.completion);
    })
    .catch((error) => {
      console.error(error);
    });
}

module.exports = { doAnthropic };