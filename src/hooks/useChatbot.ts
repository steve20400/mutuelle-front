import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatbotService } from '@/src/services/chatbot/ChatbotService';
import { useContextStore } from '@/src/store/contextStore';
import { useMemberAccount } from '@/src/hooks/useContribution';
import { ROLE_DISPLAY_NAMES } from '@/src/navigation/roles';
import type { ChatMessage, ChatbotContext } from '@/src/services/chatbot/types';
import type { BackendRole } from '@/src/types';

// ─── Traduction des erreurs API ───────────────────────────────────────────────

function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes('suspended') || msg.includes('CONSUMER_SUSPENDED'))
    return 'Clé API suspendue. Veuillez en générer une nouvelle sur aistudio.google.com.';
  if (msg.includes('403') || msg.includes('API_KEY_INVALID') || msg.includes('invalid'))
    return 'Clé API invalide. Vérifiez EXPO_PUBLIC_GEMINI_API_KEY dans .env.local.';
  if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED'))
    return 'Quota API dépassé. Réessayez dans quelques instants.';
  if (msg.includes('404') || msg.includes('not found'))
    return 'Modèle Gemini introuvable. Vérifiez la configuration.';
  if (msg.includes('non initialisée') || msg.includes('not initialized'))
    return 'Assistant non prêt. Patientez quelques secondes.';
  return 'Erreur de communication avec l\'assistant.';
}

// ─── Suggestions par rôle ─────────────────────────────────────────────────────

const SUGGESTIONS: Record<BackendRole, string[]> = {
  MEMBER: [
    'Quelle est ma situation financière ?',
    'Combien puis-je emprunter ?',
    'Quel est mon solde d\'inscription ?',
    'Comment fonctionne le renflouement ?',
  ],
  ADMIN: [
    'Combien y a-t-il de membres actifs ?',
    'Comment créer un type d\'assistance ?',
    'Comment ouvrir une nouvelle session ?',
    'Expliquer le calcul du renflouement',
  ],
  PRESIDENT: [
    'Quelle est la situation financière globale ?',
    'Récapitulatif de la session en cours',
    'Membres avec des impayés',
    'Comment fonctionne la solidarité ?',
  ],
  TRESORIER: [
    'État de la trésorerie',
    'Emprunts en cours',
    'Renflouements non soldés',
    'Calcul des intérêts',
  ],
  SUPER_ADMIN: [
    'Situation générale de la mutuelle',
    'Membres actifs et insolvables',
    'Configuration actuelle',
    'Fonctionnement des exercices',
  ],
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChatbot() {
  const service = useRef(new ChatbotService()).current;

  const context = useContextStore((s) => s.context);
  const role = context?.role ?? null;
  const memberId = context?.memberProfile?.id;

  // Compte financier du membre (enabled seulement si MEMBER)
  const { data: account } = useMemberAccount(
    role === 'MEMBER' ? memberId : undefined
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading]       = useState(false);
  const [isReady, setIsReady]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [suggestions, setSuggestions]   = useState<string[]>([]);

  // ── Construction du contexte ─────────────────────────────────────────────

  const buildContext = useCallback((): ChatbotContext | null => {
    if (!context || !role) return null;

    const profile = context.memberProfile;
    const admin   = context.adminProfile;

    const fullName = profile
      ? `${profile.firstname} ${profile.lastname}`
      : admin
      ? `${admin.firstname} ${admin.lastname}`
      : context.email;

    return {
      role,
      fullName,
      email: context.email,
      memberProfile: profile ?? null,
      account: account ?? null,
      session:   context.currentSession  ?? null,
      exercice:  context.currentExercice ?? null,
      config:    context.config          ?? null,
      typesAssistance: context.typeAssistance ?? [],
      globalStats: {
        totalMembers:                context.totalMembers,
        globalTotalTransactions:     context.globalTotalTransactions,
        globalTotalAssistances:      context.globalTotalAssistances,
        globalTotalAssistanceAmount: context.globalTotalAssistanceAmount,
      },
    };
  }, [context, role, account]);

  // ── Initialisation ───────────────────────────────────────────────────────

  const initialize = useCallback(async () => {
    if (!context || !role) return;
    // Pour les membres, attendre que le compte soit chargé
    if (role === 'MEMBER' && memberId && !account) return;

    try {
      setIsLoading(true);
      setError(null);

      const ctx = buildContext();
      if (!ctx) throw new Error('Contexte indisponible');

      await service.initialize(ctx);

      const roleLabel = ROLE_DISPLAY_NAMES[role];
      const welcome: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Bonjour **${ctx.fullName}** ! 👋\n\nJe suis votre assistant pour la mutuelle ENSPY. En tant que **${roleLabel}**, je peux vous aider avec toutes vos questions relatives à la mutuelle.\n\nJ'ai accès aux données actuelles de la mutuelle et${role === 'MEMBER' ? ' à votre situation financière personnelle' : ' à la vue globale de la mutuelle'}.\n\nComment puis-je vous aider ?`,
        timestamp: new Date(),
      };

      setMessages([welcome]);
      setSuggestions(SUGGESTIONS[role] ?? []);
      setIsReady(true);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setIsLoading(false);
    }
  }, [context, role, memberId, account, buildContext, service]);

  // Auto-init quand les données sont disponibles
  useEffect(() => {
    if (!isReady && !isLoading && context && role) {
      // Pour les membres, attendre le compte
      if (role === 'MEMBER' && memberId && !account) return;
      initialize();
    }
  }, [context, role, memberId, account, isReady, isLoading, initialize]);

  // ── Envoi d'un message ───────────────────────────────────────────────────

  const sendMessage = useCallback(async (content: string) => {
    if (!isReady || isLoading || !content.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setSuggestions([]);
    setIsLoading(true);
    setError(null);

    try {
      const reply = await service.send(content.trim());

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      const friendly = friendlyError(e);
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Désolé, je rencontre une difficulté technique. Veuillez réessayer dans quelques instants.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
      setError(friendly);
    } finally {
      setIsLoading(false);
    }
  }, [isReady, isLoading, service]);

  // ── Reset ────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    service.reset();
    setMessages([]);
    setIsReady(false);
    setSuggestions([]);
    setError(null);
    initialize();
  }, [service, initialize]);

  return {
    messages,
    isLoading,
    isReady,
    error,
    suggestions,
    sendMessage,
    reset,
  };
}
