import { incrementRatingCount, Rating, setPromptAnsweredResult, AnswerResult } from "../db";
import { getActionAndTargetFromId, createRatingsComponents, createMoreHelpBar, requestHelpFromChannel, createHelpRequestedResponse, createSatResponse } from "../utils/discord_utils";

export const handleButtonInteraction = async (interaction) => {
    const [action, target] = getActionAndTargetFromId(interaction.customId);
    console.log('executing button interaction', { action, target });
    
    switch (action) {
      case 'thumbs-up': {
        const counts = await incrementRatingCount({ responseId: target, rating: Rating.Yes });
        interaction.update({ components: [createRatingsComponents(target, counts)] })
        break;
      }
      case 'thumbs-down': {
        const counts = await incrementRatingCount({ responseId: target, rating: Rating.No });
        interaction.update({ components: [createRatingsComponents(target, counts)] })
        break;
      }
      case 'answered': {
        await setPromptAnsweredResult({ promptId: target, answerResult: AnswerResult.Answered });
        interaction.update(createMoreHelpBar({ promptId: target, answerResult: AnswerResult.Answered }))
        break;
      }
      case 'request-help': {
        await setPromptAnsweredResult({ promptId: target, answerResult: AnswerResult.RequestHelp });
        const helpThread = await requestHelpFromChannel(interaction, target);
        interaction.update(createHelpRequestedResponse({ helpThreadUrl: helpThread?.url }));
        break;
      }
      case 'sat-correct':
      case 'sat-incorrect': {
        interaction.update(createSatResponse(interaction, target));
        break;
      }
      default: {
        console.log('error finding action', action);
      }
    }
} 
