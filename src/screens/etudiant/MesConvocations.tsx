import React, { useCallback, useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import client, { telechargerPdf } from '../../api/client';
import * as Sharing from 'expo-sharing';
import {
  alerter,
  Bouton,
  Carte,
  Chargement,
  COULEURS,
  Erreur,
  Etiquette,
  formatDate,
  formatHeure,
  messageApiErreur,
} from '../../components/ui';
import type { Convocation } from '../../types';

/**
 * Mes convocations (étudiant — mobile).
 *
 * CORRECTION : le bouton « Ouvrir le PDF » ne répondait plus parce que
 * l'écran importait une fonction `urlDocument` qui n'existait plus
 * dans `api/client.ts`. L'ouverture passe désormais par le même
 * mécanisme éprouvé que l'écran « Résultat & PV » : téléchargement
 * authentifié via expo-file-system puis ouverture / partage via
 * expo-sharing (mobile natif), téléchargement direct du navigateur
 * via une requête API authentifiée (Expo web). Les erreurs (session expirée,
 * document introuvable, accès interdit) sont affichées explicitement
 * au lieu d'échouer en silence.
 */
export default function MesConvocations() {
  const [convocations, setConvocations] = useState<Convocation[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<number | null>(null);

  const charger = useCallback(async () => {
    setErreur(null);
    try {
      const r = await client.get('/mes-convocations');
      setConvocations(r.data);
    } catch (e) {
      setErreur(messageApiErreur(e));
      setConvocations([]);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  if (convocations === null) return <Chargement />;

  const ouvrirPdf = async (c: Convocation) => {
    setEnCours(c.id);
    try {
      const uri = await telechargerPdf(
        `/convocations/${c.id}/telecharger`,
        `convocation-${c.id}.pdf`
      );

      // Sur web, le téléchargement navigateur est déjà déclenché par
      // telechargerPdf (Content-Disposition: attachment).
      if (Platform.OS === 'web') {
        return;
      }

      const disponible = await Sharing.isAvailableAsync();

      if (disponible) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Ouvrir ma convocation',
          UTI: 'com.adobe.pdf',
        });
      } else {
        alerter(
          'Téléchargement terminé',
          'La convocation a été enregistrée dans le stockage de l’application.'
        );
      }
    } catch (e) {
      alerter('Erreur', messageApiErreur(e));
    } finally {
      setEnCours(null);
    }
  };

  return (
    <ScrollView
      style={styles.ecran}
      contentContainerStyle={styles.contenu}
    >
      <Erreur message={erreur} />
      {convocations.length === 0 ? (
        <Carte>
          <Text style={styles.texteInfo}>
            Votre convocation sera disponible dès que votre soutenance sera
            planifiée et confirmée.
          </Text>
        </Carte>
      ) : (
        convocations.map((c) => (
          <Carte key={c.id}>
            <View style={styles.entete}>
              <Text style={styles.titre}>{c.soutenance?.titre_memoire ?? 'Soutenance'}</Text>
              <Etiquette
                texte={
                  c.statut === 'envoyee' ? 'Envoyée' : c.statut === 'consultee' ? 'Consultée' : 'Générée'
                }
                couleur={c.statut === 'envoyee' ? 'bleu' : c.statut === 'consultee' ? 'violet' : 'ambre'}
              />
            </View>
            <Text style={styles.detail}>
              {formatDate(c.soutenance?.creneau?.date_soutenance)} à{' '}
              {formatHeure(c.soutenance?.creneau?.heure_debut)} — Salle{' '}
              {c.soutenance?.salle?.code ?? '—'}
            </Text>
            <View style={styles.actions}>
              <Bouton
                label="Ouvrir le PDF"
                variante="primaire"
                onPress={() => ouvrirPdf(c)}
                desactive={enCours === c.id}
                chargement={enCours === c.id}
              />
            </View>
          </Carte>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: COULEURS.fond },
  contenu: { padding: 16, paddingBottom: 32 },
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  titre: { flex: 1, fontSize: 15, fontWeight: '700', color: COULEURS.texte },
  detail: { color: COULEURS.texteSecondaire, fontSize: 13, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  texteInfo: { color: COULEURS.texteSecondaire, fontSize: 13, lineHeight: 20 },
});
