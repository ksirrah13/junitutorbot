import { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder, ChatInputCommandInteraction, CacheType, Collection, REST, Routes } from "discord.js";
import { CONFIG } from "../config";
import { tutorBotCommand, satQuestionCommand } from ".";

// Register slash commands
const SLASH_COMMANDS = new Collection<string, { data: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> | SlashCommandSubcommandsOnlyBuilder, execute: (i: ChatInputCommandInteraction<CacheType>) => void }>();
SLASH_COMMANDS.set(tutorBotCommand.data.name, tutorBotCommand);
// SLASH_COMMANDS.set(mathOcrCommand.data.name, mathOcrCommand);
SLASH_COMMANDS.set(satQuestionCommand.data.name, satQuestionCommand);

export const registerSlashCommands = async () => {
    if (!CONFIG.BOT_TOKEN || !CONFIG.APPLICATION_ID) {
      console.log('missing bot token or application id to register commands!');
      return;
    }
    const rest = new REST({ version: '10' }).setToken(CONFIG.BOT_TOKEN);
  
    const commandsToAdd = SLASH_COMMANDS.map(({ data }) => data.toJSON());
    const dataResult: any = CONFIG.DISCORD_DEV_GUILD_ID // only target a specific server
      ? await rest.put(Routes.applicationGuildCommands(CONFIG.APPLICATION_ID, CONFIG.DISCORD_DEV_GUILD_ID), { body: commandsToAdd })
      : await rest.put(Routes.applicationCommands(CONFIG.APPLICATION_ID), { body: commandsToAdd });
    if (CONFIG.DISCORD_DEV_GUILD_ID && CONFIG.DEV_MODE === 'true') {
      // clean up global commands since the guild specific will be duplicates
      const globalCommands = await rest.get(Routes.applicationCommands(CONFIG.APPLICATION_ID)) as Record<string, any>[];
      for (const command of globalCommands) {
        console.log('deleting global command', { name: command.name });
        await rest.delete(`${Routes.applicationCommands(CONFIG.APPLICATION_ID)}/${command.id}`);
      }
    }
    console.log(`successfully added ${dataResult.length} slash commands${CONFIG.DISCORD_DEV_GUILD_ID ? ` to server ${CONFIG.DISCORD_DEV_GUILD_ID}` : ''}`)
  }


  export const handleSlashCommand = async (interaction) => {
    const commandToExecute = SLASH_COMMANDS.get(interaction.commandName)
    if (!commandToExecute) {
      console.log('no matching command', { name: interaction.commandName });
      return;
    }

    try {
      await commandToExecute.execute(interaction);
    } catch (error) {
      console.log('error executing slash command', { command: interaction.commandName, error })
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
    return;
}
