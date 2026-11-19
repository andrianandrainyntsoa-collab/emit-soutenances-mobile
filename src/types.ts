export interface Role {
  id: number;
  name: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role?: Role;
  est_autorise?: boolean;
}

export interface Soutenance {
  id: number;
  titre_memoire: string;
  statut: string;
  date_soutenance?: string | null;
  heure_debut?: string | null;
  heure_fin?: string | null;
  etudiant?: { user?: { name?: string }; numero_etudiant?: string };
  session?: { nom?: string };
  salle?: { code?: string; nom?: string } | null;
  creneau?: {
    date_soutenance?: string;
    heure_debut?: string;
    heure_fin?: string;
  } | null;
  jury?: {
    code?: string;
    nom?: string | null;
    membresJury?: {
      id: number;
      fonction: string;
      enseignant?: { user?: { name?: string } };
    }[];
  };
  evaluations?: Evaluation[];
  deliberation?: Deliberation | null;
  resultat?: Resultat | null;
  convocations?: Convocation[];
}

export interface Evaluation {
  id: number;
  note: string;
  commentaire?: string | null;
  validee: boolean;
  enseignant?: { user?: { name?: string } };
  soutenance?: Soutenance | null;
}

export interface Deliberation {
  id: number;
  note_finale_retenue?: string | null;
  mention?: string | null;
  decision: string;
  observations?: string | null;
  deliberee_le?: string | null;
}

export interface Resultat {
  id: number;
  moyenne_finale?: string | null;
  decision: string;
  mention?: string | null;
  valide_le?: string | null;
}

export interface Convocation {
  id: number;
  statut: string;
  type_destinataire: string;
  date_generation?: string | null;
  soutenance?: Soutenance | null;
}

export interface ProcesVerbal {
  id: number;
  numero_pv: string;
  type_master: string;
  genere_le: string;
}
