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
  console.dir(body);
  return body?.query?.[0] ?? {accepted: 'false'};
}

export const doWolfram = async (prompt, thread, parentPromptId) => {
  try {
    const precheckResult = await wolframPrecheck(prompt);
    console.dir('wolfram precheck', {precheckResult});
    const worlframClassification = {domain: precheckResult.domain, confidence: precheckResult.resultsignificancescore};
    if (precheckResult.accepted === 'false') {
      console.log('wolfram failed precheck');
      const invalidWolframQuery = "Wolfram can't handle this type of query";
      const responseId = await recordNewResponse({ prompt, response: invalidWolframQuery, source: 'wolfram', parentPromptId });
      await sendTextResponse(invalidWolframQuery, thread, responseId, worlframClassification);
      return invalidWolframQuery;
    }
    if (!process.env.WOLFRAM_APP_ID) {
      console.log('missing wolfram app key');
      return;
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
      const responseId = await recordNewResponse({ prompt, response: result, source: 'wolfram', parentPromptId });
      await sendTextResponse(result, thread, responseId, worlframClassification);
      return result;
    }
    const podResults = processWorlframPods(queryResult);
    if (podResults) {
      const responseId = await recordNewResponse({ prompt, response: podResults, source: 'wolfram', parentPromptId });
      await sendTextResponse(podResults, thread, responseId, worlframClassification);
      return podResults;
    } 
    console.error('No pods in response', queryResult);
    const responseId = await recordNewResponse({ prompt, response: 'No results in response', source: 'wolfram', parentPromptId });
    await sendTextResponse('no results in response', thread, responseId, worlframClassification);
    return 'No results in response';
  } catch (error) {
    console.error(error);
    throw error;
  }
}

const sendTextResponse = async (result, thread, responseId, classification) => {
  const annotatedResult = classification ? `Problem classification: ${classification.domain} (confidence: ${classification.confidence})\n\n${result}` : result;
  await thread.send(createEmbedWrapper('Wolfram', annotatedResult, responseId));
}

const sendImageResponse = async (images, thread) => {
  await thread.send({ embeds: [createEmbedImages('Wolfram', images)] });
}

