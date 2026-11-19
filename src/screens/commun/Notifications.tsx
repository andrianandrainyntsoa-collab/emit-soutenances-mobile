import React, { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import {
  Bouton,
  Carte,
  Chargement,
  COULEURS,
  confirmer,
  Erreur,
  Etiquette,
  PressableIcon,
  Succes,
  formatDateHeure,
  messageApiErreur,
} from '../../components/ui';

interface NotificationItem {
  id: number;
  titre: string;
  message: string;
  type?: string | null;
  lue_le?: string | null;
  created_at: string;
}

const LIBELLES_TYPE: Record<string, [string, string]> = {
  compte: ['Compte', 'slate'],
  planification: ['Planification', 'bleu'],
  convocation: ['Convocation', 'violet'],
  evaluation: ['Évaluation', 'ambre'],
  deliberation: ['Délibération', 'ambre'],
  resultat: ['Résultat', 'vert'],
  proces_verbal: ['Procès-verbal', 'bleu'],
  autorisation: ['Autorisation', 'vert'],
};

/**
 * Notifications (mobile — écran commun étudiant / jury).
 *
 * NOUVEAU : la section Notifications est désormais disponible dans
 * l'application mobile. Chaque notification peut être marquée comme
 * lue (tap sur la carte) ou SUPPRIMÉE (bouton corbeille). Les actions
 * globales « Tout marquer comme lu » et « Tout supprimer » sont
 * également disponibles. La suppression ne concerne que les
 * notifications de l'utilisateur connecté (contrôle côté serveur).
 */
export default function Notifications() {
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [rafraichit, setRafraichit] = useState(false);
  const [suppressionEnCours, setSuppressionEnCours] = useState<number | null>(null);

  const charger = useCallback(async () => {
    setErreur(null);
    try {
      const r = await client.get('/notifications');
      setItems(r.data.notifications ?? []);
    } catch (e) {
      setErreur(messageApiErreur(e));
      setItems([]);
    }
  }, []);

  // Recharge à chaque ouverture de l'onglet (badge et liste à jour).
  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger])
  );

  if (items === null) return <Chargement />;

  const marquerLue = async (n: NotificationItem) => {
    if (n.lue_le) return;
    try {
      await client.post(`/notifications/${n.id}/lue`);
      charger();
    } catch (e) {
      setErreur(messageApiErreur(e));
    }
  };

  const toutMarquer = async () => {
    try {
      await client.post('/notifications/tout-marquer-lues');
      setSucces('Toutes les notifications sont marquées comme lues.');
      charger();
    } catch (e) {
      setErreur(messageApiErreur(e));
    }
  };

  const supprimerUne = async (n: NotificationItem) => {
    setErreur(null);
    setSucces(null);
    setSuppressionEnCours(n.id);
    try {
      const r = await client.delete(`/notifications/${n.id}`);
      setSucces(r.data?.message ?? 'Notification supprimée.');
      charger();
    } catch (e) {
      setErreur(messageApiErreur(e));
    } finally {
      setSuppressionEnCours(null);
    }
  };

  const supprimerToutes = async () => {
    // CORRECTION : Alert.alert avec boutons n'est pas rendu dans le
    // navigateur (Expo web) — la confirmation « ne répondait pas ».
    // L'aide `confirmer` utilise window.confirm sur web.
    const ok = await confirmer(
      'Tout supprimer',
      'Supprimer TOUTES vos notifications ? Cette action est définitive.'
    );

    if (!ok) return;

    setErreur(null);
    try {
      const r = await client.delete('/notifications');
      setSucces(r.data?.message ?? 'Notifications supprimées.');
      charger();
    } catch (e) {
      setErreur(messageApiErreur(e));
    }
  };

  return (
    <ScrollView
      style={styles.ecran}
      contentContainerStyle={styles.contenu}
      refreshControl={
        <RefreshControl
          refreshing={rafraichit}
          onRefresh={async () => {
            setRafraichit(true);
            await charger();
            setRafraichit(false);
          }}
        />
      }
    >
      <Erreur message={erreur} />
      <Succes message={succes} />

      <View style={styles.actionsGlobales}>
        <Bouton label="Tout marquer comme lu" variante="secondaire" petit onPress={toutMarquer} />
        <Bouton label="Tout supprimer" variante="danger" petit onPress={supprimerToutes} desactive={items.length === 0} />
      </View>

      {items.length === 0 ? (
        <Carte>
          <Text style={styles.texteInfo}>
            Aucune notification pour le moment. Vous y retrouverez ce qui vous
            concerne : planification et confirmation de soutenance,
            convocations, validation des notes, résultat final, procès-verbal,
            autorisation à soutenir, création de votre compte… selon votre rôle.
          </Text>
        </Carte>
      ) : (
        items.map((n) => {
          const [texteType, couleurType] = LIBELLES_TYPE[n.type ?? ''] ?? [null, null];
          const nonLue = !n.lue_le;

          return (
            <Carte key={n.id} style={nonLue ? styles.carteNonLue : undefined}>
              <View style={styles.entete}>
                <Text
                  style={[styles.titre, nonLue ? styles.titreNonLue : null]}
                  onPress={() => marquerLue(n)}
                >
                  {n.titre}
                </Text>
                {texteType ? <Etiquette texte={texteType} couleur={couleurType as any} /> : null}
                {nonLue ? <Etiquette texte="Nouveau" couleur="bleu" /> : null}
                <PressableIcon
                  libelle="Supprimer cette notification"
                  chargement={suppressionEnCours === n.id}
                  onPress={() => supprimerUne(n)}
                />
              </View>
              <Text style={styles.message} onPress={() => marquerLue(n)}>
                {n.message}
              </Text>
              <Text style={styles.date}>{formatDateHeure(n.created_at)}</Text>
            </Carte>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: COULEURS.fond },
  contenu: { padding: 16, paddingBottom: 32 },
  actionsGlobales: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  carteNonLue: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  entete: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  titre: { flex: 1, minWidth: 120, fontSize: 15, fontWeight: '700', color: COULEURS.texte },
  titreNonLue: { color: '#1d4ed8' },
  message: { color: COULEURS.texteSecondaire, fontSize: 13, lineHeight: 19, marginTop: 4 },
  date: { color: '#94a3b8', fontSize: 11, marginTop: 6 },
  texteInfo: { color: COULEURS.texteSecondaire, fontSize: 13, lineHeight: 20 },
});
