import type { TransactionType } from '@/src/types';

export const TYPE_LABELS: Record<TransactionType, string> = {
  INSCRIPTION:            'Inscription',
  EPARGNE:                'Epargne',
  SOLIDARITE:             'Solidarite',
  EMPRUNT:                'Emprunt',
  REMBOURSSEMENT:         'Remboursement',
  RENFOULEMENT:           'Renflouement',
  RENFOULEMENT_INSCRIPTION: 'Renflouement Inscription',
  RENFOULEMENT_SOLIDARITE:  'Renflouement Solidarite',
  INTERET:                'Interet',
  ASSISTANCE:             'Assistance',
  AGAPE:                  'Agape',
  PENALITE:               'Penalite',
};

export const TYPE_ICONS: Record<TransactionType, string> = {
  INSCRIPTION:            'person-add-outline',
  EPARGNE:                'wallet-outline',
  SOLIDARITE:             'heart-outline',
  EMPRUNT:                'cash-outline',
  REMBOURSSEMENT:         'return-down-back-outline',
  RENFOULEMENT:           'refresh-outline',
  RENFOULEMENT_INSCRIPTION: 'refresh-outline',
  RENFOULEMENT_SOLIDARITE:  'refresh-outline',
  INTERET:                'trending-up-outline',
  ASSISTANCE:             'medical-outline',
  AGAPE:                  'gift-outline',
  PENALITE:               'warning-outline',
};

export const ALL_TYPES = Object.keys(TYPE_LABELS) as TransactionType[];

export type TransactionGroupKey = 'GROUP_INSCRIPTION' | 'GROUP_SOLIDARITE' | 'GROUP_EPARGNE' | 'GROUP_ASSISTANCE';

export interface TransactionGroup {
  key: TransactionGroupKey;
  label: string;
  icon: string;
  types: TransactionType[];
}

export const TRANSACTION_GROUPS: TransactionGroup[] = [
  {
    key: 'GROUP_INSCRIPTION',
    label: 'Inscription',
    icon: 'person-add-outline',
    types: ['INSCRIPTION', 'AGAPE'],
  },
  {
    key: 'GROUP_SOLIDARITE',
    label: 'Solidarité & Renflouement',
    icon: 'heart-outline',
    types: ['SOLIDARITE', 'RENFOULEMENT'],
  },
  {
    key: 'GROUP_EPARGNE',
    label: 'Epargne & Finances',
    icon: 'wallet-outline',
    types: ['EPARGNE', 'EMPRUNT', 'REMBOURSSEMENT', 'INTERET', 'PENALITE'],
  },
  {
    key: 'GROUP_ASSISTANCE',
    label: 'Assistance',
    icon: 'medical-outline',
    types: ['ASSISTANCE'],
  },
];
