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
    const prompt = msg.content;
    if (!prompt) {
      console.log('no prompt input');
      return;
    }
    const completion = await doCompletion(prompt);
    if (!completion) {
      console.log('no completion data');
      return;
    }
    await doWolfram();
    await doAnthropic();
    await msg.channel.send(completion);
  }
});

const startDiscord = () => client.login(token);

module.exports = { startDiscord };