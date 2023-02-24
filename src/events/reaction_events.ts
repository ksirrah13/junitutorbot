import { ThreadChannel, TextChannel, EmbedBuilder, Colors } from "discord.js";

export const handleReactionEvents = async (reaction, user) => {
    if (reaction.emoji.name !== '🧠') return;
  if (!reaction.message.channel.isThread()) return; // only dealing with thread reactions

  const starterMessage = await (reaction.message.channel as ThreadChannel).fetchStarterMessage();
  const starterMessageDescription = starterMessage?.embeds[0]?.data.description ?? '';
  const extractUser = new RegExp('<@(\\d*)> asked a question');
  const starterUser = extractUser.exec(starterMessageDescription)?.[1]; // parse from message
  if (!starterUser) return; // can't determine who should be allowed so don't do anything

  if (starterUser !== user.id) {
    // this will fail if the user message or reaction is from an admin
    try {
      await reaction.remove();
    } catch (error) {
      console.log('failed to remove reaction from admin user', { author: reaction.message.author?.username, user: user.username })
    }
    return;
  }
  // extract our original message and edit to add a notice of new answer
  const extractOriginalMessage = new RegExp('https:\/\/discord\.com\/channels\/(\\d*)\/(\\d*)\/(\\d*)');
  // const extractOriginalMessage = new RegExp('\[original message\]\((.*)\)');
  const originalMessageData = extractOriginalMessage.exec(starterMessageDescription);
  const originalChannel: TextChannel = reaction.client.channels.cache.get(originalMessageData?.[2] ?? '') as TextChannel;
  const originalMessage = await originalChannel.messages.fetch(originalMessageData?.[3] ?? '');
  if (originalMessage) {
    // post update to original message
    const newAnswer = new EmbedBuilder()
      .setColor(Colors.Green)
      .setDescription(`<@${reaction.message.author?.id}> answered in <#${starterMessage?.channelId}>
    [see their answer](${reaction.message.url})`);
    await originalMessage.edit({embeds: [originalMessage.embeds[0]!, newAnswer ]})
  }
  // add embed to original sos message
  const pointsAwardedEmbed = new EmbedBuilder()
    .setColor(Colors.Green)
    .setDescription(`Awarding points to <@${reaction.message.author?.id}>! Thanks for the help!`);
  const updatedMessageEmbeds = starterMessage?.embeds.map(embed => new EmbedBuilder().setColor(Colors.Green).setDescription(embed.description)) ?? [];
  await starterMessage?.edit({embeds: [...updatedMessageEmbeds, pointsAwardedEmbed]});
}
