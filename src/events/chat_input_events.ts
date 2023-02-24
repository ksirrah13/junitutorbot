import { SLASH_COMMANDS } from "../bot";

export const handleChatInputInteraction = async (interaction) => {
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
