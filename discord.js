const { Client, GatewayIntentBits } = require('discord.js');
const { doCompletion } = require('./openai');
const { doWolfram } = require('./wolfram');
const { doAnthropic } = require('./anthropic');

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
    try {
    const [aiResult, wolframResult, anthropicResult]  = await Promise.all([doCompletion(prompt, msg), doWolfram(prompt, msg), doAnthropic(prompt, msg)]);
    console.log('all results', {aiResult, wolframResult, anthropicResult})
    } catch (error) {
      console.error(error);
      msg.channel.send('error processing request');
    }
  }
});

  

const startDiscord = () => client.login(token);

module.exports = { startDiscord };