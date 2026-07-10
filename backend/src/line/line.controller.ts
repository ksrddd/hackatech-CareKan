import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { messagingApi, type webhook } from '@line/bot-sdk';
import { ConfigService } from '@nestjs/config';
import { buildMessages } from './flex-messages.js';
import { LineSignatureGuard } from './line-signature.guard.js';

@Controller('line')
export class LineController {
  private readonly client: messagingApi.MessagingApiClient;

  constructor(config: ConfigService) {
    this.client = new messagingApi.MessagingApiClient({
      channelAccessToken: config.get<string>('LINE_CHANNEL_TOKEN') ?? '',
    });
  }

  @Post('webhook')
  @HttpCode(200) // เดิมตอบ sendStatus(200) — Nest default POST คือ 201
  @UseGuards(LineSignatureGuard)
  async webhook(@Body() body: { events?: webhook.Event[] }): Promise<void> {
    const events = body.events ?? [];

    await Promise.all(
      events.map(async (event) => {
        if (event.type !== 'message') return;
        if (event.message.type !== 'text') return;
        const replyToken = (event as webhook.MessageEvent).replyToken;
        if (!replyToken) return;

        const text = (event.message as webhook.TextMessageContent).text;
        const messages = buildMessages(text);

        await this.client.replyMessage({ replyToken, messages });
      }),
    );
  }
}
