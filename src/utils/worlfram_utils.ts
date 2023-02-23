export const processWorlframPods = (queryResult) => {
    if (queryResult && queryResult.pods) {
        const pods = queryResult.pods;
        const result = pods.map(pod => processSinglePod(pod)).join('\n\n');
        return result;
      }
}

const processSinglePod = (pod) => {
    const subpods = pod.subpods;
    const podTitle: string = pod.title;
    const result = subpods.map(subpod => processPlainText(subpod)).join('\n\n');
    if (result) {
        const adjustedPodTitle = podTitle.startsWith('Input') ? "This is what I understand you're asking for help with:" : podTitle;
        return `__**${adjustedPodTitle}**__\n${result}`;
    }
}
    

const processPlainText = (subpod) => {
    const text = subpod.plaintext;
    const title = subpod.title;
    if (text) {
        const adjustedTitle = title.startsWith('Possible intermediate steps') ? "Possible Solution" : title;
        return `${adjustedTitle ? `**${adjustedTitle}**\n` : ''}${formatStepText(text)}`;
    }
}

const formatStepText = (stepsText) => {
    // this is far from foolproof but if a line ends with : we treat it like a step heading
    const stepPattern = /\:$/;
    const limitResponse = stepsText.indexOf('lim_') !== -1;
    const textArray = stepsText.split('\n'); //?
    let stepCount = 0;
    const formatted = textArray.map(line => {
        // replace underscores on lim_ to avoid formatting issues
        const cleanedLine = line.replaceAll('lim_(', 'lim(');
        if (stepPattern.exec(cleanedLine)) { //?
            // add count and underline
            stepCount += 1;
            return limitResponse 
            // don't add italics to limit response because it has issues for now
             ? `${stepCount > 1 ? '\n' : ""}${stepCount}. ${cleanedLine}`
             : `${stepCount > 1 ? '\n' : ""}*${stepCount}. ${cleanedLine}*`;
        }
        // remove extra { for system of equations
        if (line.startsWith('{')) return line.substring(1);
        // format answer lines
        if (line.startsWith(' | {')) return line.substring(4);
        if (line.startsWith(' |')) return line.substring(2);
        const answerEnd = /\| $/;
        if (answerEnd.exec(line)) return line.substring(0, line.length - 2);
        return line;
    })
    return formatted.join('\n');
}
  
