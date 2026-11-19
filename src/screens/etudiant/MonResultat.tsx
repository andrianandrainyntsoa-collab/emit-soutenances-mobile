import React, { useCallback, useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  formatDateHeure,
  messageApiErreur,
} from '../../components/ui';
import type { ProcesVerbal, Resultat } from '../../types';

export default function MonResultat() {
  const [resultat, setResultat] = useState<Resultat | null | undefined>(undefined);
  const [pvs, setPvs] = useState<ProcesVerbal[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setErreur(null);
    try {
      const r = await client.get('/mon-resultat');
      setResultat(r.data.resultat);
      const p = await client.get('/mon-proces-verbal');
      setPvs(p.data.proces_verbaux ?? []);
    } catch (e) {
      setErreur(messageApiErreur(e));
      setResultat(null);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  if (resultat === undefined) return <Chargement />;

const ouvrirPv = async (pv: ProcesVerbal) => {
  try {
    const uri = await telechargerPdf(
      `/mes-pv/${pv.id}/telecharger`,
      `PV-${pv.numero_pv}.pdf`
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
        dialogTitle: 'Ouvrir mon procès-verbal',
        UTI: 'com.adobe.pdf',
      });
    } else {
      alerter(
        'Téléchargement terminé',
        'Le PDF a été enregistré dans le stockage de l’application.'
      );
    }
  } catch (e) {
    alerter('Erreur', messageApiErreur(e));
  }
};

  return (
    <ScrollView style={styles.ecran} contentContainerStyle={styles.contenu}>
      <Erreur message={erreur} />

      {!resultat ? (
        <Carte>
          <Text style={styles.texteInfo}>
            Aucun résultat disponible pour le moment. Il sera publié automatiquement dès que les
            trois membres du jury auront chacun validé leur note : la moyenne des trois notes
            validées constituera votre note finale.
          </Text>
        </Carte>
      ) : (
        <Carte titre="Mon résultat final">
          <View style={styles.noteBloc}>
            <Text style={styles.noteValeur}>{resultat.moyenne_finale ?? '—'}/20</Text>
            <Text style={styles.noteMention}>{resultat.mention ?? '—'}</Text>
          </View>
          <View style={styles.ligne}>
            <Text style={styles.label}>Décision</Text>
            <Text style={styles.valeur}>{resultat.decision}</Text>
          </View>
          <View style={styles.ligne}>
            <Text style={styles.label}>Statut</Text>
            {resultat.valide_le ? (
              <Etiquette texte={`Validé le ${formatDateHeure(resultat.valide_le)}`} couleur="vert" />
            ) : (
              <Etiquette texte="En attente de validation" couleur="ambre" />
            )}
          </View>
        </Carte>
      )}

      <Carte titre="Mon procès-verbal">
        {pvs.length === 0 ? (
          <Text style={styles.texteInfo}>
            Le procès-verbal sera disponible une fois le résultat finalisé et le
            document généré par le président du jury.
          </Text>
        ) : (
          pvs.map((pv) => (
            <View key={pv.id} style={styles.pvBloc}>
              <Text style={styles.pvNumero}>{pv.numero_pv}</Text>
              <Etiquette
                texte={pv.type_master === 'recherche' ? 'Master Recherche' : 'Master Professionnel'}
                couleur={pv.type_master === 'recherche' ? 'violet' : 'bleu'}
              />
              <View style={styles.actions}>
                <Bouton label="Télécharger le PV" variante="primaire" onPress={() => ouvrirPv(pv)} />
              </View>
            </View>
          ))
        )}
      </Carte>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: COULEURS.fond },
  contenu: { padding: 16, paddingBottom: 32 },
  noteBloc: { alignItems: 'center', paddingVertical: 10 },
  noteValeur: { fontSize: 34, fontWeight: '800', color: COULEURS.primaire },
  noteMention: { fontSize: 15, color: COULEURS.texteSecondaire, marginTop: 2 },
  ligne: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COULEURS.bordure,
  },
  label: { color: COULEURS.texteSecondaire, fontSize: 13 },
  valeur: { color: COULEURS.texte, fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  pvBloc: { marginBottom: 12, gap: 6 },
  pvNumero: { fontSize: 14, fontWeight: '700', color: COULEURS.texte },
  actions: { marginTop: 4 },
  texteInfo: { color: COULEURS.texteSecondaire, fontSize: 13, lineHeight: 20 },
});
