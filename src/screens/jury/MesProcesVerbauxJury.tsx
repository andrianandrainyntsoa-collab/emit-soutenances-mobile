import React, { useCallback, useState } from 'react';
import {
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client, { telechargerPdf } from '../../api/client';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../../context/AuthContext';
import {
  alerter,
  Bouton,
  Carte,
  Chargement,
  COULEURS,
  Erreur,
  Etiquette,
  EtiquetteStatut,
  Succes,
  formatDateHeure,
  messageApiErreur,
} from '../../components/ui';
import type { ProcesVerbal, Resultat } from '../../types';

interface ResultatListe {
  id: number;
  moyenne_finale?: string | null;
  decision: string;
  mention?: string | null;
  valide_le?: string | null;
  procesVerbal?: ProcesVerbal | null;
  proces_verbal?: ProcesVerbal | null;
  soutenance?: {
    titre_memoire?: string;
    statut?: string;
    etudiant?: { user?: { name?: string }; numero_etudiant?: string };
    jury?: {
      nom?: string | null;
      code?: string;
      membresJury?: {
        id: number;
        fonction: string;
        enseignant?: { user_id?: number; user?: { name?: string } };
      }[];
    };
  } | null;
}

/**
 * Procès-verbaux (espace jury — mobile).
 *
 * NOUVEAU : le président du jury peut DÉSORMAIS générer le
 * procès-verbal directement depuis l'application mobile, après
 * validation des trois évaluations (RG11 : seul le président du jury
 * peut générer le PV, après finalisation du résultat). Le PDF est
 * ensuite téléchargeable par les personnes autorisées (RG14) : le
 * président et les membres du jury concernés ici, l'étudiant depuis
 * son onglet « Résultat & PV », l'administration / le responsable
 * depuis l'application web.
 */
export default function MesProcesVerbauxJury() {
  const { user } = useAuth();
  const [resultats, setResultats] = useState<ResultatListe[] | null>(null);
  const [pvs, setPvs] = useState<ProcesVerbal[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [rafraichit, setRafraichit] = useState(false);
  const [enCours, setEnCours] = useState<number | null>(null);
  const [telechargementEnCours, setTelechargementEnCours] = useState<number | null>(null);
  // Sur web (Expo web), Alert.alert avec boutons n'est pas rendu :
  // le choix du type de Master se fait via des boutons affichés
  // directement dans la carte (état ci-dessous).
  const [choixType, setChoixType] = useState<ResultatListe | null>(null);

  const charger = useCallback(async () => {
    setErreur(null);
    try {
      const r = await client.get<{ data: ResultatListe[] }>('/resultats');
      setResultats(r.data.data ?? []);
      const p = await client.get('/proces-verbaux');
      setPvs(p.data?.data ?? []);
    } catch (e) {
      setErreur(messageApiErreur(e));
      setResultats([]);
      setPvs([]);
    }
  }, []);

  // Recharge à chaque ouverture de l'onglet.
  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger])
  );

  if (resultats === null || pvs === null) return <Chargement />;

  const generer = (r: ResultatListe) => {
    // Sur web, Alert.alert avec boutons n'est pas rendu dans le
    // navigateur : on affiche le choix du type de Master directement
    // dans la carte (plus lisible qu'une suite de confirmations).
    if (Platform.OS === 'web') {
      setChoixType(r);
      return;
    }

    Alert.alert(
      'Générer le procès-verbal',
      'Choisissez le type de Master (RG19) pour le PV de ' +
        (r.soutenance?.etudiant?.user?.name ?? 'cet étudiant') + ' :',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Master Recherche',
          onPress: () => envoyerGeneration(r, 'recherche'),
        },
        {
          text: 'Master Professionnel',
          onPress: () => envoyerGeneration(r, 'professionnel'),
        },
      ]
    );
  };

  const envoyerGeneration = async (r: ResultatListe, typeMaster: string) => {
    setErreur(null);
    setSucces(null);
    setEnCours(r.id);
    try {
      const rep = await client.post(`/resultats/${r.id}/proces-verbal`, {
        type_master: typeMaster,
      });
      setSucces(
        (rep.data?.message ?? 'Procès-verbal généré avec succès.') +
          ' Il est désormais téléchargeable ci-dessous.'
      );
      await charger();
    } catch (e) {
      alerter('Génération impossible', messageApiErreur(e));
    } finally {
      setEnCours(null);
    }
  };

  const telechargerPv = async (pv: ProcesVerbal) => {
    setErreur(null);
    setTelechargementEnCours(pv.id);
    try {
      const uri = await telechargerPdf(
        `/proces-verbaux/${pv.id}/telecharger`,
        `${pv.numero_pv}.pdf`
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
          dialogTitle: 'Ouvrir le procès-verbal',
          UTI: 'com.adobe.pdf',
        });
      } else {
        alerter(
          'Téléchargement terminé',
          'Le PV a été enregistré dans le stockage de l’application.'
        );
      }
    } catch (e) {
      alerter('Erreur', messageApiErreur(e));
    } finally {
      setTelechargementEnCours(null);
    }
  };

  // Résultats finalisés sans PV encore généré : génération possible
  // uniquement par le président du jury (contrôlée aussi côté API).
  const aGenerer = resultats.filter(
    (r) => r.valide_le && !(r.procesVerbal ?? r.proces_verbal)
  );

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

      {/* -------- Section génération (président du jury) -------- */}
      <Text style={styles.sectionTitre}>Générer un procès-verbal</Text>
      <Text style={styles.sectionInfo}>
        Dès que les trois membres du jury ont validé leur note, le résultat est
        finalisé. Le président du jury peut alors générer le procès-verbal
        directement ici, puis le télécharger.
      </Text>

      {aGenerer.length === 0 ? (
        <Carte>
          <Text style={styles.texteInfo}>
            Aucun PV à générer pour le moment : les résultats finalisés sans
            procès-verbal apparaîtront ici (résultats visibles uniquement pour
            les jurys dont vous êtes membre).
          </Text>
        </Carte>
      ) : (
        aGenerer.map((r) => {
          const presidentMembre = r.soutenance?.jury?.membresJury?.find(
            (m) => m.fonction?.toLowerCase().trim() === 'president'
          );
          // Le bouton « Générer le PV » n'est affiché qu'au président
          // du jury concerné (RG11 ; l'API revalide de toute façon).
          const jeSuisPresident =
            presidentMembre?.enseignant?.user_id != null &&
            Number(presidentMembre.enseignant.user_id) === Number(user?.id);

          return (
            <Carte key={r.id}>
              <View style={styles.entete}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.etudiant}>
                    {r.soutenance?.etudiant?.user?.name ?? 'Étudiant'}
                  </Text>
                  <Text style={styles.memoire}>
                    {r.soutenance?.titre_memoire}
                  </Text>
                </View>
                {r.soutenance?.statut ? (
                  <EtiquetteStatut statut={r.soutenance.statut} />
                ) : null}
              </View>

              <View style={styles.ligne}>
                <Text style={styles.note}>
                  {r.moyenne_finale ?? '—'}/20
                </Text>
                <Etiquette
                  texte="Résultat finalisé"
                  couleur="vert"
                />
              </View>

              <View style={styles.actions}>
                {jeSuisPresident ? (
                  <>
                    <Bouton
                      label="Générer le PV"
                      variante="primaire"
                      onPress={() => generer(r)}
                      desactive={enCours === r.id}
                      chargement={enCours === r.id}
                    />
                    {Platform.OS === 'web' && choixType?.id === r.id ? (
                      <View style={styles.choixBloc}>
                        <Text style={styles.choixTexte}>
                          Type de Master (RG19) pour le PV de{' '}
                          {r.soutenance?.etudiant?.user?.name ?? 'cet étudiant'} :
                        </Text>
                        <View style={styles.choixBoutons}>
                          <Bouton
                            label="Master Recherche"
                            variante="primaire"
                            petit
                            desactive={enCours === r.id}
                            chargement={enCours === r.id}
                            onPress={() => {
                              setChoixType(null);
                              envoyerGeneration(r, 'recherche');
                            }}
                          />
                          <Bouton
                            label="Master Professionnel"
                            variante="primaire"
                            petit
                            desactive={enCours === r.id}
                            onPress={() => {
                              setChoixType(null);
                              envoyerGeneration(r, 'professionnel');
                            }}
                          />
                          <Bouton
                            label="Annuler"
                            variante="secondaire"
                            petit
                            onPress={() => setChoixType(null)}
                          />
                        </View>
                      </View>
                    ) : null}
                  </>
                ) : (
                  <Text style={styles.texteInfo}>
                    Seul le président du jury peut générer ce procès-verbal
                    (RG11).
                  </Text>
                )}
              </View>
            </Carte>
          );
        })
      )}

      {/* -------- Section téléchargement (membres autorisés) -------- */}
      <Text style={styles.sectionTitre}>Procès-verbaux disponibles</Text>
      {pvs.length === 0 ? (
        <Carte>
          <Text style={styles.texteInfo}>
            Aucun procès-verbal disponible. Les PV générés pour vos jurys
            apparaîtront ici et pourront être téléchargés (RG14).
          </Text>
        </Carte>
      ) : (
        pvs.map((pv) => (
          <Carte key={pv.id}>
            <View style={styles.entete}>
              <Text style={styles.pvNumero}>{pv.numero_pv}</Text>
              <Etiquette
                texte={pv.type_master === 'recherche' ? 'Master Recherche' : 'Master Professionnel'}
                couleur={pv.type_master === 'recherche' ? 'violet' : 'bleu'}
              />
            </View>
            <Text style={styles.date}>
              Généré le {formatDateHeure(pv.genere_le)}
            </Text>
            <View style={styles.actions}>
              <Bouton
                label="Télécharger le PV"
                variante="primaire"
                onPress={() => telechargerPv(pv)}
                desactive={telechargementEnCours === pv.id}
                chargement={telechargementEnCours === pv.id}
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
  sectionTitre: {
    fontSize: 16,
    fontWeight: '800',
    color: COULEURS.texte,
    marginTop: 8,
    marginBottom: 4,
  },
  sectionInfo: {
    color: COULEURS.texteSecondaire,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  etudiant: { fontSize: 15, fontWeight: '700', color: COULEURS.texte },
  memoire: { fontSize: 12, color: COULEURS.texteSecondaire, marginTop: 2 },
  ligne: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  note: { fontSize: 17, fontWeight: '800', color: COULEURS.primaire },
  actions: { flexDirection: 'row', marginTop: 10, gap: 10 },
  choixBloc: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: COULEURS.bordure,
    gap: 8,
  },
  choixTexte: { fontSize: 13, color: COULEURS.texte, fontWeight: '600' },
  choixBoutons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pvNumero: { fontSize: 14, fontWeight: '700', color: COULEURS.texte, flex: 1 },
  date: { color: COULEURS.texteSecondaire, fontSize: 12, marginTop: 4 },
  texteInfo: { color: COULEURS.texteSecondaire, fontSize: 13, lineHeight: 19 },
});
