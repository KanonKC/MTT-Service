import Configuration from '@/configs';
import axios from 'axios';

export default class LINE {
  private readonly config: Configuration;
  constructor(config: Configuration) {
    this.config = config;
  }

  async replyMessage(replyToken: string, message: string) {
    axios.post(
      'https://api.line.me/v2/bot/message/reply',
      {
        replyToken,
        messages: [
          {
            type: 'text',
            text: message,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${this.config.line.accessToken}`,
        },
      }
    );
  }
}
