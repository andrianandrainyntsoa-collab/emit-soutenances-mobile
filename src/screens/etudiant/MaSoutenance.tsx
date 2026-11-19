import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
} from 'react-native';
import client from '../../api/client';
import {
  Bouton,
  Carte,
  Chargement,
  COULEURS,
  Erreur,
  EtiquetteStatut,
  formatDate,
  formatHeure,
  messageApiErreur,
} from '../../components/ui';
import type { Soutenance } from '../../types';

export default function MaSoutenance() {
  const [soutenance, setSoutenance] = useState<Soutenance | null | undefined>(undefined);
  const [erreur, setErreur] = useState<string | null>(null);
  const [rafraichit, setRafraichit] = useState(false);

  const charger = useCallback(async () => {
    setErreur(null);
    try {
      const r = await client.get('/ma-soutenance');
      setSoutenance(r.data.soutenance);
    } catch (e) {
      setErreur(messageApiErreur(e));
      setSoutenance(null);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  if (soutenance === undefined) return <Chargement />;

  return (
    <ScrollView
      style={styles.ecran}
      contentContainerStyle={styles.contenu}
      refreshControl={
        <RefreshControl refreshing={rafraichit} onRefresh={async () => { setRafraichit(true); await charger(); setRafraichit(false); }} />
      }
    >
      <Erreur message={erreur} />
      {!soutenance ? (
        <Carte>
          <Text style={styles.texteInfo}>
            Vous êtes autorisé(e) à soutenir. Votre soutenance sera planifiée
            prochainement par l'administration.
          </Text>
        </Carte>
      ) : (
        <>
          <Carte>
            <View style={styles.ligneEntete}>
              <Text style={styles.titre}>{soutenance.titre_memoire}</Text>
              <EtiquetteStatut statut={soutenance.statut} />
            </View>
          </Carte>

          <Carte titre="Informations pratiques">
            <Ligne label="Date" valeur={formatDate(soutenance.creneau?.date_soutenance)} />
            <Ligne
              label="Heure"
              valeur={`${formatHeure(soutenance.creneau?.heure_debut)} — ${formatHeure(soutenance.creneau?.heure_fin)}`}
            />
            <Ligne
              label="Salle"
              valeur={soutenance.salle ? `${soutenance.salle.code} — ${soutenance.salle.nom}` : '—'}
            />
            <Ligne label="Session" valeur={soutenance.session?.nom ?? '—'} />
            <Ligne label="Jury" valeur={soutenance.jury?.code ?? '—'} />
          </Carte>

          {soutenance.jury?.membresJury?.length ? (
            <Carte titre="Membres du jury">
              {soutenance.jury.membresJury.map((m) => (
                <Ligne
                  key={m.id}
                  label={m.fonction.charAt(0).toUpperCase() + m.fonction.slice(1)}
                  valeur={m.enseignant?.user?.name ?? '—'}
                />
              ))}
            </Carte>
          ) : null}

          <Carte titre="Consignes">
            <Text style={styles.texteInfo}>
              Présentez-vous 15 minutes avant l'heure indiquée, muni(e) d'une
              pièce d'identité. Votre convocation est disponible dans l'onglet
              Convocations.
            </Text>
          </Carte>
        </>
      )}
    </ScrollView>
  );
}

function Ligne({ label, valeur }: { label: string; valeur: string }) {
  return (
    <View style={styles.ligne}>
      <Text style={styles.ligneLabel}>{label}</Text>
      <Text style={styles.ligneValeur}>{valeur}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: COULEURS.fond },
  contenu: { padding: 16, paddingBottom: 32 },
  titre: { flex: 1, fontSize: 16, fontWeight: '700', color: COULEURS.texte },
  ligneEntete: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ligne: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COULEURS.bordure,
  },
  ligneLabel: { color: COULEURS.texteSecondaire, fontSize: 13 },
  ligneValeur: { color: COULEURS.texte, fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  texteInfo: { color: COULEURS.texteSecondaire, fontSize: 13, lineHeight: 20 },
});
