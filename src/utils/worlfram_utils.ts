export const processWorlframPods = (queryResult) => {
    if (queryResult && queryResult.pods) {
        const pods = queryResult.pods;
        const result = pods.map(pod => processSinglePod(pod)).join('\n\n');
        return result;
      }
}

const processSinglePod = (pod) => {
    const subpods = pod.subpods;
    const podTitle = pod.title;
    const result = subpods.map(subpod => processPlainText(subpod)).join('\n\n');
    if (result) {
        return `__**${podTitle}**__\n${result}`;
    }
}
    

const processPlainText = (subpod) => {
    const text = subpod.plaintext;
    const title = subpod.title;
    if (text) {
        return `${title ? `**${title}**\n` : ''}${formatStepText(text)}`;
    }
}

const formatStepText = (stepsText) => {
    // this is far from foolproof but if a line ends with : we treat it like a step heading
    const stepPattern = /\:$/;
    const textArray = stepsText.split('\n'); //?
    let stepCount = 0;
    const formatted = textArray.map(line => {
        if (stepPattern.exec(line)) { //?
            // add count and underline
            stepCount += 1;
            return `${stepCount > 1 ? '\n' : ""}*${stepCount}. ${line}*`;
        }
        return line;
    })
    return formatted.join('\n');
}
  
