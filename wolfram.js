const doWolfram = async (prompt) => {
  try {
    const wolframApi = await import("@tanzanite/wolfram-alpha");
    const waApi = wolframApi.initializeClass(process.env.WOLFRAM_APP_ID);
    const queryResult = await waApi
      .getFull({ input: prompt, includepodid: 'Result', output: 'json' });

    console.log('wolfram result', queryResult);
    if (queryResult && queryResult.pods) {
      const pods = queryResult.pods;
      const output = pods
        .map(pod => {
          const subpodContent = pod.subpods
            .map(subpod => { return `plaintext: ${subpod.plaintext}  <img src="${subpod.img.src}" alt="${subpod.img.alt}">` })
            .join("\n");
          return `<h2>${pod.title}</h2>\n${subpodContent}`;
        })
        .join("\n");
      console.log(output);
      return output;
    }
    if (queryResult) {
      return `<img src="${queryResult}" alt="result">`;
    }
    return "no results";
  } catch (error) {
    console.error(error);
  }
}

module.exports = { doWolfram };


    // <h2>Input</h2>
    //   <img src="http://www1.wolframalpha.com/Calculate/MSP/MSP2831bhah3hgdb1d0a6h0000270i2f8f935cf432?MSPStoreType=image/gif&s=14" alt="sin(x)">
    // <h2>Plots</h2>
    //   <img src="http://www1.wolframalpha.com/Calculate/MSP/MSP2841bhah3hgdb1d0a6h000018c0hieb8d6cc753?MSPStoreType=image/gif&s=14" alt="">
    //   <img src="http://www1.wolframalpha.com/Calculate/MSP/MSP2851bhah3hgdb1d0a6h00005ge64a5i3g8g8i6f?MSPStoreType=image/gif&s=14" alt="">
    // ...

