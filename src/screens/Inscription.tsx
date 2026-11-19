import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import client from '../api/client';
import {
  Bouton,
  COULEURS,
  ChampTexte,
  Erreur,
  Succes,
  messageApiErreur,
} from '../components/ui';

type Profil = 'etudiant' | 'enseignant';

interface FormationT {
  id: number;
  code: string;
  nom: string;
}

interface ParcoursT {
  id: number;
  formation_id: number;
  code: string;
  nom: string;
}

interface PromotionT {
  id: number;
  formation_id: number;
  parcours_id?: number | null;
  nom: string;
  annee_universitaire: string;
}

/** Sélecteur compact à puces (aucune dépendance externe requise). */
function Selecteur({
  label,
  options,
  valeur,
  onChange,
  requis,
}: {
  label: string;
  options: { id: number; libelle: string }[];
  valeur: string;
  onChange: (id: string) => void;
  requis?: boolean;
}) {
  return (
    <View style={styles.selecteurBloc}>
      <Text style={styles.champLabel}>
        {label}
        {requis ? ' *' : ''}
      </Text>
      <View style={styles.chips}>
        {options.map((o) => {
          const actif = String(o.id) === valeur;
          return (
            <Pressable
              key={o.id}
              onPress={() => onChange(String(o.id))}
              style={[styles.chip, actif && styles.chipActif]}
            >
              <Text style={[styles.chipTexte, actif && styles.chipTexteActif]}>
                {o.libelle}
              </Text>
            </Pressable>
          );
        })}
        {options.length === 0 ? (
          <Text style={styles.aucuneOption}>— Aucune option —</Text>
        ) : null}
      </View>
    </View>
  );
}

export default function Inscription({ onRetour }: { onRetour: () => void }) {
  const [profil, setProfil] = useState<Profil>('etudiant');
  const [formations, setFormations] = useState<FormationT[]>([]);
  const [parcours, setParcours] = useState<ParcoursT[]>([]);
  const [promotions, setPromotions] = useState<PromotionT[]>([]);

  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [numero, setNumero] = useState('');
  const [telephone, setTelephone] = useState('');
  const [specialite, setSpecialite] = useState('');
  const [formationId, setFormationId] = useState('');
  const [parcoursId, setParcoursId] = useState('');
  const [promotionId, setPromotionId] = useState('');

  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    client
      .get('/public/referentiels')
      .then((r) => {
        setFormations(r.data.formations ?? []);
        setParcours(r.data.parcours ?? []);
        setPromotions(r.data.promotions ?? []);
      })
      .catch((e) => setErreur(messageApiErreur(e)));
  }, []);

  const parcoursFiltres = parcours.filter(
    (p) => !formationId || String(p.formation_id) === formationId
  );
  const promotionsFiltrees = promotions.filter(
    (p) => !parcoursId || String(p.parcours_id) === parcoursId
  );

  const changerProfil = (p: Profil) => {
    setProfil(p);
    setErreur(null);
    setSucces(null);
  };

  const validerFormulaire = (): string | null => {
    if (!nom.trim() || !email.trim() || motDePasse.length < 8) {
      return 'Nom, e-mail et mot de passe (8 caractères minimum) sont requis.';
    }
    if (motDePasse !== confirmation) {
      return 'La confirmation du mot de passe ne correspond pas.';
    }
    if (profil === 'etudiant') {
      if (!/^\d{1,6}[A-Za-z]{2,10}\d{2}$/.test(numero.trim())) {
        return "Le numéro étudiant doit suivre le format numero-formation-annee (ex : 312CM24 ou 312SDIA24).";
      }
      if (!promotionId) {
        return 'Choisissez la mention, le parcours puis la promotion.';
      }
    }
    return null;
  };

  const soumettre = async () => {
    const probleme = validerFormulaire();
    if (probleme) {
      setErreur(probleme);
      return;
    }
    setErreur(null);
    setEnCours(true);
    try {
      if (profil === 'etudiant') {
        await client.post('/register/etudiant', {
          name: nom.trim(),
          email: email.trim(),
          password: motDePasse,
          password_confirmation: confirmation,
          numero_etudiant: numero.trim().toUpperCase(),
          telephone: telephone.trim() || undefined,
          promotion_id: Number(promotionId),
        });
      } else {
        await client.post('/register/enseignant', {
          name: nom.trim(),
          email: email.trim(),
          password: motDePasse,
          password_confirmation: confirmation,
          specialite: specialite.trim() || undefined,
          telephone: telephone.trim() || undefined,
        });
      }
      setSucces(
        'Inscription réussie ! Votre compte est en attente d\'autorisation par l\'administration : vous serez averti(e) dès qu\'il sera activé (web et mobile).'
      );
      setNom('');
      setEmail('');
      setMotDePasse('');
      setConfirmation('');
      setNumero('');
      setTelephone('');
      setSpecialite('');
      setFormationId('');
      setParcoursId('');
      setPromotionId('');
    } catch (e) {
      setErreur(messageApiErreur(e));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <ScrollView style={styles.ecran} contentContainerStyle={styles.contenu}>
      <Text style={styles.titre}>Créer un compte</Text>
      <Text style={styles.sousTitre}>
        Inscription étudiant / enseignant — choisissez votre propre mot de passe.
      </Text>

      <View style={styles.onglets}>
        {(['etudiant', 'enseignant'] as Profil[]).map((p) => (
          <Pressable
            key={p}
            onPress={() => changerProfil(p)}
            style={[styles.onglet, profil === p && styles.ongletActif]}
          >
            <Text style={[styles.ongletTexte, profil === p && styles.ongletTexteActif]}>
              {p === 'etudiant' ? 'Étudiant' : 'Enseignant'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.carte}>
        <Erreur message={erreur} />
        <Succes message={succes} />

        <ChampTexte label="Nom complet *" value={nom} onChangeText={setNom} />
        <ChampTexte
          label="Adresse e-mail *"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholder="prenom.nom@emit.mg"
        />

        {profil === 'etudiant' ? (
          <>
            <ChampTexte
              label="Numéro étudiant (ex : 312CM24 ou 312SDIA24) *"
              value={numero}
              onChangeText={setNumero}
              autoCapitalize="characters"
              placeholder="numero-formation-annee"
            />
            <Selecteur
              label="Mention (formation)"
              requis
              options={formations.map((f) => ({ id: f.id, libelle: `${f.nom} (${f.code})` }))}
              valeur={formationId}
              onChange={(v) => {
                setFormationId(v);
                setParcoursId('');
                setPromotionId('');
              }}
            />
            <Selecteur
              label="Parcours"
              requis
              options={parcoursFiltres.map((p) => ({ id: p.id, libelle: `${p.nom} (${p.code})` }))}
              valeur={parcoursId}
              onChange={(v) => {
                setParcoursId(v);
                setPromotionId('');
              }}
            />
            <Selecteur
              label="Promotion"
              requis
              options={promotionsFiltrees.map((p) => ({
                id: p.id,
                libelle: `${p.nom} — ${p.annee_universitaire}`,
              }))}
              valeur={promotionId}
              onChange={setPromotionId}
            />
          </>
        ) : (
          <>
            <ChampTexte label="Spécialité" value={specialite} onChangeText={setSpecialite} />
          </>
        )}

        <ChampTexte label="Téléphone" value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" />

        <ChampTexte
          label="Mot de passe (8 caractères minimum) *"
          value={motDePasse}
          onChangeText={setMotDePasse}
          secure
        />
        <ChampTexte
          label="Confirmer le mot de passe *"
          value={confirmation}
          onChangeText={setConfirmation}
          secure
        />

        <View style={styles.noteBloc}>
          <Text style={styles.noteTexte}>
            Important : notez bien et mémorisez votre mot de passe — il vous sera demandé à chaque
            connexion. En cas d'oubli, utilisez « Mot de passe oublié » sur l'écran de connexion :
            un code de réinitialisation vous sera envoyé par e-mail.
          </Text>
        </View>

        <Bouton label={enCours ? 'Inscription…' : "S'inscrire"} onPress={soumettre} chargement={enCours} />
        <Bouton label="← Retour à la connexion" variante="secondaire" onPress={onRetour} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: COULEURS.primaire },
  contenu: { padding: 20, paddingBottom: 40 },
  titre: { color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center', marginTop: 16 },
  sousTitre: { color: '#cbd5e1', fontSize: 12, textAlign: 'center', marginTop: 4, marginBottom: 18 },
  onglets: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  onglet: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  ongletActif: { backgroundColor: '#fff' },
  ongletTexte: { color: '#e2e8f0', fontWeight: '600', fontSize: 14 },
  ongletTexteActif: { color: COULEURS.primaire },
  carte: { backgroundColor: '#fff', borderRadius: 18, padding: 18 },
  selecteurBloc: { marginBottom: 12 },
  champLabel: { fontSize: 13, fontWeight: '600', color: COULEURS.texte, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: COULEURS.bordure,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  chipActif: { backgroundColor: COULEURS.primaire, borderColor: COULEURS.primaire },
  chipTexte: { fontSize: 12.5, color: COULEURS.texte, fontWeight: '600' },
  chipTexteActif: { color: '#fff' },
  aucuneOption: { color: COULEURS.texteSecondaire, fontSize: 12.5 },
  noteBloc: {
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  noteTexte: { color: '#92400e', fontSize: 12, lineHeight: 17 },
});
