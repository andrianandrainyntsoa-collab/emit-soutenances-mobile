import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import client from '../../api/client';
import {
  alerter,
  Bouton,
  Carte,
  Chargement,
  COULEURS,
  Erreur,
  Etiquette,
  EtiquetteStatut,
  messageApiErreur,
} from '../../components/ui';
import type { Evaluation } from '../../types';

export default function MesEvaluationsJury() {
  const [evaluations, setEvaluations] = useState<Evaluation[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setErreur(null);
    try {
      const r = await client.get('/evaluations');
      setEvaluations(r.data);
    } catch (e) {
      setErreur(messageApiErreur(e));
      setEvaluations([]);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  if (evaluations === null) return <Chargement />;

  const valider = async (e: Evaluation) => {
    try {
      const r = await client.post(`/evaluations/${e.id}/valider`);
      const message: string | undefined = r.data?.message;
      if (r.data?.resultat_finalise) {
        // CORRECTION : alerter (et non Alert.alert) pour que le message
        // soit visible aussi dans le navigateur (Expo web).
        alerter(
          'Résultat finalisé',
          `${message ?? 'La moyenne des trois notes validées a été enregistrée comme note finale.'}\nNote finale : ${r.data?.resultat?.moyenne_finale ?? '—'}/20`
        );
      }
      charger();
    } catch (err) {
      alerter('Erreur', messageApiErreur(err));
    }
  };

  return (
    <ScrollView style={styles.ecran} contentContainerStyle={styles.contenu}>
      <Erreur message={erreur} />
      {evaluations.length === 0 ? (
        <Carte>
          <Text style={styles.texteInfo}>Aucune évaluation enregistrée.</Text>
        </Carte>
      ) : (
        evaluations.map((e) => (
          <Carte key={e.id}>
            <View style={styles.entete}>
              <View style={{ flex: 1 }}>
                <Text style={styles.etudiant}>{e.soutenance?.etudiant?.user?.name ?? '—'}</Text>
                <Text style={styles.memoire}>{e.soutenance?.titre_memoire}</Text>
              </View>
              {e.soutenance ? <EtiquetteStatut statut={e.soutenance.statut} /> : null}
            </View>
            <View style={styles.ligne}>
              <Text style={styles.note}>{e.note}/20</Text>
              {e.validee ? (
                <Etiquette texte="Validée" couleur="vert" />
              ) : (
                <Bouton label="Valider" variante="succes" petit onPress={() => valider(e)} />
              )}
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
  entete: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  etudiant: { fontSize: 15, fontWeight: '700', color: COULEURS.texte },
  memoire: { fontSize: 12, color: COULEURS.texteSecondaire, marginTop: 2 },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  note: { fontSize: 17, fontWeight: '800', color: COULEURS.primaire },
  texteInfo: { color: COULEURS.texteSecondaire, fontSize: 13 },
});
