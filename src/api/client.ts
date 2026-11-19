import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import axios from 'axios';

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

// CORRECTION : dans un navigateur (Expo web), l'ancien défaut
// « 10.0.2.2 » (alias de la machine hôte pour l'ÉMULATEUR Android)
// n'est jamais joignable — les requêtes échouaient avant même
// d'atteindre l'API. Sur web, le défaut pointe donc vers
// localhost:8000 (l'API lancée sur la même machine). La variable
// d'environnement EXPO_PUBLIC_API_URL reste prioritaire dans tous
// les cas.
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'web'
    ? 'http://localhost:8000/api'
    : 'http://10.0.2.2:8000/api');

const client = axios.create({
  baseURL: API_URL,
  headers: { Accept: 'application/json' },
  timeout: 15000,
});

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user']);
      unauthorizedHandler?.();
    }

    return Promise.reject(error);
  }
);

/** Traduit une erreur HTTP de téléchargement en message compréhensible. */
function messageErreurTelechargement(status: number | undefined): string {
  if (status === 401) {
    return 'Votre session a expiré. Reconnectez-vous, puis réessayez.';
  }
  if (status === 403) {
    return 'Accès interdit à ce document.';
  }
  if (status === 404) {
    return 'Document introuvable sur le serveur : demandez sa régénération, puis réessayez.';
  }
  return `Impossible de télécharger le PDF (HTTP ${status ?? '?'}) — vérifiez votre connexion à l'API.`;
}

/**
 * Télécharge un document PDF de l'API.
 *
 * CORRECTION (boutons inopérants dans le navigateur) : sur web
 * (Expo web), `FileSystem.documentDirectory` est indisponible et
 * `expo-sharing` ne fonctionne pas — l'ancien flux échouait donc
 * AVANT toute requête et, comme `Alert.alert` n'est pas rendu dans
 * le navigateur, l'utilisateur ne voyait RIEN : les boutons
 * « semblaient ne pas répondre ».
 *
 * Sur web, le document est récupéré avec le client Axios afin que le
 * token Sanctum soit envoyé dans l'en-tête Authorization, puis téléchargé
 * depuis une URL Blob temporaire.
 *
 * Sur mobile natif (Android / iOS), le flux historique est conservé :
 * téléchargement authentifié via expo-file-system, puis l'écran
 * ouvre / partage le fichier via expo-sharing.
 *
 * @returns L'URI locale du fichier sur natif ; une chaîne vide sur
 *          web (le téléchargement navigateur est déjà déclenché).
 */
export async function telechargerPdf(
  chemin: string,
  nomFichier: string
): Promise<string> {
  const token = await AsyncStorage.getItem('token');

  if (!token) {
    throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
  }

  const cheminNormalise = chemin.startsWith('/') ? chemin : `/${chemin}`;

  if (Platform.OS === 'web') {
    const response = await client.get<Blob>(cheminNormalise, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(
      new Blob([response.data], { type: 'application/pdf' })
    );

    const ancre = document.createElement('a');
    ancre.href = url;
    ancre.download = nomFichier;
    ancre.rel = 'noopener';
    ancre.style.display = 'none';
    document.body.appendChild(ancre);
    ancre.click();
    window.setTimeout(() => {
      ancre.remove();
      URL.revokeObjectURL(url);
    }, 3_000);

    return '';
  }

  const dossier = FileSystem.documentDirectory;
  if (!dossier) {
    throw new Error('Le stockage local est indisponible.');
  }

  const url = `${API_URL}${cheminNormalise}`;
  const destination = `${dossier}${nomFichier}`;

  try {
    const resultat = await FileSystem.downloadAsync(url, destination, {
      headers: {
        Accept: 'application/pdf',
        Authorization: `Bearer ${token}`,
      },
    });

    if (resultat.status !== 200) {
      throw new Error(messageErreurTelechargement(resultat.status));
    }

    return resultat.uri;
  } catch (e: any) {
    if (e?.message) throw e;
    throw new Error(
      "Le téléchargement a échoué — vérifiez votre connexion à l'API."
    );
  }
}

export default client;