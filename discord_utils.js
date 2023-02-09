import { EmbedBuilder } from 'discord.js';

export const createEmbedWrapper = (title, results) => {
  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle(title)
    .addFields(
      createFields(results),
    )
    .setTimestamp()
  return embed;
}

const MAX_FIELD_LENGTH = 1024
const createFields = text => {
  if (text.length <= MAX_FIELD_LENGTH) {
    return { name: 'Results', value: text };
  }
  // naive split which doesn't break on words or anything
  const chunkedFields = chunkString(text, MAX_FIELD_LENGTH);
  return chunkedFields.map(value => ({ name: 'Results', value }));
}

const chunkString = (str, length) => {
  return str.match(new RegExp('(.|[\r\n]){1,' + length + '}', 'g'));
}

export const createEmbedImages = (title, images) => {
  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle(title)
  images.forEach(image => embed.setImage(image));
  embed.setTimestamp();
  return embed;
}
