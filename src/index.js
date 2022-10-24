const dotenv = require('dotenv');
dotenv.config();
const _ = require('lodash');
const dayjs = require('dayjs')
const DiscordClient = require('./discord')
const { MongoClient } = require('mongodb');

dayjs.locale('en')

const { CHANNEL_FROM, CHANNEL_TO, CLIENT_PUBLIC_KEY, MONGO_URI } = process.env

const client = new DiscordClient(CLIENT_PUBLIC_KEY);
const mongodb = new MongoClient(MONGO_URI);

(async () => {
  async function forwardMessage(messages) {
    const db = mongodb.db('discord');
    const collection = db.collection('discord_forward');
    const processed = [];
    for (const msg of messages) {
      const hasMessage = await collection.findOne({ _id: msg.id })
      console.log('has_message', !!hasMessage)
      try {
        if (!hasMessage) {
          await client.sendMessage(CHANNEL_TO, msg);
          console.log('saving...')
          await collection.insertOne({
            _id: msg.id,
            ...msg,
          });
          processed.push(msg);
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
    await forwardMessage(messages);
  }

  await pooling();
  setInterval(pooling, 8000);
})();