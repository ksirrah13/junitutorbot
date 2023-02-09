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

module.exports = { createEmbedWrapper }