import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import client from '../../api/client';
import {
  Bouton,
  Carte,
  ChampTexte,
  COULEURS,
  Erreur,
  Succes,
  messageApiErreur,
} from '../../components/ui';

/**
 * Écran « Mon Profil » (mobile — même logique que la page web) :
 *   - Enseignant : nom, mot de passe, spécialité, téléphone ;
 *   - Étudiant : mot de passe uniquement (matricule, promotion,
 *     parcours et mention non modifiables) ;
 *   - le changement de mot de passe exige le mot de passe actuel et
 *     une confirmation du nouveau.
 *
 * Les modifications portent TOUJOURS sur le compte connecté : il est
 * impossible de modifier le profil d'un autre utilisateur.
 */
export default function MonProfil() {
  const [profil, setProfil] = useState<any | null>(null);
  const [nom, setNom] = useState('');
  const [specialite, setSpecialite] = useState('');
  const [telephone, setTelephone] = useState('');
  const [mdpActuel, setMdpActuel] = useState('');
  const [nouveauMdp, setNouveauMdp] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const role = profil?.role?.name ?? '';
  const estEtudiant = role === 'etudiant';
  const estEnseignant = role === 'enseignant';

  const charger = useCallback(async () => {
    setErreur(null);
    try {
      const r = await client.get('/profil');
      setProfil(r.data);
      setNom(r.data.name ?? '');
      setSpecialite(r.data.enseignant?.specialite ?? '');
      setTelephone(r.data.enseignant?.telephone ?? '');
    } catch (e) {
      setErreur(messageApiErreur(e));
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const soumettre = async () => {
    setErreur(null);
    setSucces(null);

    const donnees: Record<string, string> = {};

    if (!estEtudiant && nom.trim()) donnees.name = nom.trim();
    if (estEnseignant) {
      donnees.specialite = specialite;
      donnees.telephone = telephone;
    }

    const veutChangerMdp = mdpActuel !== '' || nouveauMdp !== '' || confirmation !== '';
    if (veutChangerMdp) {
      if (!mdpActuel) {
        setErreur('Le mot de passe actuel est requis pour changer de mot de passe.');
        return;
      }
      if (nouveauMdp.length < 8) {
        setErreur('Le nouveau mot de passe doit contenir au moins 8 caractères.');
        return;
      }
      if (nouveauMdp !== confirmation) {
        setErreur('La confirmation du nouveau mot de passe ne correspond pas.');
        return;
      }
      donnees.mot_de_passe_actuel = mdpActuel;
      donnees.password = nouveauMdp;
      donnees.password_confirmation = confirmation;
    }

    if (Object.keys(donnees).length === 0) {
      setErreur('Aucune modification à enregistrer.');
      return;
    }

    setEnCours(true);
    try {
      const r = await client.put('/profil', donnees);
      setSucces(r.data?.message ?? 'Profil mis à jour.');
      setMdpActuel('');
      setNouveauMdp('');
      setConfirmation('');
      charger();
    } catch (e: any) {
      setErreur(e?.response?.data?.message || messageApiErreur(e));
    } finally {
      setEnCours(false);
    }
  };

  if (profil === null) {
    return (
      <View style={styles.ecranCentree}>
        <Erreur message={erreur} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.ecran} contentContainerStyle={styles.contenu}>
      <Carte titre="Mon profil">
        <Text style={styles.email}>{profil.email}</Text>
        <Text style={styles.role}>{role}</Text>

        <Erreur message={erreur} />
        <Succes message={succes} />

        {estEtudiant && (
          <Text style={styles.note}>
            En tant qu'étudiant, vous pouvez uniquement modifier votre mot de passe. Votre
            matricule, votre promotion, votre parcours et votre mention sont gérés par
            l'administration.
          </Text>
        )}

        {!estEtudiant && (
          <ChampTexte
            label="Nom complet"
            value={nom}
            onChangeText={setNom}
          />
        )}

        {estEnseignant && (
          <>
            <ChampTexte
              label="Spécialité"
              value={specialite}
              onChangeText={setSpecialite}
            />
            <ChampTexte
              label="Numéro de téléphone"
              value={telephone}
              onChangeText={setTelephone}
              keyboardType="phone-pad"
            />
          </>
        )}

        <Text style={styles.sectionTitre}>Changer de mot de passe</Text>

        <ChampTexte
          label="Mot de passe actuel"
          value={mdpActuel}
          onChangeText={setMdpActuel}
          secure
        />
        <ChampTexte
          label="Nouveau mot de passe (min. 8 caractères)"
          value={nouveauMdp}
          onChangeText={setNouveauMdp}
          secure
        />
        <ChampTexte
          label="Confirmer le nouveau mot de passe"
          value={confirmation}
          onChangeText={setConfirmation}
          secure
        />

        <Bouton
          label={enCours ? 'Enregistrement…' : 'Enregistrer'}
          onPress={soumettre}
          desactive={enCours}
          chargement={enCours}
        />
      </Carte>

      {estEtudiant && profil.etudiant ? (
        <Carte titre="Informations académiques (lecture seule)">
          <View style={styles.ligne}>
            <Text style={styles.label}>Matricule</Text>
            <Text style={styles.valeur}>{profil.etudiant.numero_etudiant}</Text>
          </View>
          <View style={styles.ligne}>
            <Text style={styles.label}>Promotion</Text>
            <Text style={styles.valeur}>{profil.etudiant.promotion?.nom ?? '—'}</Text>
          </View>
          <View style={styles.ligne}>
            <Text style={styles.label}>Parcours</Text>
            <Text style={styles.valeur}>{profil.etudiant.promotion?.parcours?.nom ?? '—'}</Text>
          </View>
          <View style={styles.ligne}>
            <Text style={styles.label}>Mention</Text>
            <Text style={styles.valeur}>{profil.etudiant.promotion?.formation?.nom ?? '—'}</Text>
          </View>
        </Carte>
      ) : null}

      {estEnseignant && (
        <Carte titre="Informations professionnelles">
          <View style={styles.ligne}>
            <Text style={styles.label}>Spécialité</Text>
            <Text style={styles.valeur}>{profil.enseignant?.specialite ?? '—'}</Text>
          </View>
          <View style={styles.ligne}>
            <Text style={styles.label}>Téléphone</Text>
            <Text style={styles.valeur}>{profil.enseignant?.telephone ?? '—'}</Text>
          </View>
        </Carte>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: COULEURS.fond },
  ecranCentree: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COULEURS.fond, padding: 16 },
  contenu: { padding: 16, paddingBottom: 32, gap: 14 },
  email: { color: COULEURS.texteSecondaire, fontSize: 13 },
  role: { color: COULEURS.primaire, fontSize: 13, fontWeight: '700', textTransform: 'capitalize', marginBottom: 8 },
  note: {
    color: COULEURS.texteSecondaire,
    fontSize: 12,
    lineHeight: 18,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  sectionTitre: {
    fontSize: 13,
    fontWeight: '700',
    color: COULEURS.texte,
    marginTop: 10,
    marginBottom: 2,
  },
  ligne: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COULEURS.bordure,
  },
  label: { color: COULEURS.texteSecondaire, fontSize: 13 },
  valeur: { color: COULEURS.texte, fontSize: 13, fontWeight: '600' },
});
