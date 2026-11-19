import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import client from '../api/client';
import {
  Bouton,
  COULEURS,
  ChampTexte,
  Erreur,
  Succes,
  messageApiErreur,
} from '../components/ui';

/**
 * Réinitialisation du mot de passe en deux étapes :
 *   1. E-mail → code à 6 chiffres envoyé par e-mail.
 *   2. Code + nouveau mot de passe.
 */
export default function MotDePasseOublie({ onRetour }: { onRetour: () => void }) {
  const [etape, setEtape] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const demanderCode = async () => {
    if (!email.trim()) {
      setErreur('Saisissez votre adresse e-mail.');
      return;
    }
    setErreur(null);
    setEnCours(true);
    try {
      const r = await client.post('/mot-de-passe/oublie', { email: email.trim() });
      let message: string = r.data?.message ?? 'Code envoyé par e-mail.';
      if (r.data?.code_developpement) {
        message += ` (Mode développement — SMTP non configuré : code de test : ${r.data.code_developpement})`;
      }
      setSucces(message);
      setEtape(2);
    } catch (e) {
      setErreur(messageApiErreur(e));
    } finally {
      setEnCours(false);
    }
  };

  const reinitialiser = async () => {
    if (motDePasse.length < 8) {
      setErreur('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (motDePasse !== confirmation) {
      setErreur('La confirmation du mot de passe ne correspond pas.');
      return;
    }
    setErreur(null);
    setEnCours(true);
    try {
      const r = await client.post('/mot-de-passe/reinitialiser', {
        email: email.trim(),
        code: code.trim(),
        password: motDePasse,
        password_confirmation: confirmation,
      });
      setSucces(r.data?.message ?? 'Mot de passe réinitialisé avec succès.');
    } catch (e) {
      setErreur(messageApiErreur(e));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <ScrollView style={styles.ecran} contentContainerStyle={styles.contenu}>
      <Text style={styles.titre}>Mot de passe oublié</Text>
      <Text style={styles.sousTitre}>
        Étape {etape} sur 2 : {etape === 1 ? 'votre adresse e-mail' : 'code + nouveau mot de passe'}
      </Text>

      <View style={styles.carte}>
        <Erreur message={erreur} />
        <Succes message={succes} />

        {etape === 1 ? (
          <>
            <ChampTexte
              label="Adresse e-mail du compte"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder="prenom.nom@emit.mg"
            />
            <Bouton
              label={enCours ? 'Envoi du code…' : 'Recevoir le code'}
              onPress={demanderCode}
              chargement={enCours}
            />
          </>
        ) : (
          <>
            <ChampTexte
              label="Code reçu par e-mail (6 chiffres)"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              placeholder="ex : 482913"
            />
            <ChampTexte
              label="Nouveau mot de passe (8 caractères minimum)"
              value={motDePasse}
              onChangeText={setMotDePasse}
              secure
            />
            <ChampTexte
              label="Confirmer le nouveau mot de passe"
              value={confirmation}
              onChangeText={setConfirmation}
              secure
            />
            <View style={styles.noteBloc}>
              <Text style={styles.noteTexte}>
                Notez bien votre nouveau mot de passe et mémorisez-le pour ne pas le perdre.
              </Text>
            </View>
            <Bouton
              label={enCours ? 'Réinitialisation…' : 'Réinitialiser le mot de passe'}
              onPress={reinitialiser}
              chargement={enCours}
            />
          </>
        )}

        <Bouton label="← Retour à la connexion" variante="secondaire" onPress={onRetour} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: COULEURS.primaire },
  contenu: { padding: 20, paddingBottom: 40 },
  titre: { color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center', marginTop: 24 },
  sousTitre: { color: '#cbd5e1', fontSize: 12, textAlign: 'center', marginTop: 4, marginBottom: 18 },
  carte: { backgroundColor: '#fff', borderRadius: 18, padding: 18 },
  noteBloc: {
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  noteTexte: { color: '#92400e', fontSize: 12, lineHeight: 17 },
});
