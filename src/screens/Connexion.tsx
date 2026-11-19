import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import {
  Bouton,
  COULEURS,
  Erreur,
  ChampTexte,
  messageApiErreur,
} from '../components/ui';

export default function Connexion({
  onInscription,
  onMotDePasseOublie,
}: {
  onInscription?: () => void;
  onMotDePasseOublie?: () => void;
}) {
  const { connexion } = useAuth();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const soumettre = async () => {
    setErreur(null);
    setEnCours(true);
    try {
      await connexion(email.trim(), motDePasse);
    } catch (e) {
      setErreur(messageApiErreur(e));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.conteneur}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
        <View style={styles.entete}>
          <Image
            source={require('../../assets/logo-emit.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.titre}>Soutenances Master</Text>
          <Text style={styles.sousTitre}>
            Université de Fianarantsoa — École de Management et d'Innovation
            Technologique
          </Text>
        </View>

        <View style={styles.carte}>
          <Text style={styles.titreCarte}>Connexion</Text>
          <Erreur message={erreur} />
          <ChampTexte
            label="Adresse e-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="prenom.nom@emit.mg"
          />
          <ChampTexte
            label="Mot de passe"
            value={motDePasse}
            onChangeText={setMotDePasse}
            secure
            placeholder="••••••••"
          />
          <Bouton
            label="Se connecter"
            onPress={soumettre}
            desactive={!email || !motDePasse}
            chargement={enCours}
          />

          <Pressable onPress={onMotDePasseOublie} hitSlop={8}>
            <Text style={styles.lienOublie}>Mot de passe oublié ?</Text>
          </Pressable>

          <View style={styles.separateur} />

          <Bouton
            label="Créer un compte (étudiant / enseignant)"
            variante="secondaire"
            onPress={onInscription ?? (() => {})}
          />

          <Text style={styles.note}>
            Application réservée aux étudiants et aux membres des jurys.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
    backgroundColor: COULEURS.primaire,
  },
  contenu: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingVertical: 40,
  },
  entete: { alignItems: 'center', marginBottom: 28 },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 18,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  titre: { color: '#fff', fontSize: 22, fontWeight: '700' },
  sousTitre: {
    color: '#cbd5e1',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
  carte: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
  },
  titreCarte: {
    fontSize: 17,
    fontWeight: '700',
    color: COULEURS.texte,
    marginBottom: 12,
  },
  lienOublie: {
    color: COULEURS.primaireClair,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
  },
  separateur: {
    height: 1,
    backgroundColor: COULEURS.bordure,
    marginVertical: 14,
  },
  note: {
    color: COULEURS.texteSecondaire,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
});
