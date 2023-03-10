import { CacheType, Interaction } from "discord.js";
import { doAnthropic } from "./anthropic";
import { doCompletion } from "./openai";
import { doWolfram, wolframPrecheck } from "./wolfram";
import { CONFIG } from "../config";

const DEBUG_USER_ALLOWLIST = (CONFIG.DEBUG_USER_LIST ?? '').split(',');

export const requestAiResponses = async ({ prompt, thread, interaction, newPromptId, askingUserId }: { prompt: string, thread: any, interaction?: Interaction<CacheType>, newPromptId: string, askingUserId?: string }) => {

  const isDebugUser = askingUserId && DEBUG_USER_ALLOWLIST.includes(askingUserId);
  const preferredAiSource = await getPreferredAiSource(prompt, interaction, isDebugUser);

  if (isDebugUser) {
    const wolframResult = await doWolfram({ prompt, thread, interaction, parentPromptId: newPromptId, preferredResponse: preferredAiSource === 'wolfram', enableDebug: true });
    const fallbackAnthropic = !wolframResult.success;
    // reply with all and mark one as preferred
    const [aiResult, anthropicResult] = await Promise.allSettled([
      doCompletion({ prompt, thread, interaction, parentPromptId: newPromptId, preferredResponse: false }),
      doAnthropic({ prompt, thread, interaction, parentPromptId: newPromptId, preferredResponse: preferredAiSource === 'anthropic' || fallbackAnthropic })]);
    console.log('all results', { aiResult, wolframResult, anthropicResult });
  } else {
    // only reply with the preferred one
    switch (preferredAiSource) {
      case 'wolfram': {
        const wolframResult = await doWolfram({ prompt, thread, interaction, parentPromptId: newPromptId, preferredResponse: preferredAiSource === 'wolfram' });
        // this can still fail so use anthropic as fallback if needed
        if (!wolframResult.success) {
          await doAnthropic({ prompt, thread, interaction, parentPromptId: newPromptId, preferredResponse: true });
        }
        break;
      }
      case 'anthropic': {
        await doAnthropic({ prompt, thread, interaction, parentPromptId: newPromptId, preferredResponse: preferredAiSource === 'anthropic' });
        break;
      }
      default: {
        console.log('unknown preferred source', { preferredAiSource });
      }
    }
  }


}

const validWolframDomains = ['math', 'sums', 'equation solving', 'computation of limits', 'formulas'];

const getPreferredAiSource = async (prompt, interaction, isDebugUser) => {
  const { accepted, domain, resultsignificancescore } = await wolframPrecheck(prompt);
  if (isDebugUser) {
    await interaction.followUp({ content: `Wolfram Classification Results:\nAccepted: ${accepted}\nDomain: ${domain} (confidence ${resultsignificancescore})`, ephemeral: true })
  }

  if (accepted === 'true' && validWolframDomains.includes(domain) && Number(resultsignificancescore) > 80) {
    return 'wolfram'
  }
  console.log('wolfram failed precheck', { accepted, domain, resultsignificancescore });
  return 'anthropic';
}
