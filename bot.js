import { Client, GatewayIntentBits } from 'discord.js';
import { doCompletion } from './openai';
import { doWolfram } from './wolfram';
import { doAnthropic } from './anthropic';
import { recordNewPrompt } from './data_storage';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ]
})

const token = process.env['DISCORD_BOT_SECRET']

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
    const prompt = inputPrompt.replace('<@1072617337951367188>', '').trim();
    const thread = await msg.startThread({
      name: prompt,
      autoArchiveDuration: 60,
      reason: 'Collecting responses from AIs',
    })
    try {

      const [aiResult, wolframResult, anthropicResult] = await Promise.allSettled([doCompletion(prompt, thread), doWolfram(prompt, thread), doAnthropic(prompt, thread)]);
      console.log('all results', { aiResult, wolframResult, anthropicResult });
      await recordNewPrompt({ input: prompt, prompt, responses: [{ model: 'anthropic', response: anthropicResult.value }, { model: 'openai', response: aiResult.value }, { model: 'wolfram', response: wolframResult.value }] });
    } catch (error) {
      console.error(error);
      thread.send('error processing request');
    }
  }
});

export const startDiscord = async () => { 
  console.log('starting discord bot'); 
  try { 
    await client.login(token) 
  } catch (error) { 
    console.error(error) 
  } };
