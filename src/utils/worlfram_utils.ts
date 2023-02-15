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
        return `## ${podTitle} ##\n${result}`;
    }
}
    

const processPlainText = (subpod) => {
    const text = subpod.plaintext;
    const title = subpod.title;
    if (text) {
        return `${title ? `# ${title}\n` : ''}${text}`;
    }
}
  
