import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
// expo-file-system v19 : File, Paths, Directory sont exportés directement.
// L'ancien namespace (* as FileSystem) ne contient plus documentDirectory/cacheDirectory.
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as SecureStore from 'expo-secure-store';
import { bilanRepository } from '@/src/api/repositories/bilanRepository';
import { useToast } from '@/src/store/toastStore';
import { API_BASE_URL, SECURE_STORE_KEYS } from '@/src/constants';
import { ENDPOINTS } from '@/src/api/endpoints';

// ─── Bilan mutuelle par session (lazy) ────────────────────────────────────────

export function useBilanMutuelleSession(sessionId: number | null) {
  return useQuery({
    queryKey: ['bilan', 'mutuelle', 'session', sessionId],
    queryFn: async () => {
      const res = await bilanRepository.getMutuelleSession(sessionId!);
      return res.data;
    },
    enabled: sessionId !== null,
    staleTime: 10 * 60 * 1000,
  });
}

// ─── Bilan mutuelle par exercice (lazy) ───────────────────────────────────────

export function useBilanMutuelleExercice(exerciceId: number | null) {
  return useQuery({
    queryKey: ['bilan', 'mutuelle', 'exercice', exerciceId],
    queryFn: async () => {
      const res = await bilanRepository.getMutuelleExercice(exerciceId!);
      return res.data;
    },
    enabled: exerciceId !== null,
    staleTime: 10 * 60 * 1000,
  });
}

// ─── Bilan membre — tous ses exercices ───────────────────────────────────────

export function useBilanMemberExercices(memberId: number | null) {
  return useQuery({
    queryKey: ['bilan', 'member', memberId, 'exercices'],
    queryFn: async () => {
      const res = await bilanRepository.getMemberExercices(memberId!);
      return res.data ?? [];
    },
    enabled: memberId !== null,
    staleTime: 10 * 60 * 1000,
  });
}

// ─── Bilan membre — toutes ses sessions ──────────────────────────────────────

export function useBilanMemberSessions(memberId: number | null) {
  return useQuery({
    queryKey: ['bilan', 'member', memberId, 'sessions'],
    queryFn: async () => {
      const res = await bilanRepository.getMemberSessions(memberId!);
      return res.data ?? [];
    },
    enabled: memberId !== null,
    staleTime: 10 * 60 * 1000,
  });
}

// ─── Bilan tous les membres — par session ────────────────────────────────────

export function useBilanSessionMembers(sessionId: number | null) {
  return useQuery({
    queryKey: ['bilan', 'session', sessionId, 'membres'],
    queryFn: async () => {
      const res = await bilanRepository.getSessionMembers(sessionId!);
      return res.data ?? [];
    },
    enabled: sessionId !== null,
    staleTime: 10 * 60 * 1000,
  });
}

// ─── Bilan tous les membres — par exercice ────────────────────────────────────

export function useBilanExerciceMembers(exerciceId: number | null) {
  return useQuery({
    queryKey: ['bilan', 'exercice', exerciceId, 'membres'],
    queryFn: async () => {
      const res = await bilanRepository.getExerciceMembers(exerciceId!);
      return res.data ?? [];
    },
    enabled: exerciceId !== null,
    staleTime: 10 * 60 * 1000,
  });
}

// ─── Téléchargement PDF ───────────────────────────────────────────────────────
// createDownloadResumable gère le binaire nativement (pas de conversion ArrayBuffer/base64).
// Supporte les headers custom (Authorization) et fonctionne sur expo-file-system v19.

export function useDownloadBilanPdf() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const { error: showError } = useToast();

  const download = async (key: string, endpoint: string, filename: string) => {
    if (downloading) return;
    try {
      setDownloading(key);

      const token = await SecureStore.getItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);

      // File.downloadFileAsync est une méthode STATIQUE — téléchargement natif binaire.
      // idempotent: true permet d'écraser un fichier existant (ex: 2e téléchargement).
      const destination = new File(Paths.cache, `${filename}.pdf`);
      const downloaded = await File.downloadFileAsync(
        `${API_BASE_URL}${endpoint}`,
        destination,
        {
          headers: { Authorization: `Bearer ${token ?? ''}` },
          idempotent: true,
        }
      );

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        showError("Le partage de fichiers n'est pas disponible sur cet appareil");
        return;
      }

      await Sharing.shareAsync(downloaded.uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Exporter le bilan',
        UTI: 'com.adobe.pdf',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du téléchargement du PDF';
      showError(msg);
    } finally {
      setDownloading(null);
    }
  };

  // ── Mutuelle ──
  const downloadSessionPdf = (sessionId: number, sessionName: string) =>
    download(
      `session-${sessionId}`,
      ENDPOINTS.BILAN.MUTUELLE_SESSION_PDF(sessionId),
      `bilan-session-${sessionName.replace(/\s+/g, '-')}-${sessionId}`
    );

  const downloadExercicePdf = (exerciceId: number, exerciceName: string) =>
    download(
      `exercice-${exerciceId}`,
      ENDPOINTS.BILAN.MUTUELLE_EXERCICE_PDF(exerciceId),
      `bilan-exercice-${exerciceName.replace(/\s+/g, '-')}-${exerciceId}`
    );

  // ── Membre ──
  const downloadMemberSessionPdf = (memberId: number, sessionId: number) =>
    download(
      `member-session-${memberId}-${sessionId}`,
      ENDPOINTS.BILAN.MEMBER_SESSION_PDF(memberId, sessionId),
      `bilan-membre-${memberId}-session-${sessionId}`
    );

  const downloadMemberExercicePdf = (memberId: number, exerciceId: number) =>
    download(
      `member-exercice-${memberId}-${exerciceId}`,
      ENDPOINTS.BILAN.MEMBER_EXERCICE_PDF(memberId, exerciceId),
      `bilan-membre-${memberId}-exercice-${exerciceId}`
    );

  const downloadExerciceMembersPdf = (exerciceId: number, exerciceName: string) =>
    download(
      `exercice-membres-${exerciceId}`,
      ENDPOINTS.BILAN.EXERCICE_MEMBERS_PDF(exerciceId),
      `bilan-membres-exercice-${exerciceName.replace(/\s+/g, '-')}-${exerciceId}`
    );

  return {
    downloading,
    downloadSessionPdf,
    downloadExercicePdf,
    downloadMemberSessionPdf,
    downloadMemberExercicePdf,
    downloadExerciceMembersPdf,
  };
}
