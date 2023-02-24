import { SlashCommandBuilder, ChatInputCommandInteraction, CacheType } from "discord.js";
import { createQuestions } from "../utils/sat_generator";

export const satQuestionCommand = {
    data: new SlashCommandBuilder()
        .setName('sat')
        .setDescription('Requests practice SAT questions from Juni Tutor Bot')
        .addNumberOption(option =>
          option.setName('count')
            .setDescription('Number of practice questions to create')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(10)),
    execute: async (interaction: ChatInputCommandInteraction<CacheType>) => {
        if (interaction.user.id != interaction.client.user?.id) {
            try {
              await interaction.reply(`<@${interaction.user.id}> is practicing SAT questions!\n\nStart your own practice with \`/sat\``); 
              const count = interaction.options.getNumber('count') ?? 3;
              const satQuestions = await createQuestions(count);
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
