const axios = require('axios');
const API_URL = 'https://discord.com/api/v9';

module.exports = class DiscordClient {
  #token
  constructor(token) {
    this.#token = token;
  }

  async getMessages(channel, limit = 20) {
    try {
      const { data } = await axios({
        url: `${API_URL}/channels/${channel}/messages?limit=${limit ? limit : 20}`,
        method: "GET",
        headers: {
          authorization: this.#token,
        }
      });
      return Promise.resolve(data);
    } catch (error) {
      console.log('FAILED_TO_GET_MESSAGES', error);
    }
  }

  async sendMessage(channel, { id, type, content, tts, attachments }) {
    const myAttachments = [];
    try {
      if (attachments && attachments.length > 0) {
        const attachmentsResponse = await this.#attachFile(channel, attachments);

        const filesPromise = attachmentsResponse.map((file) => {
          return axios({
            url: file.proxy_url,
            method: 'GET',
            responseType: "stream"
          })
            .then(({ data }) => {
              return {
                data,
                ...file,
              }
            })
        });

        const filesReponse = await Promise.all(filesPromise);

        const uploadResponse = await this.#uploadFiles(filesReponse);

        myAttachments.push(...uploadResponse);
      }
      const { data } = await axios({
        url: `${API_URL}/channels/${channel}/messages`,
        method: 'POST',
        headers: {
          authorization: this.#token,
        },
        data: {
          nonce: id,
          channel_id: channel,
          sticker_ids: [],
          type,
          content,
          tts,
          attachments: myAttachments,
        }
      });
      return Promise.resolve(data);
    } catch (error) {
      console.log('FAILED_TO_SEND_MESSAGE', error);
    }
  }

  async #attachFile(channel, attachments = []) {
    if (!attachments) {
      return Promise.reject('Invalid attachments');
    }

    try {
      const files = attachments.map(({ id, filename, size: file_size, proxy_url }) => {
        return {
          id,
          filename,
          file_size,
          proxy_url,
        };
      });

      const { data: { attachments: attachableFiles = [] } } = await axios({
        url: `${API_URL}/channels/${channel}/attachments`,
        method: "POST",
        headers: {
          authorization: this.#token,
          "content-type": "application/json",
        },
        data: { files }
      });

      const attachmentsResponse = attachableFiles.map(({ id, upload_url, upload_filename }) => {
        const { filename, file_size, proxy_url } = files.find(x => x.id === id);
        return {
          id,
          filename,
          upload_url,
          upload_filename,
          file_size,
          proxy_url,
        };
      });

      return Promise.resolve(attachmentsResponse);
    } catch (error) {
      console.log('FAILED_TO_ATTACH_FILE', error);
    }
  }

  async #uploadFiles(files = []) {
    const promises = files.map(({ id, filename, upload_url, data, upload_filename: uploaded_filename, file_size }) => {
      return axios({
        url: upload_url,
        method: 'PUT',
        headers: {
          authorization: this.#token,
          Connection: 'keep-alive',
          authority: 'discord-attachments-uploads-prd.storage.googleapis.com',
          'content-length': file_size,
        },
        data,
      })
        .then((_) => {
          return {
            id,
            filename,
            uploaded_filename
          }
        });
    });

    const response = await axios.all(promises);

    return Promise.resolve(response);
  }
};