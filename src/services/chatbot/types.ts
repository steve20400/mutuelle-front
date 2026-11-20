import type {
  BackendRole,
  MemberResponseDTO,
  AccountMemberDTO,
  SessionResponseDTO,
  ExerciceResponseDTO,
  MutuelleConfig,
  TypeAssistanceResponseDto,
} from '@/src/types';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface ChatbotContext {
  role: BackendRole;
  fullName: string;
  email: string;
  // Données personnelles (MEMBER seulement)
  memberProfile: MemberResponseDTO | null;
  account: AccountMemberDTO | null;
  // Données globales mutuelle
  session: SessionResponseDTO | null;
  exercice: ExerciceResponseDTO | null;
  config: MutuelleConfig | null;
  typesAssistance: TypeAssistanceResponseDto[];
  globalStats: {
    totalMembers: number;
    globalTotalTransactions: number;
    globalTotalAssistances: number;
    globalTotalAssistanceAmount: number;
  };
}
