import { Client, GatewayIntentBits, Events, Collection, SlashCommandBuilder, CacheType, REST, Routes, ChatInputCommandInteraction } from 'discord.js';
import { incrementRatingCount, Rating, updateSelectedAnswerSource, setPromptAnsweredResult, AnswerResult } from './db';
import { createHelpRequestedResponse, createMoreHelpBar, createRatingsComponents, getActionAndTargetFromId, requestHelpFromChannel } from './utils/discord_utils';
import { mathOcrCommand, tutorBotCommand } from './commands';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ]
})

const BOT_TOKEN = process.env['DISCORD_BOT_SECRET'];
const BOT_MENTION_ID = process.env['BOT_MENTION_ID'];
const APPLICATION_ID = process.env['DISCORD_APPLICATION_ID'];
const DISCORD_DEV_GUILD_ID = process.env['DISCORD_DEV_GUILD_ID'];

// Register slash commands
export const SLASH_COMMANDS = new Collection<string, {data: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>, execute: (i: ChatInputCommandInteraction<CacheType>) => void}>();
SLASH_COMMANDS.set(tutorBotCommand.data.name, tutorBotCommand);
SLASH_COMMANDS.set(mathOcrCommand.data.name, mathOcrCommand);

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
    if (inputPrompt.includes(`<@${BOT_MENTION_ID}>`)) {
      msg.reply({content: 'Hi! Want to talk to me? Use my fancy new slash command /tutorbot'})
      return;
    }
  }
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isButton() && !interaction.isStringSelectMenu() && !interaction.isChatInputCommand()) return;
  
  if (interaction.isChatInputCommand()) {
    const commandToExecute = SLASH_COMMANDS.get(interaction.commandName)
    if (!commandToExecute) {
      console.log('no matching command', {name: interaction.commandName});
      return;
    }

    try {
      await commandToExecute.execute(interaction);
    } catch (error) {
      console.log('error executing slash command', {command: interaction.commandName, error})
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
    return;
  }


  const [action, target] = getActionAndTargetFromId(interaction.customId);
  console.log('executing interaction', {action, target});

  if (interaction.isButton()) {
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
      case 'answered':  {
        await setPromptAnsweredResult({promptId: target, answerResult: AnswerResult.Answered});
        interaction.update(createMoreHelpBar({promptId: target, answerResult: AnswerResult.Answered}))
        break;
      }
      case 'request-help':  {
        await setPromptAnsweredResult({promptId: target, answerResult: AnswerResult.RequestHelp});
        const helpThread = await requestHelpFromChannel(interaction, target);
        interaction.update(createHelpRequestedResponse({helpThreadUrl: helpThread?.url}));
        break;
      }
      default: {
        console.log('error finding action', action);
      }
    }

  }

  if (interaction.isStringSelectMenu()) {
    switch (action) {
      case 'selected-best':  {
        await updateSelectedAnswerSource({promptId: target, source: interaction.values[0]});
        interaction.reply({content: `Selected solution: ${interaction.values[0]}`, ephemeral: true});
        break;
      }
      default: {
        console.log('error finding action', action);
      }
    }

  }
});

client.on(Events.Error, (error) => {
  console.error(error);
})

export const startDiscord = async () => {
  if (!BOT_TOKEN) {
    console.log('missing bot token!');
    return;
  }

  console.log('starting discord bot');
  try {
    await client.login(BOT_TOKEN)
  } catch (error) {
    console.error(error)
  }
  console.log('registering slash commands');
  try {
    await registerSlashCommands();
  } catch (error) {
    console.error(error)
  }
};

const registerSlashCommands = async () => {
  if (!BOT_TOKEN || !APPLICATION_ID) {
    console.log('missing bot token or application id to register commands!');
    return;
  }
  const rest = new REST({version: '10'}).setToken(BOT_TOKEN);

  const commandsToAdd = SLASH_COMMANDS.map(({data}) => data.toJSON());
  const dataResult: any = DISCORD_DEV_GUILD_ID // only target a specific server
    ? await rest.put(Routes.applicationGuildCommands(APPLICATION_ID, DISCORD_DEV_GUILD_ID), {body: commandsToAdd})
    : await rest.put(Routes.applicationCommands(APPLICATION_ID), {body: commandsToAdd});
  console.log(`successfully added ${dataResult.length} slash commands${DISCORD_DEV_GUILD_ID ? `to server ${DISCORD_DEV_GUILD_ID}` : ''}`)
}
