import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MesSoutenancesJury from './MesSoutenancesJury';
import MesEvaluationsJury from './MesEvaluationsJury';
import MesProcesVerbauxJury from './MesProcesVerbauxJury';
import MonProfil from '../commun/MonProfil';
import Notifications from '../commun/Notifications';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { COULEURS } from '../../components/ui';

const Onglets = createBottomTabNavigator();

/**
 * Espace jury (mobile) — onglets :
 *   Mes soutenances · Mes évaluations · Procès-verbaux · Notifications · Mon profil
 *
 * Nouveautés :
 *   - onglet « Procès-verbaux » : le président du jury génère le PV
 *     directement depuis le mobile après validation des évaluations,
 *     puis le télécharge (les personnes autorisées le téléchargent) ;
 *   - onglet « Notifications » avec badge du nombre de non lues.
 */
export default function EspaceJury() {
  const { deconnexion } = useAuth();
  const [nbNonLues, setNbNonLues] = useState(0);

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
        name="MesSoutenances"
        component={MesSoutenancesJury}
        options={{
          headerTitle: 'Mes soutenances',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} />
          ),
          headerRight: () => (
            <Text onPress={deconnexion} style={{ color: '#fca5a5', fontWeight: '600' }}>
              Quitter
            </Text>
          ),
        }}
      />
      <Onglets.Screen
        name="MesEvaluations"
        component={MesEvaluationsJury}
        options={{
          headerTitle: 'Mes évaluations',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'checkbox' : 'checkbox-outline'} size={size} color={color} />
          ),
        }}
      />
      <Onglets.Screen
        name="ProcesVerbaux"
        component={MesProcesVerbauxJury}
        options={{
          headerTitle: 'Procès-verbaux',
          tabBarLabel: 'PV',
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
