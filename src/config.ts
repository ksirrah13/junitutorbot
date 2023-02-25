import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
    BOT_TOKEN : process.env['DISCORD_BOT_SECRET'],
    BOT_MENTION_ID : process.env['BOT_MENTION_ID'],
    APPLICATION_ID : process.env['DISCORD_APPLICATION_ID'],
    DISCORD_DEV_GUILD_ID : process.env['DISCORD_DEV_GUILD_ID'],
    DB_URI: process.env['DB_URI'],
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    WOLFRAM_APP_ID: process.env.WOLFRAM_APP_ID,
    DEV_MODE: process.env.DEV_MODE,
    DEBUG_USER_LIST: process.env.DEBUG_USER_LIST,
    TUTOR_SOS_CHANNEL_ID: process.env.TUTOR_SOS_CHANNEL_ID,
    MATHPIX_API_KEY: process.env.MATHPIX_API_KEY,
    MATHPIX_APP_ID: process.env.MATHPIX_APP_ID,
}
