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
        .addSubcommand(subcommand => 
          subcommand.setName('prompt')
            .setDescription('Requests homework help from Juni Tutor Bot using text as input')
            .addStringOption(option =>
              option.setName('prompt')
                  .setDescription('The prompt to the tutor bot')
                  .setRequired(true))
          .addStringOption(option =>
              option.setName('subject')
                  .setDescription('The subject of the prompt')
                  .addChoices(
                    {name: 'Math', value: 'math'},
                    {name: 'Spanish', value: 'spanish'})))
        .addSubcommand(subcommand => 
          subcommand.setName('image')
            .setDescription('Requests homework help from Juni Tutor Bot using an image as input')
            .addAttachmentOption(option =>
              option.setName('image')
                  .setDescription('The image to send to the tutor bot')
                  .setRequired(true))),
    execute: async (interaction: ChatInputCommandInteraction<CacheType>) => {
        if (interaction.user.id != interaction.client.user?.id) {
            const inputPrompt = interaction.options.getString('prompt');
            const imageInput = interaction.options.getAttachment('image');
            if (imageInput) {
              return await handleImageInput(imageInput, interaction)
            } else if (inputPrompt) {
              return await handleTextInput(inputPrompt, interaction);
            }
            await interaction.reply({content: 'Please provide a prompt or image to the tutor bot', ephemeral: true});
            return;
            
          }
    }
}

// export const mathOcrCommand = {
//   data: new SlashCommandBuilder()
//       .setName('tutorbot2')
//       .setDescription('Requests homework help from Juni Tutor Bot using an image as input')
//       .addSubcommand(subcommand => 
//         subcommand.setName('image')
//           .setDescription('Requests homework help from Juni Tutor Bot using an image as input')
//           .addAttachmentOption(option =>
//             option.setName('image')
//                 .setDescription('The image to send to the tutor bot')
//                 .setRequired(true))),
//   execute: async (interaction: ChatInputCommandInteraction<CacheType>) => {
//       if (interaction.user.id != interaction.client.user?.id) {
//           const image = interaction.options.getAttachment('image');
          
         
//         }
//   }
// }

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

const handleTextInput = async (inputPrompt, interaction) => {
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

const handleImageInput = async (image, interaction) => {
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
    // hacked for now to only have one data response
    const result = data?.[0]?.value;
    // const imageFieldResults = (data ?? []).map(result => ({name: result.type, value: result.value}))
    const imageFieldResults = [{name: "Result", "value": result }]
    const questionEmbed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setDescription(`<@${interaction.user.id}> uploaded an image! Here are the parsed results! 🤖💬`)
      .addFields(imageFieldResults);
  const message = await interaction.reply({embeds: [questionEmbed], fetchReply: true});
  const thread = await message.startThread({
    name: trimToLength(`Parsed from image: ${data?.[0]?.value}`),
    autoArchiveDuration: 60,
    reason: 'Collecting response from AI',
  })
  // there should only be one result for data for now (hacked in static response)
  // const annotatedPrompt = `The math problem is given in ${result.type} format. Solve the following problem. ${result.value}`;
  const newPromptId = await startNewPrompt({user: interaction.user.id, input: result, messageId: message.id, messageUrl: message.url});
  await requestAiResponses({prompt: result, thread, interaction, newPromptId, askingUserId: interaction.user.id})
  await interaction.followUp(createMoreHelpBar({promptId: newPromptId, ephemeral: true}));
  
} catch (error) {
  console.error(error);
  await interaction.reply({content: 'Error parsing image, please try a different image', ephemeral: true});

}

}
