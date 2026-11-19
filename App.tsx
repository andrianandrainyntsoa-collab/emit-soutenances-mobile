import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Text, View } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { Bouton, COULEURS } from './src/components/ui';
import Connexion from './src/screens/Connexion';
import Inscription from './src/screens/Inscription';
import MotDePasseOublie from './src/screens/MotDePasseOublie';
import EspaceEtudiant from './src/screens/etudiant/EspaceEtudiant';
import EspaceJury from './src/screens/jury/EspaceJury';

const Pile = createNativeStackNavigator();

type EcranPublic = 'connexion' | 'inscription' | 'motDePasse';

function NavigationPrincipale() {
  const { user, role, chargement, deconnexion } = useAuth();
  const [ecranPublic, setEcranPublic] = useState<EcranPublic>('connexion');

  if (chargement) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COULEURS.primaire} />
      </View>
    );
  }

  if (!user) {
    return (
      <Pile.Navigator screenOptions={{ headerShown: false }}>
        {ecranPublic === 'connexion' ? (
          <Pile.Screen name="Connexion">
            {() => (
              <Connexion
                onInscription={() => setEcranPublic('inscription')}
                onMotDePasseOublie={() => setEcranPublic('motDePasse')}
              />
            )}
          </Pile.Screen>
        ) : ecranPublic === 'inscription' ? (
          <Pile.Screen name="Inscription">
            {() => <Inscription onRetour={() => setEcranPublic('connexion')} />}
          </Pile.Screen>
        ) : (
          <Pile.Screen name="MotDePasseOublie">
            {() => <MotDePasseOublie onRetour={() => setEcranPublic('connexion')} />}
          </Pile.Screen>
        )}
      </Pile.Navigator>
    );
  }

  if (role === 'etudiant') {
    return (
      <Pile.Navigator screenOptions={{ headerShown: false }}>
        <Pile.Screen name="EspaceEtudiant" component={EspaceEtudiant} />
      </Pile.Navigator>
    );
  }

  if (role === 'enseignant') {
    return (
      <Pile.Navigator screenOptions={{ headerShown: false }}>
        <Pile.Screen name="EspaceJury" component={EspaceJury} />
      </Pile.Navigator>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' }}>
      <Text style={{ color: COULEURS.texte, fontSize: 16, textAlign: 'center', marginBottom: 16 }}>
        Cette application mobile est réservée aux étudiants et aux membres des jurys. Utilisez
        l’application web pour ce rôle.
      </Text>
      <Bouton label="Se déconnecter" onPress={() => { void deconnexion(); }} />
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <NavigationPrincipale />
      </NavigationContainer>
    </AuthProvider>
  );
}
