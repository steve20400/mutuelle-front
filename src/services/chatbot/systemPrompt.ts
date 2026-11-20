import { ROLE_DISPLAY_NAMES } from '@/src/navigation/roles';
import { formatCurrency } from '@/src/utils/format';
import type { ChatbotContext } from './types';

const fmt = (n: number) => formatCurrency(n);

const today = () =>
  new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

// ─── Section commune ──────────────────────────────────────────────────────────

function sectionIdentity(ctx: ChatbotContext): string {
  const roleLabel = ROLE_DISPLAY_NAMES[ctx.role] ?? ctx.role;
  return `
## Utilisateur connecté
- Nom : ${ctx.fullName}
- Email : ${ctx.email}
- Rôle : ${roleLabel}
- Date : ${today()}
`.trim();
}

// ─── Section session / exercice ───────────────────────────────────────────────

function sectionSession(ctx: ChatbotContext): string {
  const lines: string[] = [];

  if (ctx.exercice) {
    lines.push(`- Exercice en cours : **${ctx.exercice.name}**`);
    lines.push(`  - Début : ${new Date(ctx.exercice.startDate).toLocaleDateString('fr-FR')}`);
    if (ctx.exercice.endDate)
      lines.push(`  - Fin : ${new Date(ctx.exercice.endDate).toLocaleDateString('fr-FR')}`);
    lines.push(`  - Statut : ${ctx.exercice.status}`);
  } else {
    lines.push('- Aucun exercice en cours');
  }

  if (ctx.session) {
    lines.push(`- Session en cours : **${ctx.session.name}**`);
    lines.push(`  - Statut : ${ctx.session.status}`);
    if (ctx.session.startDate)
      lines.push(`  - Début : ${new Date(ctx.session.startDate).toLocaleDateString('fr-FR')}`);
  } else {
    lines.push('- Aucune session en cours');
  }

  return `## Session & Exercice\n${lines.join('\n')}`;
}

// ─── Section config mutuelle ──────────────────────────────────────────────────

function sectionConfig(ctx: ChatbotContext): string {
  if (!ctx.config) return '## Configuration\nNon disponible.';

  const c = ctx.config;
  return `
## Configuration de la mutuelle
- Frais d'inscription : ${fmt(c.registrationFeeAmount)}
- Solidarité par session : ${fmt(c.solidarityFeeAmount)}
- Taux d'intérêt sur emprunt : ${c.loanInterestRatePercent}%
- Pénalité fixe retard emprunt : ${fmt(c.loanPenaltyFixedAmount)}
- Seuil sessions avant pénalité : ${c.loanPenaltySessionThreshold} session(s)
- Seuil insolvabilité : ${c.insolvencyThreshold}%
`.trim();
}

// ─── Section types d'assistance ───────────────────────────────────────────────

function sectionAssistances(ctx: ChatbotContext): string {
  if (!ctx.typesAssistance.length) return '## Types d\'assistance\nAucun type configuré.';

  const list = ctx.typesAssistance
    .map((t) => `- **${t.name}** : ${fmt(t.amount)}${t.description ? ` — ${t.description}` : ''}`)
    .join('\n');

  return `## Types d'assistance disponibles\n${list}`;
}

// ─── Section financière membre ────────────────────────────────────────────────

function sectionMemberFinance(ctx: ChatbotContext): string {
  const p = ctx.memberProfile;
  const a = ctx.account;
  if (!p || !a) return '';

  const inscriptionSolde = a.unpaidRegistrationAmount === 0;
  const solidariteSolde  = a.unpaidSolidarityAmount === 0;
  const hasLoan          = a.borrowAmount > 0;
  const renfSolde        = a.unpaidRenfoulement === 0;

  return `
## Votre situation financière personnelle
- Épargne disponible : **${fmt(a.savingAmount)}**
- Plafond d'emprunt : ${fmt(a.maxBorrow)}
- Emprunt en cours : ${hasLoan ? fmt(a.borrowAmount) : 'Aucun'}

### Cotisations
- Inscription : ${inscriptionSolde ? '✓ Soldée' : `Reste ${fmt(a.unpaidRegistrationAmount)} sur ${fmt(a.baseRegistrationAmount)}`}
- Solidarité : ${solidariteSolde ? '✓ Soldée' : `Reste ${fmt(a.unpaidSolidarityAmount)}`}
- Renflouement dû : ${renfSolde ? '✓ Rien à payer' : fmt(a.unpaidRenfoulement)}

### Statut compte
- Statut mutuelle : ${p.status}
- Membre depuis : ${new Date(p.createdAt).toLocaleDateString('fr-FR')}
`.trim();
}

// ─── Section vue globale (admin / président / trésorier) ─────────────────────

function sectionGlobalStats(ctx: ChatbotContext): string {
  const g = ctx.globalStats;
  return `
## Vue globale de la mutuelle
- Nombre de membres : ${g.totalMembers}
- Transactions totales : ${g.globalTotalTransactions}
- Assistances accordées : ${g.globalTotalAssistances} (${fmt(g.globalTotalAssistanceAmount)})
`.trim();
}

// ─── Règles métier fixes ──────────────────────────────────────────────────────

const BUSINESS_RULES = `
## Règles métier de la mutuelle ENSPY

### Fonctionnement général
La mutuelle ENSPY est une organisation financière collaborative fonctionnant par **sessions** (réunions mensuelles) regroupées en **exercices** (périodes annuelles).

### Épargne
Chaque membre dépose de l'épargne. Elle sert de base au calcul du plafond d'emprunt et génère des intérêts redistribués en fin d'exercice.

### Emprunt
- Un membre peut emprunter un multiple de son épargne (coefficient défini en config)
- L'emprunt déclenche un intérêt (taux en config) redistributé à la mutuelle
- Net perçu : **97%** du montant emprunté — les 3% restants sont redistribués
- Un seul emprunt actif à la fois par membre

### Renflouement
Le renflouement est une contribution calculée automatiquement par le backend en fin d'exercice, basée sur la part des bénéfices à redistribuer entre les membres.

### Solidarité
Chaque membre paie un montant fixe de solidarité par session (montant défini en config). Ce fond sert à financer les assistances.

### Assistance
En cas de sinistre (décès, maladie…), un membre peut bénéficier d'une assistance. Le type et le montant sont prédéfinis. Elle est accordée sur demande en session.

### Statuts membres
- **ACTIF** : À jour dans ses obligations
- **INSOLVABLE** : Retard dans les paiements dépassant le seuil config
- **INACTIF** : Suspendu

### Pénalité sur emprunt
Si un membre n'a pas remboursé son emprunt après le seuil de sessions défini en config, une pénalité fixe est appliquée.
`.trim();

// ─── Directives comportement ──────────────────────────────────────────────────

const DIRECTIVES = `
## Directives
1. Réponds **toujours en français**
2. Utilise les données ci-dessus pour des réponses **personnalisées et précises**
3. Affiche les montants au format FCFA (ex : 50 000 FCFA)
4. Structure tes réponses avec du Markdown léger (gras, listes, titres ##)
5. Sois professionnel, bienveillant et concis
6. Ne partage que les données correspondant au rôle de l'utilisateur
7. Si une information manque, dis-le clairement et propose une alternative
8. Tu n'as PAS accès aux détails des autres membres si l'utilisateur est un MEMBER
`.trim();

// ─── Génération finale ────────────────────────────────────────────────────────

export function generateSystemPrompt(ctx: ChatbotContext): string {
  const sections: string[] = [
    '# Assistant IA — Mutuelle ENSPY\nTu es l\'assistant intelligent de la mutuelle ENSPY.',
    sectionIdentity(ctx),
    sectionSession(ctx),
    sectionConfig(ctx),
    sectionAssistances(ctx),
  ];

  // Données personnelles pour les membres
  if (ctx.role === 'MEMBER') {
    const fin = sectionMemberFinance(ctx);
    if (fin) sections.push(fin);
  } else {
    // Vue globale pour les rôles admin
    sections.push(sectionGlobalStats(ctx));
  }

  sections.push(BUSINESS_RULES);
  sections.push(DIRECTIVES);

  return sections.join('\n\n');
}
