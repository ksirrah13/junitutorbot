import { ActionRowBuilder } from '@discordjs/builders';
import { EmbedBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, MessageCreateOptions, InteractionReplyOptions, MessagePayload, ButtonInteraction, CacheType, TextChannel, AnyThreadChannel } from 'discord.js';
import { AnswerResult, AnswerResultChoice } from '../db';

export const createEmbedWrapper = ({title, results, responseId, preferredResponse}) => {
  const color = preferredResponse ? 0x0099FF : 0xFF6600;
  const maskedTitle = preferredResponse ? 'Response' : title;
  const resultsEmbed = new EmbedBuilder()
    .setColor(color)
    .setTitle(maskedTitle)
    .addFields(
      createFields(results),
    );
  return preferredResponse 
    ? {embeds: [resultsEmbed], components: [createRatingsComponents(responseId)]} 
    : {embeds: [resultsEmbed]};
}

export const createRatingEmbed = () => {
  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('Did this answer your question?')
    .setDescription('Rate your answers to help others find solutions!');
  return embed;
}

const MAX_FIELD_LENGTH = 1024
export const createFields = text => {
  if (text.length <= MAX_FIELD_LENGTH) {
    return { name: '\u200B', value: text };
  }
  // naive split which doesn't break on words or anything
  const chunkedFields = chunkString(text, MAX_FIELD_LENGTH);
  return chunkedFields.map(value => ({ name: '\u200B', value }));
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

export const createRatingsComponents = (responseId: String, voteCounts?: {yes?: number, no?: number}) => {
  const thumbsUp = new ButtonBuilder()
    .setStyle(ButtonStyle.Primary)
    .setEmoji('👍') //thumbs up
    .setCustomId(createCustomIdForTarget('thumbs-up', responseId))
    .setLabel(` ${voteCounts?.yes ?? 0}`) 
  const thumbsDown = new ButtonBuilder()
    .setStyle(ButtonStyle.Primary)
    .setEmoji('👎')  //thumbs down
    .setCustomId(createCustomIdForTarget('thumbs-down', responseId))
    .setLabel(` ${voteCounts?.no ?? 0}`)
  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents([thumbsUp, thumbsDown]);
  return actionRow;
}

type CreateHelperOverloads = {
  (inputs: {promptId: string, answerResult?: AnswerResultChoice, ephemeral: true}): InteractionReplyOptions;
  (inputs: {promptId: string, answerResult?: AnswerResultChoice, ephemeral?: boolean}): MessageCreateOptions
}

export const createHelpRequestedResponse = (
  {helpThreadUrl}: 
  {helpThreadUrl?: string}): MessageCreateOptions => {
    return {content: `Help is on the way!${helpThreadUrl ? ` [view thread >>](${helpThreadUrl})` : ''}`, components: []};
}

export const createMoreHelpBar: CreateHelperOverloads = (
  {promptId, answerResult, ephemeral}: 
  {promptId: string, answerResult?:AnswerResultChoice, ephemeral?:boolean}) => {
  const foundAnswer = new ButtonBuilder()
    .setStyle(ButtonStyle.Success)
    .setCustomId(createCustomIdForTarget('answered', promptId))
    .setLabel('Yes!')
    .setDisabled(answerResult === AnswerResult.Answered);
  const needMoreHelp = new ButtonBuilder()
    .setStyle(ButtonStyle.Primary)
    .setCustomId(createCustomIdForTarget('request-help', promptId))
    .setLabel('I need more help')
    .setDisabled(answerResult === AnswerResult.RequestHelp);
  const responseRow = new ActionRowBuilder<ButtonBuilder>().addComponents([foundAnswer, needMoreHelp]);
  return answerResult === AnswerResult.Answered
    ? {content: "Thanks for the feedback!", components: [responseRow], ...(ephemeral && {ephemeral: true})}
    : answerResult === AnswerResult.RequestHelp
    ? {content: "Help is on the way!", components: [], ...(ephemeral && {ephemeral: true})}
    : {content: "Was I helpful?", components: [responseRow], ...(ephemeral && {ephemeral: true})};
}

export const requestHelpFromChannel = async (interaction: ButtonInteraction<CacheType>) => {
  // hardcoded request to channel with new message
  const SOS_CHANNEL_ID = '1076296552840183880';
  const sosChannel = await interaction.client.channels.cache.get(SOS_CHANNEL_ID);
  if (!sosChannel) {
    console.log('no tutor sos channel configured!');
    return;
  }
  const message = await (sosChannel as TextChannel).send({content: `Hello from another channel! [go back <<](${interaction.message.url})`});
  const thread = await message.startThread({name: 'Tutor help please' });
  return thread;
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
