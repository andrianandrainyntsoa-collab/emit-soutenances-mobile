import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MaSoutenance from './MaSoutenance';
import MesConvocations from './MesConvocations';
import MonResultat from './MonResultat';
import MonProfil from '../commun/MonProfil';
import Notifications from '../commun/Notifications';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { COULEURS } from '../../components/ui';

const Onglets = createBottomTabNavigator();

const LIBELLES: Record<string, string> = {
  Accueil: 'Ma soutenance',
  Convocations: 'Convocations',
  Resultat: 'Résultat & PV',
  Notifications: 'Notifications',
};

/**
 * Espace étudiant (mobile) — onglets :
 *   Ma soutenance · Convocations · Résultat & PV · Notifications · Mon profil
 *
 * Nouveauté : onglet « Notifications » (avec badge du nombre de non
 * lues), aligné sur la partie web.
 */
export default function EspaceEtudiant() {
  const { user, deconnexion } = useAuth();
  const [nbNonLues, setNbNonLues] = React.useState(0);

  // Badge des notifications non lues, rafraîchi à chaque ouverture
  // d'un onglet puis toutes les 30 secondes.
  useFocusEffect(
    React.useCallback(() => {
      let actif = true;
      const charger = () =>
        client
          .get('/notifications/non-lues-count')
          .then((r) => actif && setNbNonLues(r.data?.non_lues ?? 0))
          .catch(() => {});
      charger();
      const t = setInterval(charger, 30_000);
      return () => {
        actif = false;
        clearInterval(t);
      };
    }, [])
  );

  return (
    <Onglets.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COULEURS.primaire },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: COULEURS.primaire,
        tabBarInactiveTintColor: COULEURS.texteSecondaire,
      }}
    >
      <Onglets.Screen
        name="Accueil"
        component={MaSoutenance}
        options={{
          headerTitle: 'Ma soutenance',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
          headerRight: () => (
            <Text onPress={deconnexion} style={{ color: '#fca5a5', fontWeight: '600' }}>
              Quitter
            </Text>
          ),
        }}
      />
      <Onglets.Screen
        name="Convocations"
        component={MesConvocations}
        options={{
          headerTitle: 'Mes convocations',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} />
          ),
        }}
      />
      <Onglets.Screen
        name="Resultat"
        component={MonResultat}
        options={{
          headerTitle: 'Résultat & PV',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'document-text' : 'document-text-outline'} size={size} color={color} />
          ),
        }}
      />
      <Onglets.Screen
        name="Notifications"
        component={Notifications}
        options={{
          headerTitle: 'Notifications',
          tabBarLabel: LIBELLES.Notifications,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={size} color={color} />
          ),
          tabBarBadge: nbNonLues > 0 ? (nbNonLues > 99 ? '99+' : nbNonLues) : undefined,
          tabBarBadgeStyle: { backgroundColor: '#dc2626', color: '#fff' },
        }}
      />
      <Onglets.Screen
        name="MonProfil"
        component={MonProfil}
        options={{
          headerTitle: 'Mon profil',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Onglets.Navigator>
  );
}
