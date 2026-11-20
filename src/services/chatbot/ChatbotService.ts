import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '@/src/constants';
import { generateSystemPrompt } from './systemPrompt';
import type { ChatbotContext } from './types';

const MODEL = 'gemini-2.0-flash';

type ChatSession = ReturnType<ReturnType<GoogleGenerativeAI['getGenerativeModel']>['startChat']>;

export class ChatbotService {
  private genAI: GoogleGenerativeAI;
  private session: ChatSession | null = null;

  constructor() {
    this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }

  async initialize(context: ChatbotContext): Promise<void> {
    const model = this.genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: {
        temperature: 0.7,
        topP: 0.85,
        maxOutputTokens: 2048,
      },
    });

    const systemPrompt = generateSystemPrompt(context);

    this.session = model.startChat({
      history: [
        { role: 'user',  parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: `Bonjour ! Je suis votre assistant pour la mutuelle ENSPY. Je dispose de toutes vos informations personnelles et des données actuelles de la mutuelle. Comment puis-je vous aider ?` }] },
      ],
    });
  }

  async send(message: string): Promise<string> {
    if (!this.session) throw new Error('Session non initialisée');
    const result = await this.session.sendMessage(message);
    return this.clean(result.response.text());
  }

  reset(): void {
    this.session = null;
  }

  get isReady(): boolean {
    return this.session !== null;
  }

  private clean(text: string): string {
    return text
      .replace(/([^\n])(#{1,3} )/g, '$1\n\n$2')
      .replace(/(#{1,3} [^\n]+)([^\n])/g, '$1\n\n$2')
      .replace(/([^\n])(\n[-•] )/g, '$1\n$2')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
