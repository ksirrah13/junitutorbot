import { CacheType, Interaction } from "discord.js";
import { doAnthropic } from "../ai_sources/anthropic";
import { doCompletion } from "../ai_sources/openai";
import { doWolfram, wolframPrecheck } from "../ai_sources/wolfram";

const DEBUG_USER_ALLOWLIST = (process.env.DEBUG_USER_LIST ?? '').split(',');

export const requestAiResponses = async ({ prompt, thread, interaction, newPromptId, askingUserId }: { prompt: string, thread: any, interaction?: Interaction<CacheType>, newPromptId: string, askingUserId?: string }) => {

  const isDebugUser = askingUserId && DEBUG_USER_ALLOWLIST.includes(askingUserId);
  const preferredAiSource = await getPreferredAiSource(prompt);

  if (isDebugUser) {
    const wolframResult = await doWolfram({ prompt, thread, interaction, parentPromptId: newPromptId, preferredResponse: preferredAiSource === 'wolfram', enableDebug: true });
    const fallbackAnthropic = !wolframResult.success;
    // reply with all and mark one as preferred
    const [aiResult, anthropicResult] = await Promise.allSettled([
      doCompletion({ prompt, thread, parentPromptId: newPromptId, preferredResponse: false }),
      doAnthropic({ prompt, thread, parentPromptId: newPromptId, preferredResponse: preferredAiSource === 'anthropic' || fallbackAnthropic })]);
    console.log('all results', { aiResult, wolframResult, anthropicResult });
  } else {
    // only reply with the preferred one
    switch (preferredAiSource) {
      case 'wolfram': {
        const wolframResult = await doWolfram({ prompt, thread, interaction, parentPromptId: newPromptId, preferredResponse: preferredAiSource === 'wolfram' });
        // this can still fail so use anthropic as fallback if needed
        if (!wolframResult.success) {
          await doAnthropic({ prompt, thread, parentPromptId: newPromptId, preferredResponse: true });
        }
        break;
      }
      case 'anthropic': {
        await doAnthropic({ prompt, thread, parentPromptId: newPromptId, preferredResponse: preferredAiSource === 'anthropic' });
        break;
      }
      default: {
        console.log('unknown preferred source', { preferredAiSource });
      }
    }
  }


}

const validWolframDomains = ['math', 'sums'];

const getPreferredAiSource = async (prompt) => {
  const { accepted, domain, resultsignificancescore } = await wolframPrecheck(prompt);

  if (accepted === 'true' && validWolframDomains.includes(domain) && Number(resultsignificancescore) > 80) {
    return 'wolfram'
  }
  console.log('wolfram failed precheck', { accepted, domain, resultsignificancescore });
  return 'anthropic';
}
