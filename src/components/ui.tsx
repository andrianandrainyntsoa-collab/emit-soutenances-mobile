import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';

// Thème officiel de l'école : bleu foncé (EMIT)
const COULEURS = {
  primaire: '#0a1e33',
  primaireClair: '#173a60',
  accent: '#3f88c5',
  fond: '#f1f5f9',
  carte: '#ffffff',
  texte: '#1e293b',
  texteSecondaire: '#64748b',
  bordure: '#e2e8f0',
  succes: '#059669',
  danger: '#dc2626',
};

export { COULEURS };

export function Carte({
  titre,
  children,
  style,
}: {
  titre?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.carte, style]}>
      {titre ? <Text style={styles.carteTitre}>{titre}</Text> : null}
      {children}
    </View>
  );
}

export function Bouton({
  label,
  onPress,
  variante = 'primaire',
  desactive,
  chargement,
  petit,
}: {
  label: string;
  onPress: () => void;
  variante?: 'primaire' | 'secondaire' | 'succes' | 'danger';
  desactive?: boolean;
  chargement?: boolean;
  petit?: boolean;
}) {
  const fonds: Record<string, string> = {
    primaire: COULEURS.primaire,
    secondaire: COULEURS.bordure,
    succes: COULEURS.succes,
    danger: COULEURS.danger,
  };
  const textes: Record<string, string> = {
    primaire: '#fff',
    secondaire: COULEURS.texte,
    succes: '#fff',
    danger: '#fff',
  };
  return (
    <Pressable
      onPress={onPress}
      disabled={desactive || chargement}
      style={({ pressed }) => [
        styles.bouton,
        { backgroundColor: fonds[variante], opacity: pressed ? 0.85 : 1 },
        (desactive || chargement) && { opacity: 0.5 },
        petit && { paddingVertical: 8, paddingHorizontal: 12 },
      ]}
    >
      {chargement ? (
        <ActivityIndicator color={textes[variante]} />
      ) : (
        <Text style={[styles.boutonTexte, { color: textes[variante] }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/**
 * Petit bouton d'action discret (corbeille « Supprimer » des
 * notifications) : libellé court, rouge au survol / appui.
 */
export function PressableIcon({
  libelle,
  onPress,
  chargement,
}: {
  libelle: string;
  onPress: () => void;
  chargement?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={chargement}
      hitSlop={8}
      style={({ pressed }) => [
        styles.pressableIcon,
        (pressed || chargement) && { opacity: 0.6 },
      ]}
    >
      {chargement ? (
        <ActivityIndicator size="small" color={COULEURS.danger} />
      ) : (
        <Text style={styles.pressableIconTexte}>Supprimer</Text>
      )}
    </Pressable>
  );
}

export function Etiquette({ texte, couleur = 'slate' }: { texte: string; couleur?: string }) {
  const fonds: Record<string, string> = {
    slate: '#e2e8f0',
    bleu: '#dbeafe',
    vert: '#d1fae5',
    rouge: '#fee2e2',
    ambre: '#fef3c7',
    violet: '#ede9fe',
  };
  const textes: Record<string, string> = {
    slate: '#475569',
    bleu: '#1d4ed8',
    vert: '#047857',
    rouge: '#b91c1c',
    ambre: '#92400e',
    violet: '#6d28d9',
  };
  return (
    <View style={[styles.etiquette, { backgroundColor: fonds[couleur] ?? fonds.slate }]}>
      <Text style={[styles.etiquetteTexte, { color: textes[couleur] ?? textes.slate }]}>
        {texte}
      </Text>
    </View>
  );
}

const LIBELLES_STATUT: Record<string, [string, string]> = {
  a_planifier: ['À planifier', 'slate'],
  planifiee: ['Planifiée', 'bleu'],
  confirmee: ['Confirmée', 'violet'],
  terminee: ['Terminée', 'vert'],
  annulee: ['Annulée', 'rouge'],
  ajournee: ['Ajournée', 'ambre'],
};

export function EtiquetteStatut({ statut }: { statut: string }) {
  const [libelle, couleur] = LIBELLES_STATUT[statut] ?? [statut, 'slate'];
  return <Etiquette texte={libelle} couleur={couleur} />;
}

export function ChampTexte({
  label,
  value,
  onChangeText,
  secure,
  keyboardType,
  multiline,
  placeholder,
  autoCapitalize,
}: {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  secure?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'decimal-pad' | 'phone-pad' | 'number-pad';
  multiline?: boolean;
  placeholder?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={styles.champBloc}>
      {label ? <Text style={styles.champLabel}>{label}</Text> : null}
      <TextInput
        style={[styles.champ, multiline && { height: 90, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor={COULEURS.texteSecondaire}
        autoCapitalize={autoCapitalize ?? 'none'}
      />
    </View>
  );
}

export function Chargement({ texte = 'Chargement…' }: { texte?: string }) {
  return (
    <View style={styles.chargement}>
      <ActivityIndicator size="large" color={COULEURS.primaire} />
      <Text style={styles.chargementTexte}>{texte}</Text>
    </View>
  );
}

export function Erreur({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.erreur}>
      <Text style={styles.erreurTexte}>{message}</Text>
    </View>
  );
}

export function Succes({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.succes}>
      <Text style={styles.succesTexte}>{message}</Text>
    </View>
  );
}

export function messageApiErreur(e: any): string {
  const r = e?.response?.data;
  if (r?.errors) {
    return Object.values(r.errors).flat().join(' ');
  }
  return r?.message ?? e?.message ?? 'Une erreur est survenue.';
}

/**
 * CORRECTION (boutons inopérants dans le navigateur) : `Alert.alert`
 * de React Native n'est pas rendu dans le navigateur (Expo web) —
 * les messages d'erreur et les confirmations « ne répondaient pas ».
 * Ces aides affichent les mêmes dialogues sur natif et passent par
 * `window.alert` / `window.confirm` sur web.
 */

/** Affiche un message d'information ou d'erreur. */
export function alerter(titre: string, message?: string): void {
  if (Platform.OS === 'web') {
    window.alert(message ? `${titre}\n\n${message}` : titre);
    return;
  }

  Alert.alert(titre, message);
}

/** Demande une confirmation (retourne true si confirmée). */
export function confirmer(titre: string, message: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${titre}\n\n${message}`));
  }

  return new Promise((resolve) => {
    Alert.alert(titre, message, [
      { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Confirmer', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

export function formatDate(d?: string | null): string {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString('fr-FR');
}

export function formatHeure(h?: string | null): string {
  if (!h) return '—';
  return h.substring(0, 5);
}

export function formatDateHeure(d?: string | null): string {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return `${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

const styles = StyleSheet.create({
  carte: {
    backgroundColor: COULEURS.carte,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    gap: 8,
    elevation: 1,
  },
  carteTitre: {
    fontSize: 15,
    fontWeight: '700',
    color: COULEURS.texte,
  },
  bouton: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boutonTexte: { fontSize: 15, fontWeight: '600' },
  etiquette: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  etiquetteTexte: { fontSize: 12, fontWeight: '600' },
  champBloc: { marginBottom: 12 },
  champLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COULEURS.texte,
    marginBottom: 6,
  },
  champ: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COULEURS.bordure,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COULEURS.texte,
  },
  chargement: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  chargementTexte: { color: COULEURS.texteSecondaire },
  erreur: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  erreurTexte: { color: '#b91c1c', fontSize: 13 },
  succes: {
    backgroundColor: '#d1fae5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  succesTexte: { color: '#047857', fontSize: 13 },
  pressableIcon: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  pressableIconTexte: { color: '#b91c1c', fontSize: 12, fontWeight: '600' },
});
