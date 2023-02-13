import { ActionRowBuilder } from '@discordjs/builders';
import { EmbedBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { AnswerResult } from './data_storage.js';

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

export const createRatingsComponents = (responseId, voteCounts) => {
  const thumbsUp = new ButtonBuilder()
    .setStyle(ButtonStyle.Primary)
    // .setEmoji({id: '1073723550084640942'}) //thumbs up
    .setCustomId(createCustomIdForTarget('thumbs-up', responseId))
    .setLabel(`Yes! (${voteCounts?.yes ?? 0})`) 
  const thumbsDown = new ButtonBuilder()
    .setStyle(ButtonStyle.Primary)
    // .setEmoji({name: 'thumbsdown'})  //thumbs down
    .setCustomId(createCustomIdForTarget('thumbs-down', responseId))
    .setLabel(`No (${voteCounts?.no ?? 0})`)
  const actionRow = new ActionRowBuilder().addComponents([thumbsUp, thumbsDown]);
  return actionRow;
}

export const createMoreHelpBar = (promptId, answerResult) => {
  const bestSolution = new StringSelectMenuBuilder()
  .setCustomId(createCustomIdForTarget('selected-best', promptId))
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
  .setCustomId(createCustomIdForTarget('answered', promptId))
  .setLabel(`${answerResult === AnswerResult.Answered ? '** ' : ''}I found my answer!`)
  const needMoreHelp = new ButtonBuilder()
    .setStyle(ButtonStyle.Danger)
    .setCustomId(createCustomIdForTarget('request-help', promptId))
    .setLabel(`${answerResult === AnswerResult.RequestHelp ? '** ' : ''}I need more help!`)
  const responseRow = new ActionRowBuilder().addComponents([foundAnswer, needMoreHelp]);
  const solutionRow = new ActionRowBuilder().addComponents([bestSolution]);
  return {content: answerResult ? "Thanks for the feedback!" : "Did you find the answer you wanted?", components: [solutionRow, responseRow], ephemeral: true};
}

const DISCORD_ACTION_SEPERATOR = ':';

export const getActionAndTargetFromId = (customId) => {
  const [action, target] = customId.split(DISCORD_ACTION_SEPERATOR);
  return [action, target];
}

export const createCustomIdForTarget = (action, target) => {
  return `${action}${DISCORD_ACTION_SEPERATOR}${target}`
}

export const trimToLength = (input, maxLength = 100) => {
  if (input.length < maxLength) {
    return input;
  }
  return `${input.substring(0, maxLength - 3)}...`
}
