import { CacheType, SlashCommandBuilder, ChatInputCommandInteraction, MessageCreateOptions } from 'discord.js';
import { startNewPrompt } from './db';
import { requestAiResponses } from './utils/bot_utils';
import { createMoreHelpBar, createMoreHelpBarEphemeral, trimToLength } from './utils/discord_utils';

export const tutorBotCommand = {
    data: new SlashCommandBuilder()
        .setName('tutorbot')
        .setDescription('Requests homework help from Juni Tutor Bot')
        .addStringOption(option =>
            option.setName('prompt')
                .setDescription('The prompt to the tutor bot')),
    execute: async (interaction: ChatInputCommandInteraction<CacheType>) => {
        if (interaction.user.id != interaction.client.user?.id) {
            const inputPrompt = interaction.options.getString('prompt');
            if (!inputPrompt) {
              await interaction.reply({content: 'Please provide a prompt to the tutor bot', ephemeral: true});
              return;
            }
            const prompt = inputPrompt.trim();
            const message = await interaction.reply({content: 'You asked a question!', fetchReply: true});
            const thread = await message.startThread({
              name: trimToLength(prompt),
              autoArchiveDuration: 60,
              reason: 'Collecting responses from AIs',
            })
            try {
              const newPromptId = await startNewPrompt({user: interaction.user.id, input: prompt});
              await requestAiResponses({prompt, thread, interaction, newPromptId, askingUserId: interaction.user.id})
              await thread.send(createMoreHelpBar(newPromptId));
              await interaction.followUp(createMoreHelpBarEphemeral(newPromptId));
            } catch (error) {
              console.error(error);
              thread.send('error processing request');
            }
          }
    }
}
