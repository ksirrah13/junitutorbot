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
    const aiResult = await doCompletion(prompt);
    const wolframResult = await doWolfram(prompt); 
    const anthropicResult = await doAnthropic(prompt);
    if (!aiResult) {
      console.log('no completion data');
      return;
    }
    console.log('all results', {aiResult, wolframResult, anthropicResult})
    await msg.channel.send(JSON.stringify({aiResult, wolframResult, anthropicResult}, null, 2));
  }
});

  

const startDiscord = () => client.login(token);

module.exports = { startDiscord };