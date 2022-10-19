require('dotenv').config();
const WebSocket = require('ws');
const { EventEmitter } = require('events');

const whatsappStart = require('./whatsapp');
const channels_map = require('./channels_map.json')

const { DISCORD_CLIENT_TOKEN } = process.env;

function heartbeat(ws, interval) {
  return setInterval(() => {
    ws.send(JSON.stringify({
      op: 1,
      d: null,
    }));
  }, interval);
}

(async () => {
  const ws = new WebSocket('wss://gateway.discord.gg/?v=6&encoding=json');
  const eventEmitter = new EventEmitter();

  ws.on('open', async () => {
    ws.send(JSON.stringify({
      "op": 2,
      "d": {
        "token": DISCORD_CLIENT_TOKEN,
        "capabilities": 1021,
        "properties": {
          "os": "Windows",
          "browser": "Chrome",
          "device": "",
          "system_locale": "pt-BR",
          "browser_user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.5195.127 Safari/537.36",
          "browser_version": "105.0.5195.127",
          "os_version": "10",
          "referrer": "",
          "referring_domain": "",
          "referrer_current": "",
          "referring_domain_current": "",
          "release_channel": "stable",
          "client_build_number": 153013,
          "client_event_source": null
        },
        "presence": {
          "status": "online",
          "since": 0,
          "activities": [],
          "afk": false
        },
        "compress": false,
        "client_state": {
          "guild_hashes": {},
          "highest_last_message_id": "0",
          "read_state_version": 0,
          "user_guild_settings_version": -1,
          "user_settings_version": -1,
          "private_channels_version": "0"
        }
      }
    }
    ));

    await whatsappStart(eventEmitter);
  });

  ws.on('message', (data) => {
    const { t, event, op, d } = JSON.parse(data);

    switch (op) {
      case 10: {
        const { heartbeat_interval } = d;
        heartbeat(ws, heartbeat_interval);
        break;
      }
    }

    switch (t) {
      case 'MESSAGE_CREATE': {
        console.log(`main => receiving op ${op} with intent ${t}`);
        const { id, timestamp, content, channel_id, attachments = [] } = d;
        const whatsapp_channel = channels_map[channel_id];

        if (whatsapp_channel) {
          console.log('main => emiting event to message', id);
          eventEmitter.emit('MESSAGE_CREATE', {
            id,
            timestamp,
            content,
            channel_id,
            attachments,
            whatsapp_channel,
          });
        }

        break;
      }
    }
  });
})();