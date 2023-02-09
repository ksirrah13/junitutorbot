const { createEmbedWrapper, createEmbedImages } = require('./discord_utils');


// TODO add a precheck that verifies wolfram can answer the question
// https://products.wolframalpha.com/query-recognizer/documentation
const doWolfram = async (prompt, thread) => {
  try {
    const wolframApi = await import("@tanzanite/wolfram-alpha");
    const waApi = wolframApi.initializeClass(process.env.WOLFRAM_APP_ID);
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
      await sendTextResponse(result, thread);
      return result;
    }
    if (queryResult && queryResult.pods) {
      const pods = queryResult.pods;
      if (pods.length !== 1) {
        console.log(pods);
        await sendTextResponse('too many pod results', thread);
        return 'too many pod results';
      }
      const resultSubPods = pods[0].subpods;
      const stepsPods = resultSubPods.filter(pod => pod.title === "Possible intermediate steps");
      if (stepsPods.length === 1) {
        const stepsText = stepsPods[0].plaintext;
        await sendTextResponse(stepsText, thread);
        return stepsText;
      }
      console.log('no intermediate pods', resultSubPods);
      // no step by step so get the first plain text pod response
      const firstPod = resultSubPods[0];
      const resultText = firstPod.plaintext;
      await sendTextResponse(resultText, thread);
      return resultText;
    }
    console.error('no pods in response', queryResult);
    await sendTextResponse('no results in response', thread);
    return 'no results in response';
  } catch (error) {
    console.error(error);
    throw error;
  }
}

const sendTextResponse = async (result, thread) => {
  await thread.send({ embeds: [createEmbedWrapper('Wolfram', result)] });
}

const sendImageResponse = async (images, thread) => {
  await thread.send({ embeds: [createEmbedImages('Wolfram', images)] });
}

module.exports = { doWolfram };


    // <h2>Input</h2>
    //   <img src="http://www1.wolframalpha.com/Calculate/MSP/MSP2831bhah3hgdb1d0a6h0000270i2f8f935cf432?MSPStoreType=image/gif&s=14" alt="sin(x)">
    // <h2>Plots</h2>
    //   <img src="http://www1.wolframalpha.com/Calculate/MSP/MSP2841bhah3hgdb1d0a6h000018c0hieb8d6cc753?MSPStoreType=image/gif&s=14" alt="">
    //   <img src="http://www1.wolframalpha.com/Calculate/MSP/MSP2851bhah3hgdb1d0a6h00005ge64a5i3g8g8i6f?MSPStoreType=image/gif&s=14" alt="">
    // ...

