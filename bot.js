import { Client, GatewayIntentBits, Events } from 'discord.js';
import { doCompletion } from './openai.js';
import { doWolfram } from './wolfram.js';
import { doAnthropic } from './anthropic.js';
import { incrementRatingCount, startNewPrompt, Rating } from './data_storage.js';
import { createMoreHelpBar, createRatingsComponents, getActionAndTargetFromId } from './discord_utils.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ]
})

const BOT_TOKEN = process.env['DISCORD_BOT_SECRET'];
const BOT_MENTION_ID = process.env['BOT_MENTION_ID'];

client.on(Events.ClientReady, () => {
  console.log("I'm in");
  console.log(client.user.username);
});

client.on(Events.MessageCreate, async msg => {
  if (msg.author.id != client.user.id) {
    const inputPrompt = msg.content;
    if (!inputPrompt) {
      console.log('no prompt input');
      return;
    }
    const prompt = inputPrompt.replace(`<@${BOT_MENTION_ID}>`, '').trim();
    const thread = await msg.startThread({
      name: prompt,
      autoArchiveDuration: 60,
      reason: 'Collecting responses from AIs',
    })
    try {
      const newPromptId = await startNewPrompt({user: msg.author.id, input: prompt});
      const [aiResult, wolframResult, anthropicResult] = await Promise.allSettled([
          doCompletion(prompt, thread, newPromptId),
          doWolfram(prompt, thread, newPromptId),
          doAnthropic(prompt, thread, newPromptId)]);
      console.log('all results', { aiResult, wolframResult, anthropicResult });
      await thread.send(createMoreHelpBar());
    } catch (error) {
      console.error(error);
      thread.send('error processing request');
    }
  }
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isButton()) return;

  const [action, target] = getActionAndTargetFromId(interaction.customId);
  console.log('executing interaction', {action, target});
  switch (action) {
    case 'thumbs-up': {
      const counts = await incrementRatingCount({responseId: target, rating: Rating.Yes});
      interaction.update({components: [createRatingsComponents(target, counts)]})
      break;
    }
    case 'thumbs-down': {
      const counts = await incrementRatingCount({responseId: target, rating: Rating.No});
      interaction.update({components: [createRatingsComponents(target, counts)]})
      break;
    }
    default: {
      console.log('error finding action', action);
    }
  }

});

export const startDiscord = async () => {
  console.log('starting discord bot');
  try {
    await client.login(BOT_TOKEN)
  } catch (error) {
    console.error(error)
  }
};
