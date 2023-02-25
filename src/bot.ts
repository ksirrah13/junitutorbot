import { Client, GatewayIntentBits, Events } from 'discord.js';
import { handleSlashCommand, registerSlashCommands } from './commands/register';
import { CONFIG } from './config';
import { handleButtonInteraction, handleReactionEvents, handleStringSelectInteractions } from './events';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
  ]
})

client.on(Events.ClientReady, () => {
  console.log("I'm in");
  console.log(client.user?.username);
});

client.on(Events.MessageCreate, async msg => {
  if (msg.author.id != client.user?.id) {
    const inputPrompt = msg.content;
    if (!inputPrompt) {
      return;
    }
    if (inputPrompt.includes(`<@${CONFIG.BOT_MENTION_ID}>`)) {
      msg.reply({ content: 'Hi! Want to talk to me? Use my fancy new slash command /tutorbot' })
      return;
    }
  }
});

client.on(Events.InteractionCreate, async interaction => {

  if (interaction.isChatInputCommand()) {
    await handleSlashCommand(interaction);
  }

  if (interaction.isButton()) {
    await handleButtonInteraction(interaction);
  }

  if (interaction.isStringSelectMenu()) {
    await handleStringSelectInteractions(interaction);
  }
});

client.on(Events.MessageReactionAdd, async (reaction, user) => {
  await handleReactionEvents(reaction, user);
})

client.on(Events.Error, (error) => {
  console.error(error);
})

export const startDiscord = async () => {
  if (!CONFIG.BOT_TOKEN) {
    console.log('missing bot token!');
    return;
  }

  console.log('starting discord bot');
  try {
    await client.login(CONFIG.BOT_TOKEN)
  } catch (error) {
    console.error(error);
    return;
  }
  console.log('registering slash commands');
  try {
    await registerSlashCommands();
  } catch (error) {
    console.error(error)
  }
};
