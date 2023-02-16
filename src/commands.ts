import { CacheType, SlashCommandBuilder, Interaction, ChatInputCommandInteraction } from 'discord.js';

export const tutorBotCommand = {
    data: new SlashCommandBuilder()
        .setName('tutorbot')
        .setDescription('Requests homework help from Juni Tutor Bot'),
    execute: async (interaction: ChatInputCommandInteraction<CacheType>) => {
        await interaction.reply('Something fun is coming!');
    }
}
