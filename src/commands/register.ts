import { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder, ChatInputCommandInteraction, CacheType, Collection, REST, Routes } from "discord.js";
import { CONFIG } from "../config";
import { satQuestionCommand } from "./sat";
import { tutorBotCommand } from "./tutorbot";

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
    if (CONFIG.DISCORD_DEV_GUILD_ID && process.env.DEV_MODE === 'true') {
      // clean up global commands since the guild specific will be duplicates
      const globalCommands = await rest.get(Routes.applicationCommands(CONFIG.APPLICATION_ID)) as Record<string, any>[];
      for (const command of globalCommands) {
        console.log('deleting global command', { name: command.name });
        await rest.delete(`${Routes.applicationCommands(CONFIG.APPLICATION_ID)}/${command.id}`);
      }
    }
    console.log(`successfully added ${dataResult.length} slash commands${CONFIG.DISCORD_DEV_GUILD_ID ? ` to server ${DISCORD_DEV_GUILD_ID}` : ''}`)
  }
  