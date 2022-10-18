const dotenv = require('dotenv');
dotenv.config();
const _ = require('lodash');
const dayjs = require('dayjs')
const DiscordClient = require('./discord')

dayjs.locale('en')

const { CHANNEL_FROM, CHANNEL_TO, CLIENT_PUBLIC_KEY } = process.env

const client = new DiscordClient(CLIENT_PUBLIC_KEY);

const PROCESSED_ID = [];

(async () => {
  async function forwardMessage(messages) {
    const processed = [];
    for (const msg of messages) {
      const hasMessage = _.find(PROCESSED_ID, (id) => id === msg.id);

      try {
        if (!hasMessage) {
          await client.sendMessage(CHANNEL_TO, msg);
          processed.push(msg)
          console.log('success_send_message =>', msg.id);
        }
      } catch (error) {
        console.log('failed to send message', error)
      }
    }
    return processed;
  }

  const pooling = async function () {
    const messages = await client.getMessages(CHANNEL_FROM, 20);
    console.log(messages)
    await forwardMessage(messages);
  }

  await pooling();
  setInterval(pooling, 1000);
})();