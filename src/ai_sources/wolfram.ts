import { recordNewResponse } from "../db";
import { processWorlframPods } from '../utils/worlfram_utils';
import { createEmbedWrapper, createEmbedImages } from '../utils/discord_utils';


// TODO add a precheck that verifies wolfram can answer the question
// https://products.wolframalpha.com/query-recognizer/documentation
export const wolframPrecheck = async (prompt) => {
  // TODO replace DEMO API key with process.env.WOLFRAM_APP_ID once resolved with support
  const APP_ID_KEY = 'DEMO';
  const precheckUrl = `http://www.wolframalpha.com/queryrecognizer/query.jsp?appid=${APP_ID_KEY}&mode=Default&output=json&i=${encodeURIComponent(prompt)}`;
  const result = await fetch(precheckUrl);
  const body = await result.json();
  return body?.query?.[0] ?? {accepted: 'false'};
}

export const doWolfram = async ({prompt, thread, parentPromptId, preferredResponse, enableDebug = false}) => {
  try {
    if (!process.env.WOLFRAM_APP_ID) {
      console.log('missing wolfram app key');
      return {success: false};
    }
    const dynamicImport = new Function('specifier', 'return import(specifier)');
    const { initializeClass } = await dynamicImport('@tanzanite/wolfram-alpha');
    const waApi = initializeClass(process.env.WOLFRAM_APP_ID);
    const queryResult: any = await waApi
      .getFull({ input: prompt, output: 'json', podstate: 'Step-by-step solution' }); // TODO find better podstate search agorithm

    if (!queryResult.success) {
      const result = queryResult.didyoumeans && queryResult.didyoumeans.val
        ? `Did you mean ${queryResult.didyoumeans.val} ?`
        : 'Unsuccessful response from api'
      console.log('wolfram queryResult', queryResult);
      const responseId = await recordNewResponse({ prompt, response: result, source: 'wolfram', parentPromptId, preferredResponse: false});
      if (enableDebug) {
        await sendTextResponse(result, thread, responseId, false);
      }
      return {success: false, result};
    }
    const podResults = processWorlframPods(queryResult);
    if (podResults) {
      const responseId = await recordNewResponse({ prompt, response: podResults, source: 'wolfram', parentPromptId, preferredResponse });
      await sendTextResponse(podResults, thread, responseId, preferredResponse);
      return {success: true, result: podResults};
    } 
    console.error('No pods in response', queryResult);
    const responseId = await recordNewResponse({ prompt, response: 'No results in response', source: 'wolfram', parentPromptId, preferredResponse: false });
    if (enableDebug) {
      await sendTextResponse('no results in response', thread, responseId, false);
    }
    return {success: false, result: 'No results in response'};
  } catch (error) {
    console.error(error);
    throw error;
  }
}

const sendTextResponse = async (results, thread, responseId, preferredResponse) => {
  await thread.send(createEmbedWrapper({title: 'Wolfram', results, responseId, preferredResponse}));
}

const sendImageResponse = async (images, thread) => {
  await thread.send({ embeds: [createEmbedImages('Wolfram', images)] });
}

