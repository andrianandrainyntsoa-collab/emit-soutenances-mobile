import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import client from '../../api/client';
import {
  Bouton,
  Carte,
  Chargement,
  ChampTexte,
  COULEURS,
  Erreur,
  Etiquette,
  EtiquetteStatut,
  formatDate,
  formatHeure,
  messageApiErreur,
} from '../../components/ui';
import type { Soutenance } from '../../types';

export default function MesSoutenancesJury() {
  const [soutenances, setSoutenances] = useState<Soutenance[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [rafraichit, setRafraichit] = useState(false);

  const charger = useCallback(async () => {
    setErreur(null);
    try {
      const r = await client.get('/mon-espace-enseignant');
      setSoutenances(r.data.soutenances ?? []);
    } catch (e) {
      setErreur(messageApiErreur(e));
      setSoutenances([]);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const nettoyerHistorique = () => {
    Alert.alert(
      'Nettoyer l\'historique',
      'Retirer de votre historique personnel les soutenances terminées ?\n\n' +
        'Vos données officielles (évaluations, résultats, PV) et les données partagées des '
        + 'autres utilisateurs ne sont PAS supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Nettoyer',
          style: 'destructive',
          onPress: async () => {
            setErreur(null);
            try {
              const r = await client.post('/mon-historique/nettoyer', {});
              Alert.alert('Historique nettoyé', r.data?.message ?? 'Nettoyage effectué.');
              charger();
            } catch (e) {
              setErreur(messageApiErreur(e));
            }
          },
        },
      ]
    );
  };

  if (soutenances === null) return <Chargement />;

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

      <Bouton
        label="Nettoyer mon historique"
        variante="secondaire"
        onPress={nettoyerHistorique}
      />

      {soutenances.length === 0 ? (
        <Carte>
          <Text style={styles.texteInfo}>
            Vous n'êtes membre d'aucun jury pour le moment (ou votre historique a été nettoyé).
          </Text>
        </Carte>
      ) : (
        soutenances.map((s) => <CarteSoutenance key={s.id} soutenance={s} onEnregistre={charger} />)
      )}
    </ScrollView>
  );
}

function CarteSoutenance({
  soutenance: s,
  onEnregistre,
}: {
  soutenance: Soutenance;
  onEnregistre: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const monEvaluation = s.evaluations && s.evaluations.length > 0 ? s.evaluations[0] : null;

  const enregistrer = async () => {
    setErreur(null);
    setEnCours(true);
    try {
      await client.post(`/soutenances/${s.id}/evaluations`, {
        note: Number(note),
        commentaire: commentaire || undefined,
      });
      setExpanded(false);
      setNote('');
      setCommentaire('');
      onEnregistre();
    } catch (e) {
      setErreur(messageApiErreur(e));
    } finally {
      setEnCours(false);
    }
  };

  const valider = async () => {
    if (!monEvaluation) return;
    setErreur(null);
    setEnCours(true);
    try {
      await client.post(`/evaluations/${monEvaluation.id}/valider`);
      onEnregistre();
    } catch (e) {
      setErreur(messageApiErreur(e));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Carte>
      <View style={styles.entete}>
        <View style={{ flex: 1 }}>
          <Text style={styles.etudiant}>{s.etudiant?.user?.name ?? 'Étudiant'}</Text>
          <Text style={styles.memoire}>{s.titre_memoire}</Text>
        </View>
        <EtiquetteStatut statut={s.statut} />
      </View>

      <Text style={styles.detail}>
        {formatDate(s.date_soutenance ?? s.creneau?.date_soutenance)} ·{' '}
        {formatHeure(s.heure_debut ?? s.creneau?.heure_debut)}
        {(s.heure_fin ?? s.creneau?.heure_fin)
          ? ` – ${formatHeure(s.heure_fin ?? s.creneau?.heure_fin)}`
          : ''}{' '}— Salle {s.salle?.code ?? '—'}
      </Text>
      <Text style={styles.detailSecondaire}>
        {s.session?.nom ?? 'Session —'} · Jury : {s.jury ? (s.jury.nom ?? s.jury.code) : '—'}
      </Text>

      {monEvaluation ? (
        <View style={styles.maLigne}>
          <Text style={styles.texteInfo}>
            Mon évaluation : {monEvaluation.note}/20{' '}
          </Text>
          {monEvaluation.validee ? (
            <Etiquette texte="Validée" couleur="vert" />
          ) : (
            <Etiquette texte="À valider" couleur="ambre" />
          )}
        </View>
      ) : null}

      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

      <View style={styles.actions}>
        {!monEvaluation ? (
          <Bouton
            label={expanded ? 'Masquer le formulaire' : 'Saisir mon évaluation'}
            variante="primaire"
            onPress={() => setExpanded(!expanded)}
          />
        ) : !monEvaluation.validee ? (
          <Bouton
            label="Valider mon évaluation"
            variante="succes"
            onPress={valider}
            desactive={enCours}
            chargement={enCours}
          />
        ) : (
          <Etiquette texte="Évaluation validée" couleur="vert" />
        )}
      </View>

      {expanded && !monEvaluation ? (
        <View style={styles.formulaire}>
          <ChampTexte
            label="Note (0 — 20)"
            value={note}
            onChangeText={setNote}
            keyboardType="decimal-pad"
            placeholder="ex : 15.5"
          />
          <ChampTexte
            label="Appréciation (optionnelle)"
            value={commentaire}
            onChangeText={setCommentaire}
            multiline
            placeholder="Appréciation sur la prestation de l'étudiant…"
          />
          <Bouton
            label="Enregistrer l'évaluation"
            variante="succes"
            onPress={enregistrer}
            desactive={enCours || !note}
            chargement={enCours}
          />
          <Text style={styles.texteInfo}>
            RG04 : chaque membre du jury saisit puis valide sa propre note. Dès que les trois
            membres ont validé leur note, la moyenne des trois notes devient automatiquement la
            note finale enregistrée dans les résultats, et le PV devient disponible selon le rôle.
          </Text>
        </View>
      ) : null}
    </Carte>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: COULEURS.fond },
  contenu: { padding: 16, paddingBottom: 32 },
  entete: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  etudiant: { fontSize: 15, fontWeight: '700', color: COULEURS.texte },
  memoire: { fontSize: 13, color: COULEURS.texteSecondaire, marginTop: 2 },
  detail: { color: COULEURS.texteSecondaire, fontSize: 12, marginTop: 8 },
  detailSecondaire: { color: COULEURS.texteSecondaire, fontSize: 11, marginTop: 2 },
  maLigne: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  actions: { flexDirection: 'row', marginTop: 12, gap: 10 },
  formulaire: { marginTop: 12, gap: 8 },
  champLabel: { fontSize: 13, fontWeight: '600', color: COULEURS.texte },
  saisie: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  erreur: { color: COULEURS.danger, fontSize: 12, marginTop: 8 },
  texteInfo: { color: COULEURS.texteSecondaire, fontSize: 13 },
});
