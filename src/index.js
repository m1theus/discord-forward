require('dotenv').config();
const qrTerminal = require('qrcode-terminal');
const { Client: WppClient, MessageMedia } = require('whatsapp-web.js');
const { Client: DiscordClient, GatewayIntentBits, ClientEvents } = require('discord.js');

const { DISCORD_BOT_TOKEN } = process.env;

(async () => {
  const chatMap = {
    '1031705361255780462': '120363046356549893@g.us',
    '1031716951279546411': '120363045904090312@g.us'
  }
  const discordClient = new DiscordClient({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ]
  });
  const wppClient = new WppClient();

  wppClient.on('qr', (qr) => {
    qrTerminal.generate(qr, { small: true })
  });

  wppClient.on('ready', () => {
    console.log('Client is ready!');
  });

  discordClient.on('ready', () => {
    console.log(`Logged in as ${discordClient.user.tag}!`);
  });

  discordClient.on('messageCreate', async ({ channelId, content, attachments = new Map() }) => {
    const wppState = await wppClient.getState();
    console.log(`WPP_STATE=${wppState},channelId=${channelId},text=${content},attach=`, attachments);
    if (!(wppState === 'CONNECTED')) {
      return;
    }

    const medias = [];

    const chatId = chatMap[channelId];
    console.log('found_chat_id=', chatId)
    if (chatId) {
      if (attachments && attachments.size > 0) {
        console.log('message_has_attachments', attachments.size)
        for (const [, value] of attachments.entries()) {
          const { proxyURL } = value;
          const media = await MessageMedia.fromUrl(proxyURL);
          medias.push(media);
        }

        console.log('medias_size=', medias.length)

        for (const media of medias) {
          console.log('sending_media_message')
          await wppClient.sendMessage(chatId, media, {
            caption: content,
          });
        }
      } else {
        console.log('sending_text_message')
        await wppClient.sendMessage(chatId, content);
      }
    }
  })
  wppClient.initialize();
  discordClient.login(DISCORD_BOT_TOKEN);
})();