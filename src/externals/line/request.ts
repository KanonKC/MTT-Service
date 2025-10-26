// https://developers.line.biz/en/reference/messaging-api/#message-event

export interface LineWebhookRequest {
  destination: string;
  events: LineEvent[];
}

export interface LineEvent {
  replyToken: string;
  type: string;
  mode: string;
  timestamp: number;
  source: LineSource;
  webhookEventId: string;
  deliveryContext: LineDeliveryContext;
  message: LineMessage;
}

export interface LineSource {
  type: string;
  groupId?: string;
  userId?: string;
}

export interface LineDeliveryContext {
  isRedelivery: boolean;
}

export interface LineMessage {
  id: string;
  type: string;
  quoteToken?: string;
  text?: string;
  emojis?: LineEmoji[];
  mention?: LineMention;
}

export interface LineEmoji {
  index: number;
  length: number;
  productId: string;
  emojiId: string;
}

export interface LineMention {
  mentionees: LineMentionee[];
}

export interface LineMentionee {
  index: number;
  length: number;
  type: string;
  userId?: string;
  isSelf?: boolean;
}