const { createEmbedWrapper } = require('./discord_utils');

const doWolfram = async (prompt, thread) => {
  try {
    const wolframApi = await import("@tanzanite/wolfram-alpha");
    const waApi = wolframApi.initializeClass(process.env.WOLFRAM_APP_ID);
    const queryResult = await waApi
      .getFull({ input: prompt, includepodid: 'Result', output: 'json' });

    console.log('wolfram result', queryResult);
    let result = '';
    if (!queryResult.success) {
      if (queryResult.didyoumeans) {
        result = `Did you mean ${queryResult.didyoumeans.val} ?`;
      } else {
        result = 'unsuccessful response from api';
      }
      await sendResponse(result, thread);
      return result;
    }
    if (queryResult && queryResult.pods) {
      const pods = queryResult.pods;
      const output = pods
        .map(pod => {
          const subpodContent = pod.subpods
            .map(subpod => { return subpod.plaintext })
            .join("\n");
          return subpodContent;
        })
        .join("\n");
      console.log(output);
      result = output;
    }
    else if (queryResult) {
      result = `<img src="${queryResult}" alt="result">`;
    }
    await sendResponse(result, thread);
    return result;
  } catch (error) {
    console.error(error);
  }
}

const sendResponse = async (result, thread) => {
  await thread.send({ embeds: [createEmbedWrapper('Wolfram', result)] });
}

module.exports = { doWolfram };


    // <h2>Input</h2>
    //   <img src="http://www1.wolframalpha.com/Calculate/MSP/MSP2831bhah3hgdb1d0a6h0000270i2f8f935cf432?MSPStoreType=image/gif&s=14" alt="sin(x)">
    // <h2>Plots</h2>
    //   <img src="http://www1.wolframalpha.com/Calculate/MSP/MSP2841bhah3hgdb1d0a6h000018c0hieb8d6cc753?MSPStoreType=image/gif&s=14" alt="">
    //   <img src="http://www1.wolframalpha.com/Calculate/MSP/MSP2851bhah3hgdb1d0a6h00005ge64a5i3g8g8i6f?MSPStoreType=image/gif&s=14" alt="">
    // ...

