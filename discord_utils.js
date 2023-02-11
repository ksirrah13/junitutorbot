import { ActionRowBuilder } from '@discordjs/builders';
import { EmbedBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const createEmbedWrapper = (title, results, responseId) => {
  const resultsEmbed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle(title)
    .addFields(
      createFields(results),
    );
  return {embeds: [resultsEmbed, createRatingEmbed()], components: [createRatingsComponents(responseId)]};
}

export const createRatingEmbed = () => {
  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('Did this answer your question?')
    .setDescription('Rate your answers to help others find solutions!');
  return embed;
}

const MAX_FIELD_LENGTH = 1024
const createFields = text => {
  if (text.length <= MAX_FIELD_LENGTH) {
    return { name: 'Results', value: text };
  }
  // naive split which doesn't break on words or anything
  const chunkedFields = chunkString(text, MAX_FIELD_LENGTH);
  return chunkedFields.map(value => ({ name: 'Results', value }));
}

const chunkString = (str, length) => {
  return str.match(new RegExp('(.|[\r\n]){1,' + length + '}', 'g'));
}

export const createEmbedImages = (title, images) => {
  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle(title)
  images.forEach(image => embed.setImage(image));
  embed.setTimestamp();
  return embed;
}

export const createRatingsComponents = (responseId) => {
  const thumbsUp = new ButtonBuilder()
    .setStyle(ButtonStyle.Primary)
    // .setEmoji({id: '1073723550084640942'}) //thumbs up
    .setCustomId(createCustomIdForTarget('thumbs-up', responseId))
    .setLabel('Yes!') 
  const thumbsDown = new ButtonBuilder()
    .setStyle(ButtonStyle.Primary)
    // .setEmoji({name: 'thumbsdown'})  //thumbs down
    .setCustomId(createCustomIdForTarget('thumbs-down', responseId))
    .setLabel('No')
  const actionRow = new ActionRowBuilder().addComponents([thumbsUp, thumbsDown]);
  return actionRow;
}

export const createMoreHelpBar = () => {
  const bestSolution = new StringSelectMenuBuilder()
  .setCustomId('best-solution')
  .setPlaceholder('Which was the best solution?')
  .addOptions(
    {
      label: 'Wolfram',
      value: 'worlfram',
    },
    {
      label: 'OpenAI',
      value: 'openai',
    },
    {
      label: 'Anthropic',
      value: 'anthropic',
    },
  );
  const foundAnswer = new ButtonBuilder()
  .setStyle(ButtonStyle.Success)
  .setCustomId('found-answer')
  .setLabel('I found my answer!')
  const needMoreHelp = new ButtonBuilder()
    .setStyle(ButtonStyle.Danger)
    .setCustomId('more-help')
    .setLabel('I need more help!')
  const responseRow = new ActionRowBuilder().addComponents([foundAnswer, needMoreHelp]);
  const solutionRow = new ActionRowBuilder().addComponents([bestSolution]);
  return {content: "Did you find the answer you wanted?", components: [solutionRow, responseRow], ephemeral: true};
}

const DISCORD_ACTION_SEPERATOR = ':';

export const getActionAndTargetFromId = (customId) => {
  const [action, target] = customId.split(DISCORD_ACTION_SEPERATOR);
  return [action, target];
}

export const createCustomIdForTarget = (action, target) => {
  return `${action}${DISCORD_ACTION_SEPERATOR}${target}`
}
