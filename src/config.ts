export const config = {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    COPPERX_API_URL: process.env.COPPERX_API_URL || 'https://income-api.copperx.io',
    PUSHER_KEY: process.env.PUSHER_KEY,
    PUSHER_CLUSTER: process.env.PUSHER_CLUSTER || 'ap1',
    VERCEL_URL: process.env.VERCEL_URL,
  }