import type { BackendRole } from '@/src/types';

export interface TabItem {
  name: string;
  label: string;
  iconName: string;
  iconNameFocused: string;
}

// Onglet chatbot — visible pour tous les rôles
const CHATBOT_TAB: TabItem = {
  name: 'chatbot',
  label: 'Assistant',
  iconName: 'chatbubble-ellipses-outline',
  iconNameFocused: 'chatbubble-ellipses',
};

// Onglets admin/president/tresorier
const ADMIN_TABS: TabItem[] = [
  { name: 'dashboard',    label: 'Accueil',      iconName: 'home-outline',     iconNameFocused: 'home' },
  { name: 'assistances',  label: 'Assistance',   iconName: 'heart-outline',    iconNameFocused: 'heart' },
  { name: 'renfoulement', label: 'Renflouement', iconName: 'refresh-outline',  iconNameFocused: 'refresh' },
  { name: 'parametres',   label: 'Parametres',   iconName: 'settings-outline', iconNameFocused: 'settings' },
  CHATBOT_TAB,
];

// Onglets membre
const MEMBER_TABS: TabItem[] = [
  { name: 'dashboard',    label: 'Accueil',      iconName: 'home-outline',        iconNameFocused: 'home' },
  { name: 'mes-finances', label: 'Mes finances', iconName: 'wallet-outline',      iconNameFocused: 'wallet' },
  { name: 'historique',   label: 'Historique',   iconName: 'time-outline',        iconNameFocused: 'time' },
  { name: 'mon-compte',   label: 'Mon compte',   iconName: 'person-outline',      iconNameFocused: 'person' },
  CHATBOT_TAB,
];

export const ALL_TABS: TabItem[] = [...ADMIN_TABS, ...MEMBER_TABS].filter(
  (tab, i, arr) => arr.findIndex((t) => t.name === tab.name) === i
);

export const TABS_BY_ROLE: Record<BackendRole, string[]> = {
  SUPER_ADMIN: ['dashboard', 'assistances', 'renfoulement', 'parametres', 'chatbot'],
  ADMIN:       ['dashboard', 'assistances', 'renfoulement', 'parametres', 'chatbot'],
  PRESIDENT:   ['dashboard', 'assistances', 'renfoulement', 'parametres', 'chatbot'],
  TRESORIER:   ['dashboard', 'assistances', 'renfoulement', 'parametres', 'chatbot'],
  MEMBER:      ['dashboard', 'mes-finances', 'historique', 'mon-compte', 'chatbot'],
};

export function getTabsForRole(role: BackendRole | null): TabItem[] {
  if (!role) return [];
  const allowedNames = TABS_BY_ROLE[role] ?? [];
  return ALL_TABS.filter((tab) => allowedNames.includes(tab.name));
}

export function isTabVisible(tabName: string, role: BackendRole | null): boolean {
  if (!role) return false;
  return TABS_BY_ROLE[role]?.includes(tabName) ?? false;
}
