import { ActionRowBuilder } from '@discordjs/builders';
import { EmbedBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, MessageCreateOptions, InteractionReplyOptions, MessagePayload, ButtonInteraction, CacheType, TextChannel, AnyThreadChannel, ButtonComponent } from 'discord.js';
import { AnswerResult, AnswerResultChoice } from '../db';
import { Prompt } from '../models/prompt';

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
export const createFields = (text, fieldName = '\u200B') => {
  if (text.length <= MAX_FIELD_LENGTH) {
    return { name: fieldName, value: text };
  }
  const chunkedFields = chunkOnNewlines(text, MAX_FIELD_LENGTH);
  return chunkedFields.map(value => ({ name: fieldName, value }));
}

const chunkString = (str, length) => {
  return str.match(new RegExp('(.|[\r\n]){1,' + length + '}', 'g'));
}

const chunkOnNewlines = (str, length) => {
  if (!str) return;
  const newlineChunks = str.split('\n');
  // no newlines so just chunk it naively
  if (newlineChunks.length < 2) {
    return chunkString(str, length);
  }
  let currentChunkLength = 0;
  const chunkedResults: string[] = [];
  let currentChunk: string[] = [];
  newlineChunks.forEach(newChunk => {
    // need to include the potential newline characters added later
    if (currentChunkLength + newChunk.length + 2 <= length) {
      currentChunk.push(newChunk);
      currentChunkLength = currentChunkLength + newChunk.length + 2;
    } else {
      // need to start a new chunk
      const joinedChunk = currentChunk.join('\n');
      chunkedResults.push(joinedChunk);
      currentChunk = [newChunk];
      currentChunkLength = newChunk.length;
    }
  })
  if (currentChunk.length > 0) {
    const joinedChunk = currentChunk.join('\n');
    chunkedResults.push(joinedChunk);
  }
  return chunkedResults;
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
    return {content: `Help is on the way!${helpThreadUrl ? ` \n[see thread](${helpThreadUrl})` : ''}`, components: []};
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

export const requestHelpFromChannel = async (interaction: ButtonInteraction<CacheType>, promptId: string) => {
  // hardcoded request to channel with new message
  const SOS_CHANNEL_ID = process.env.TUTOR_SOS_CHANNEL_ID;
  if (!SOS_CHANNEL_ID) {
    console.log('no tutor sos channel id env var configured');
    return;
  }
  const sosChannel = await interaction.client.channels.cache.get(SOS_CHANNEL_ID);
  if (!sosChannel) {
    console.log('no tutor sos channel configured!');
    return;
  }
  const originalPrompt = await Prompt.findById(promptId).lean().exec();
  if (!originalPrompt) {
    console.log('No prompt found for prompt id', {promptId});
    return;
  }
  const { messageUrl, messageId, input: originalInput } = originalPrompt;
  const questionEmbed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setDescription(`<@${interaction.user.id}> asked a question in <#${interaction.channelId}>! 🤖💬
    [original message](${messageUrl})
    
    Thank your SOS helper by reacting with :brain: on their reply!`)
    .addFields(createFields(originalInput, 'Question'));
  const message = await (sosChannel as TextChannel).send({embeds: [questionEmbed]});
  const thread = await message.startThread({name: `${trimToLength(originalInput)}` });
  const helpRequestedEmbed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setDescription(`<@${interaction.user.id}> requested help in <#${message.channelId}>
    [see thread](${thread.url})`);
  const originalMessage = interaction.channel?.messages.cache.get(messageId ?? '');
  if (originalMessage) {
    await originalMessage.edit({embeds: [...originalMessage.embeds, helpRequestedEmbed]});
  }
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

export const createSatResponse = (interaction, selection) => {
  const actionRow = interaction.message.components[0];
  const buttons = actionRow.components as ButtonComponent[];
  const updatedButtons = buttons.map(button => {
    const [action, target] = getActionAndTargetFromId(button.customId);
    const updatedButton = new ButtonBuilder()
      .setCustomId(button.customId!)
      .setLabel(button.label!)
      .setStyle(button.style)
      .setDisabled(true);
    // always mark the correct answer green
    if (action === 'sat-correct') {
      updatedButton.setStyle(ButtonStyle.Success);
    }
    // if the incorrect answer was selected mark it red
    if (action === 'sat-incorrect' && selection === target) {
      updatedButton.setStyle(ButtonStyle.Danger);
    }
    return updatedButton;
  })
  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(updatedButtons);
  return {components: [buttonRow]};
}
