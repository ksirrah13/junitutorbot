import { createEmbedWrapper, createEmbedImages } from './discord_utils.js';
import { recordNewResponse } from "./data_storage.js";
import WolframApi from '@tanzanite/wolfram-alpha';


// TODO add a precheck that verifies wolfram can answer the question
// https://products.wolframalpha.com/query-recognizer/documentation
export const doWolfram = async (prompt, thread, parentPromptId) => {
  try {
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
      const responseId = await recordNewResponse({prompt, response: result, source: 'wolfram', parentPromptId});
      await sendTextResponse(result, thread, responseId);
      return result;
    }
    if (queryResult && queryResult.pods) {
      const pods = queryResult.pods;
      if (pods.length !== 1) {
        console.log(pods);
        await sendTextResponse('too many pod results', thread, responseId);
        return 'too many pod results';
      }
      const resultSubPods = pods[0].subpods;
      const stepsPods = resultSubPods.filter(pod => pod.title === "Possible intermediate steps");
      if (stepsPods.length === 1) {
        const stepsText = stepsPods[0].plaintext;
        const responseId = await recordNewResponse({prompt, response: stepsText, source: 'wolfram', parentPromptId});
        await sendTextResponse(stepsText, thread, responseId);
        return stepsText;
      }
      console.log('no intermediate pods', resultSubPods);
      // no step by step so get the first plain text pod response
      const firstPod = resultSubPods[0];
      const resultText = firstPod.plaintext;
      const responseId = await recordNewResponse({prompt, response: resultText, source: 'wolfram', parentPromptId});
      await sendTextResponse(resultText, thread, responseId);
      return resultText;
    }
    console.error('no pods in response', queryResult);
    const responseId = await recordNewResponse({prompt, response: 'no results in response', source: 'wolfram', parentPromptId});
    await sendTextResponse('no results in response', thread, responseId);
    return 'no results in response';
  } catch (error) {
    console.error(error);
    throw error;
  }
}

const sendTextResponse = async (result, thread, responseId) => {
  await thread.send(createEmbedWrapper('Wolfram', result, responseId));
}

const sendImageResponse = async (images, thread) => {
  await thread.send({ embeds: [createEmbedImages('Wolfram', images)] });
}


    // <h2>Input</h2>
    //   <img src="http://www1.wolframalpha.com/Calculate/MSP/MSP2831bhah3hgdb1d0a6h0000270i2f8f935cf432?MSPStoreType=image/gif&s=14" alt="sin(x)">
    // <h2>Plots</h2>
    //   <img src="http://www1.wolframalpha.com/Calculate/MSP/MSP2841bhah3hgdb1d0a6h000018c0hieb8d6cc753?MSPStoreType=image/gif&s=14" alt="">
    //   <img src="http://www1.wolframalpha.com/Calculate/MSP/MSP2851bhah3hgdb1d0a6h00005ge64a5i3g8g8i6f?MSPStoreType=image/gif&s=14" alt="">
    // ...

