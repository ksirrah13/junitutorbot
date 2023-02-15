import { doAnthropic } from "../ai_sources/anthropic";
import { doCompletion } from "../ai_sources/openai";
import { doWolfram, wolframPrecheck } from "../ai_sources/wolfram";

const DEBUG_USER_ALLOWLIST = (process.env.DEBUG_USER_LIST ?? '').split(',');

export const requestAiResponses = async ({prompt, thread, newPromptId, askingUserId}: {prompt: string, thread: any, newPromptId: string, askingUserId?: string}) => {

    const isDebugUser = askingUserId && DEBUG_USER_ALLOWLIST.includes(askingUserId);
    const preferredAiSource = await getPreferredAiSource(prompt);
    
    if (isDebugUser) {
        // reply with all and mark one as preferred
        const [aiResult, wolframResult, anthropicResult] = await Promise.allSettled([
            doCompletion({prompt, thread, parentPromptId: newPromptId, preferredResponse: false}),
            doWolfram({prompt, thread, parentPromptId: newPromptId, preferredResponse: preferredAiSource === 'wolfram'}),
            doAnthropic({prompt, thread, parentPromptId: newPromptId, preferredResponse: preferredAiSource === 'anthropic'})]);
        console.log('all results', { aiResult, wolframResult, anthropicResult });

    } else {
        // only reply with the preferred one
        switch (preferredAiSource) {
            case 'wolfram': {
                await doWolfram({prompt, thread, parentPromptId: newPromptId, preferredResponse: preferredAiSource === 'wolfram'});
                break; 
            }
            case 'anthropic': {
                await doAnthropic({prompt, thread, parentPromptId: newPromptId, preferredResponse: preferredAiSource === 'anthropic'});
                break; 
            }
            default: {
                console.log('unknown preferred source', {preferredAiSource});
            }
        }
    }

    
}

const getPreferredAiSource = async (prompt) => {
    const {accepted, domain, resultsignificancescore} = await wolframPrecheck(prompt);

    if (accepted === 'true' && domain === 'math' && Number(resultsignificancescore) > 80) {
        return 'wolfram'
    }
    console.log('wolfram failed precheck', {accepted, domain, resultsignificancescore});
    return 'anthropic';
}
