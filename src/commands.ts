import { EmbedBuilder } from '@discordjs/builders';
import { CacheType, SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { startNewPrompt } from './db';
import { requestAiResponses } from './utils/bot_utils';
import { createFields, createMoreHelpBar, trimToLength } from './utils/discord_utils';

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
              const newPromptId = await startNewPrompt({user: interaction.user.id, input: prompt});
              await requestAiResponses({prompt, thread, interaction, newPromptId, askingUserId: interaction.user.id})
              await interaction.followUp(createMoreHelpBar({promptId: newPromptId, ephemeral: true}));
            } catch (error) {
              console.error(error);
              thread.send('error processing request');
            }
          }
    }
}
