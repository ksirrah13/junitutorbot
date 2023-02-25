import { updateSelectedAnswerSource } from "../db";
import { getActionAndTargetFromId } from "../utils/discord_utils";

export const handleStringSelectInteractions = async (interaction) => {
    const [action, target] = getActionAndTargetFromId(interaction.customId);
    console.log('executing select interaction', { action, target });

    switch (action) {
      case 'selected-best': {
        await updateSelectedAnswerSource({ promptId: target, source: interaction.values[0] });
        interaction.reply({ content: `Selected solution: ${interaction.values[0]}`, ephemeral: true });
        break;
      }
      default: {
        console.log('error finding action', action);
      }
    }
}
