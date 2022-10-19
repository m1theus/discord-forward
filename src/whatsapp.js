const qrTerminal = require('qrcode-terminal');
const { Client, MessageMedia } = require('whatsapp-web.js');

module.exports = async function start(eventEmitter) {
  const client = new Client();

  async function startEventHandle() {
    eventEmitter.on('MESSAGE_CREATE', async ({
      id,
      timestamp,
      content,
      channel_id,
      attachments,
      whatsapp_channel,
    }) => {
      if (!whatsapp_channel) {
        return;
      }
      if (attachments && attachments.length > 0) {
        console.log('whatsapp => attachments_size', attachments.length);
        for (const attachment of attachments) {
          console.log('whatsapp => sending_media_message', id);
          console.log(attachment);

          const media = await MessageMedia.fromUrl(attachment.proxy_url);

          await client.sendMessage(whatsapp_channel, media, {
            caption: content,
          });
        }
      } else {
        console.log('whatsapp => sending_text_message', id);
        await client.sendMessage(whatsapp_channel, content);
      }
    });
  }

  client.on('qr', (qr) => {
    console.log('whatsapp => qr is ready!');
    qrTerminal.generate(qr, { small: true })
  });

  client.on('ready', () => {
    console.log('whatsapp => client is ready!');
    startEventHandle();
  });

  client.initialize();
}