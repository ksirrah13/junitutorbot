const { EmbedBuilder } = require('discord.js');

const createEmbedWrapper = (title, results) => {
  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle(title)
    .addFields(
      { name: 'Results', value: results },
    )
    .setTimestamp()
  return embed;
}

const createEmbedImages = (title, images) => {
  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle(title)
  images.forEach(image => embed.setImage(image));
  embed.setTimestamp();
  return embed;
}

module.exports = { createEmbedWrapper, createEmbedImages }