import { createEmbedWrapper, createEmbedImages } from './discord_utils.js';
import { recordNewResponse } from "./data_storage.js";
import WolframApi from '@tanzanite/wolfram-alpha';


// TODO add a precheck that verifies wolfram can answer the question
// https://products.wolframalpha.com/query-recognizer/documentation
export const wolframPrecheck = async (prompt) => {
  // TODO replace DEMO API key with our own once resolved with support
  const precheckUrl = `http://www.wolframalpha.com/queryrecognizer/query.jsp?appid=DEMO&mode=Default&output=json&i=${encodeURIComponent(prompt)}`;
  const result = await fetch(precheckUrl);
  const body = await result.json();
  console.dir(body);
  return body?.query?.[0] ?? {accepted: 'false'};
}

export const doWolfram = async (prompt, thread, parentPromptId) => {
  try {
    const precheckResult = await wolframPrecheck(prompt);
    console.dir('wolfram precheck', {precheckResult});
    if (precheckResult.accepted === 'false') {
      console.dir('wolfram failed precheck');
      const invalidWolframQuery = "Worlfram can't handle this type of query";
      const responseId = await recordNewResponse({ prompt, response: invalidWolframQuery, source: 'wolfram', parentPromptId });
      await sendTextResponse(invalidWolframQuery, thread, responseId);
      return invalidWolframQuery;
    }
    const worlframClassification = {domain: precheckResult.domain, confidence: precheckResult.resultsignificancescore};
    const waApi = WolframApi(process.env.WOLFRAM_APP_ID);
    const queryResult = await waApi
      .getFull({ input: prompt, includepodid: 'Result', output: 'json', podstate: 'Step-by-step solution' });
    // const queryResult = await waApi
    //   .getSimple(prompt);

    let result = '';
    if (!queryResult.success) {
      if (queryResult.didyoumeans && queryResult.didyoumeans.val) {
        result = `Did you mean ${queryResult.didyoumeans.val} ?`;
      } else {
        result = 'unsuccessful response from api';
      }
      console.log('wolfram queryResult', queryResult);
      const responseId = await recordNewResponse({ prompt, response: result, source: 'wolfram', parentPromptId });
      await sendTextResponse(result, thread, responseId, worlframClassification);
      return result;
    }
    if (queryResult && queryResult.pods) {
      const pods = queryResult.pods;
      if (pods.length !== 1) {
        console.log(pods);
        await sendTextResponse('too many pod results', thread, responseId, worlframClassification);
        return 'too many pod results';
      }
      const resultSubPods = pods[0].subpods;
      const stepsPods = resultSubPods.filter(pod => pod.title === "Possible intermediate steps");
      if (stepsPods.length === 1) {
        const stepsText = stepsPods[0].plaintext;
        const responseId = await recordNewResponse({ prompt, response: stepsText, source: 'wolfram', parentPromptId });
        await sendTextResponse(stepsText, thread, responseId, worlframClassification);
        return stepsText;
      }
      console.log('no intermediate pods', resultSubPods);
      // no step by step so get the first plain text pod response
      const firstPod = resultSubPods[0];
      const resultText = firstPod.plaintext;
      const responseId = await recordNewResponse({ prompt, response: resultText, source: 'wolfram', parentPromptId });
      await sendTextResponse(resultText, thread, responseId), worlframClassification;
      return resultText;
    }
    console.error('no pods in response', queryResult);
    const responseId = await recordNewResponse({ prompt, response: 'no results in response', source: 'wolfram', parentPromptId });
    await sendTextResponse('no results in response', thread, responseId, worlframClassification);
    return 'no results in response';
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
