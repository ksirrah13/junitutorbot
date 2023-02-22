import { EmbedBuilder } from '@discordjs/builders';
import { CacheType, SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { startNewPrompt } from './db';
import { requestAiResponses } from './utils/bot_utils';
import { createFields, createMoreHelpBar, trimToLength } from './utils/discord_utils';
import { getMathOcrResults } from './utils/math_ocr';
import { createQuestions } from './utils/sat_generator';

export const tutorBotCommand = {
    data: new SlashCommandBuilder()
        .setName('tutorbot')
        .setDescription('Requests homework help from Juni Tutor Bot')
        .addStringOption(option =>
            option.setName('prompt')
                .setDescription('The prompt to the tutor bot')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('subject')
                .setDescription('The subject of the prompt')
                .addChoices(
                  {name: 'Math', value: 'math'},
                  {name: 'Spanish', value: 'spanish'})),
    execute: async (interaction: ChatInputCommandInteraction<CacheType>) => {
        if (interaction.user.id != interaction.client.user?.id) {
            const inputPrompt = interaction.options.getString('prompt');
            if (!inputPrompt) {
              await interaction.reply({content: 'Please provide a prompt to the tutor bot', ephemeral: true});
              return;
            }
            const prompt = inputPrompt.trim();
            const questionEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setDescription(`<@${interaction.user.id}> asked a question! 🤖💬`)
                .addFields(createFields(inputPrompt));
            const message = await interaction.reply({embeds: [questionEmbed], fetchReply: true});
            const thread = await message.startThread({
              name: trimToLength(prompt),
              autoArchiveDuration: 60,
              reason: 'Collecting response from AI',
            })
            try {
              const newPromptId = await startNewPrompt({user: interaction.user.id, input: prompt, messageId: message.id, messageUrl: message.url});
              await requestAiResponses({prompt, thread, interaction, newPromptId, askingUserId: interaction.user.id})
              await interaction.followUp(createMoreHelpBar({promptId: newPromptId, ephemeral: true}));
            } catch (error) {
              console.error(error);
              thread.send('error processing request');
            }
          }
    }
}

export const mathOcrCommand = {
  data: new SlashCommandBuilder()
      .setName('tutorbotimage')
      .setDescription('Requests homework help from Juni Tutor Bot using an image as input')
      .addAttachmentOption(option =>
          option.setName('image')
              .setDescription('The image to send to the tutor bot')
              .setRequired(true)),
  execute: async (interaction: ChatInputCommandInteraction<CacheType>) => {
      if (interaction.user.id != interaction.client.user?.id) {
          const image = interaction.options.getAttachment('image');
          if (!image) {
            await interaction.reply({content: 'Please provide an image to the tutor bot', ephemeral: true});
            return;
          }
          // match my specific file name
          const {name} = image;
          if (!name) {
            console.log('no name for image attachment!');
            return;
          }
          try {
            const ocrResult = await getMathOcrResults(name);
            if (!ocrResult) {
              await interaction.reply({content: 'Error parsing image, please try a different image', ephemeral: true});
              return;
            }
            const { data } : {data: Record<string, any>[]} = ocrResult;
            const imageFieldResults = (data ?? []).map(result => ({name: result.type, value: result.value}))
            const questionEmbed = new EmbedBuilder()
              .setColor(0x00FF00)
              .setDescription(`<@${interaction.user.id}> uploaded an image! Here are the parsed results! 🤖💬`)
              .addFields(imageFieldResults);
          const message = await interaction.reply({embeds: [questionEmbed], fetchReply: true});
          const thread = await message.startThread({
            name: trimToLength('processing image results'),
            autoArchiveDuration: 60,
            reason: 'Collecting response from AI',
          })
          for (const result of data) {
            const annotatedPrompt = `The math problem is given in ${result.type} format. Solve the following problem. ${result.value}`;
            console.log({annotatedPrompt});
            const newPromptId = await startNewPrompt({user: interaction.user.id, input: annotatedPrompt, messageId: message.id, messageUrl: message.url});
            await requestAiResponses({prompt: annotatedPrompt, thread, interaction, newPromptId, askingUserId: interaction.user.id})
            await interaction.followUp(createMoreHelpBar({promptId: newPromptId, ephemeral: true}));
          }
        } catch (error) {
          console.error(error);
          await interaction.reply({content: 'Error parsing image, please try a different image', ephemeral: true});
       
        }
         
        }
  }
}

export const satQuestionCommand = {
  data: new SlashCommandBuilder()
      .setName('sat')
      .setDescription('Requests practice SAT questions from tutor bot'),
  execute: async (interaction: ChatInputCommandInteraction<CacheType>) => {
      if (interaction.user.id != interaction.client.user?.id) {
          try {
            await interaction.deferReply({ephemeral: true});
            const satQuestions = await createQuestions(3);
            if (!satQuestions) {
              await interaction.reply({content: 'Error generating practice questions', ephemeral: true});
              return;
            }
            satQuestions.forEach(question => interaction.followUp(question));
        } catch (error) {
          console.error(error);
          await interaction.reply({content: 'Error generating questions', ephemeral: true});
       
        }
         
      }
  }
}

