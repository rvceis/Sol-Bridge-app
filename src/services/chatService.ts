import AsyncStorage from '@react-native-async-storage/async-storage';

export type Message = {
  id: string;
  from: 'me' | 'them';
  text: string;
  timestamp: number;
};

const keyFor = (userId: string) => `chat:conv:${userId}`;

export const chatService = {
  async getMessages(userId: string): Promise<Message[]> {
    const raw = await AsyncStorage.getItem(keyFor(userId));
    return raw ? (JSON.parse(raw) as Message[]) : [];
  },

  async sendMessage(userId: string, text: string, from: 'me' | 'them' = 'me'): Promise<Message> {
    const messages = await this.getMessages(userId);
    const msg: Message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      from,
      text,
      timestamp: Date.now(),
    };
    const updated = [...messages, msg];
    await AsyncStorage.setItem(keyFor(userId), JSON.stringify(updated));
    return msg;
  },

  async clearConversation(userId: string) {
    await AsyncStorage.removeItem(keyFor(userId));
  },
};

export default chatService;
