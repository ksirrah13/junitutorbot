import { createEmbedWrapper, createEmbedImages } from './discord_utils.js';
import { recordNewResponse } from './data_storage.js'

export const processWorlframPods = async (queryResult, thread, worlframClassification) => {
    if (queryResult && queryResult.pods) {
        const pods = queryResult.pods;
        pods.forEach(pod => processSinglePod(pod, thread, worlframClassification));
        return 'found something?';
      }
}

export const sendTextResponse = async (result, thread, responseId, classification) => {
    const annotatedResult = classification ? `Problem classification: ${classification.domain} (confidence: ${classification.confidence})\n\n${result}` : result;
    await thread.send(createEmbedWrapper('Wolfram', annotatedResult, responseId));
  }
  
export const sendImageResponse = async (images, thread) => {
    await thread.send({ embeds: [createEmbedImages('Wolfram', images)] });
  }

const processSinglePod = async (pod, thread, worlframClassification) => {
    const resultSubPods = pod.subpods;
        const stepsPods = resultSubPods.filter(pod => pod.title === "Possible intermediate steps");
        if (stepsPods.length === 1) {
          const stepsText = stepsPods[0].plaintext;
        //   const responseId = await recordNewResponse({ prompt, response: stepsText, source: 'wolfram', parentPromptId });
          await sendTextResponse(stepsText, thread, '', worlframClassification);
          return stepsText;
        }
        console.log('no intermediate pods', resultSubPods);
        // no step by step so get the first plain text pod response
        const firstPod = resultSubPods[0];
        const resultText = firstPod.plaintext;
        // const responseId = await recordNewResponse({ prompt, response: resultText, source: 'wolfram', parentPromptId });
        if (resultText) {
            await sendTextResponse(resultText, thread, '', worlframClassification);
        }
        return resultText;

}
  
