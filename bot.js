import { Client, GatewayIntentBits } from 'discord.js';
import { doCompletion } from './openai.js';
import { doWolfram } from './wolfram.js';
import { doAnthropic } from './anthropic.js';
import { recordNewResponse, startNewPrompt } from './data_storage.js';
import { createMoreHelpBar } from './discord_utils.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ]
})

const BOT_TOKEN = process.env['DISCORD_BOT_SECRET'];
const BOT_MENTION_ID = process.env['BOT_MENTION_ID'];

client.on('ready', () => {
  console.log("I'm in");
  console.log(client.user.username);
});

client.on('messageCreate', async msg => {
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
      const newPrompt = await startNewPrompt({user: msg.author.id, input: prompt});
      const [aiResult, wolframResult, anthropicResult] = await Promise.allSettled([
          doCompletion(prompt, thread, newPrompt), 
          doWolfram(prompt, thread, newPrompt), 
          doAnthropic(prompt, thread, newPrompt)]);
      console.log('all results', { aiResult, wolframResult, anthropicResult });
      await thread.send(createMoreHelpBar());
    } catch (error) {
      console.error(error);
      thread.send('error processing request');
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
