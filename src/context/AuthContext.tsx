import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import client, { API_URL, setUnauthorizedHandler } from '../api/client';
import type { User } from '../types';

interface AuthContexte {
  user: User | null;
  role: string | null;
  chargement: boolean;
  connexion: (email: string, motDePasse: string) => Promise<void>;
  deconnexion: () => Promise<void>;
}

const Contexte = createContext<AuthContexte | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));

    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const r = await client.get('/user');
          setUser(r.data);
        }
      } catch {
        await AsyncStorage.multiRemove(['token', 'user']);
      } finally {
        setChargement(false);
      }
    })();

    return () => setUnauthorizedHandler(null);
  }, []);

  const connexion = useCallback(async (email: string, motDePasse: string) => {
    const r = await axios.post(`${API_URL}/login`, {
      email,
      password: motDePasse,
    });
    await AsyncStorage.setItem('token', r.data.token);
    await AsyncStorage.setItem('user', JSON.stringify(r.data.user));
    setUser(r.data.user);
  }, []);

  const deconnexion = useCallback(async () => {
    try {
      await client.post('/logout');
    } catch {
      // la session locale est supprimée dans tous les cas
    }
    await AsyncStorage.multiRemove(['token', 'user']);
    setUser(null);
  }, []);

  const valeur = useMemo(
    () => ({
      user,
      role: user?.role?.name ?? null,
      chargement,
      connexion,
      deconnexion,
    }),
    [user, chargement, connexion, deconnexion]
  );

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useAuth(): AuthContexte {
  const ctx = useContext(Contexte);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
