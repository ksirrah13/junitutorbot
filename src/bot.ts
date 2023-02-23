import { Client, GatewayIntentBits, Events, Collection, SlashCommandBuilder, CacheType, REST, Routes, ChatInputCommandInteraction, ThreadChannel, TextChannel } from 'discord.js';
import { incrementRatingCount, Rating, updateSelectedAnswerSource, setPromptAnsweredResult, AnswerResult } from './db';
import { createHelpRequestedResponse, createMoreHelpBar, createRatingsComponents, createSatResponse, getActionAndTargetFromId, requestHelpFromChannel } from './utils/discord_utils';
import { mathOcrCommand, satQuestionCommand, tutorBotCommand } from './commands';
import { EmbedBuilder } from '@discordjs/builders';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
  ]
})

const BOT_TOKEN = process.env['DISCORD_BOT_SECRET'];
const BOT_MENTION_ID = process.env['BOT_MENTION_ID'];
const APPLICATION_ID = process.env['DISCORD_APPLICATION_ID'];
const DISCORD_DEV_GUILD_ID = process.env['DISCORD_DEV_GUILD_ID'];

// Register slash commands
export const SLASH_COMMANDS = new Collection<string, { data: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>, execute: (i: ChatInputCommandInteraction<CacheType>) => void }>();
SLASH_COMMANDS.set(tutorBotCommand.data.name, tutorBotCommand);
SLASH_COMMANDS.set(mathOcrCommand.data.name, mathOcrCommand);
SLASH_COMMANDS.set(satQuestionCommand.data.name, satQuestionCommand);

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
      msg.reply({ content: 'Hi! Want to talk to me? Use my fancy new slash command /tutorbot' })
      return;
    }
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu() && !interaction.isChatInputCommand()) return;

  if (interaction.isChatInputCommand()) {
    const commandToExecute = SLASH_COMMANDS.get(interaction.commandName)
    if (!commandToExecute) {
      console.log('no matching command', { name: interaction.commandName });
      return;
    }

    try {
      await commandToExecute.execute(interaction);
    } catch (error) {
      console.log('error executing slash command', { command: interaction.commandName, error })
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
    return;
  }


  const [action, target] = getActionAndTargetFromId(interaction.customId);
  console.log('executing interaction', { action, target });

  if (interaction.isButton()) {
    switch (action) {
      case 'thumbs-up': {
        const counts = await incrementRatingCount({ responseId: target, rating: Rating.Yes });
        interaction.update({ components: [createRatingsComponents(target, counts)] })
        break;
      }
      case 'thumbs-down': {
        const counts = await incrementRatingCount({ responseId: target, rating: Rating.No });
        interaction.update({ components: [createRatingsComponents(target, counts)] })
        break;
      }
      case 'answered': {
        await setPromptAnsweredResult({ promptId: target, answerResult: AnswerResult.Answered });
        interaction.update(createMoreHelpBar({ promptId: target, answerResult: AnswerResult.Answered }))
        break;
      }
      case 'request-help': {
        await setPromptAnsweredResult({ promptId: target, answerResult: AnswerResult.RequestHelp });
        const helpThread = await requestHelpFromChannel(interaction, target);
        interaction.update(createHelpRequestedResponse({ helpThreadUrl: helpThread?.url }));
        break;
      }
      case 'sat-correct':
      case 'sat-incorrect': {
        interaction.update(createSatResponse(interaction, target));
        break;
      }
      default: {
        console.log('error finding action', action);
      }
    }

  }

  if (interaction.isStringSelectMenu()) {
    switch (action) {
      case 'selected-best': {
        await updateSelectedAnswerSource({ promptId: target, source: interaction.values[0] });
        interaction.reply({ content: `Selected solution: ${interaction.values[0]}`, ephemeral: true });
        break;
      }
      default: {
        console.log('error finding action', action);
      }
    }

  }
});

client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (reaction.emoji.name !== '🧠') return;
  if (!reaction.message.channel.isThread()) return; // only dealing with thread reactions

  const starterMessage = await (reaction.message.channel as ThreadChannel).fetchStarterMessage();
  const starterMessageDescription = starterMessage?.embeds[0]?.data.description ?? '';
  const extractUser = new RegExp('<@(\\d*)> asked a question');
  const starterUser = extractUser.exec(starterMessageDescription)?.[1]; // parse from message
  if (!starterUser) return; // can't determine who should be allowed so don't do anything

  if (starterUser !== user.id) {
    // this will fail if the user message or reaction is from an admin
    try {
      await reaction.remove();
    } catch (error) {
      console.log('failed to remove reaction from admin user', { author: reaction.message.author?.username, user: user.username })
    }
    return;
  }
  // extract our original message and edit to add a notice of new answer
  const extractOriginalMessage = new RegExp('https:\/\/discord\.com\/channels\/(\\d*)\/(\\d*)\/(\\d*)');
  // const extractOriginalMessage = new RegExp('\[original message\]\((.*)\)');
  const originalMessageData = extractOriginalMessage.exec(starterMessageDescription);
  const originalChannel: TextChannel = client.channels.cache.get(originalMessageData?.[2] ?? '') as TextChannel;
  const originalMessage = await originalChannel.messages.fetch(originalMessageData?.[3] ?? '');
  if (originalMessage) {
    // post update to original message
    const newAnswer = new EmbedBuilder()
      .setColor(0x00FF00)
      .setDescription(`<@${reaction.message.author?.id}> answered in <#${starterMessage?.channelId}>
    [see their answer](${reaction.message.url})`);
    await originalMessage.edit({embeds: [originalMessage.embeds[0]!, newAnswer ]})
  }
  // add embed to original sos message
  const pointsAwardedEmbed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setDescription(`Awarding points to <@${reaction.message.author?.id}>! Thanks for the help!`);
  await starterMessage?.edit({embeds: [...starterMessage.embeds, pointsAwardedEmbed]});
})

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
  const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

  const commandsToAdd = SLASH_COMMANDS.map(({ data }) => data.toJSON());
  const dataResult: any = DISCORD_DEV_GUILD_ID // only target a specific server
    ? await rest.put(Routes.applicationGuildCommands(APPLICATION_ID, DISCORD_DEV_GUILD_ID), { body: commandsToAdd })
    : await rest.put(Routes.applicationCommands(APPLICATION_ID), { body: commandsToAdd });
  if (DISCORD_DEV_GUILD_ID && process.env.DEV_MODE === 'true') {
    // clean up global commands since the guild specific will be duplicates
    const globalCommands = await rest.get(Routes.applicationCommands(APPLICATION_ID)) as Record<string, any>[];
    for (const command of globalCommands) {
      console.log('deleting global command', { name: command.name });
      await rest.delete(`${Routes.applicationCommands(APPLICATION_ID)}/${command.id}`);
    }
  }
  console.log(`successfully added ${dataResult.length} slash commands${DISCORD_DEV_GUILD_ID ? ` to server ${DISCORD_DEV_GUILD_ID}` : ''}`)
}
