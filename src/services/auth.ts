// Login com Google (Firebase Authentication) e sincronização da biblioteca (Firestore).
// Sem as variáveis VITE_FIREBASE_*, nada disso é carregado e o app funciona só com os dados do aparelho.
import { useSyncExternalStore } from "react";
import { Capacitor } from "@capacitor/core";
import type { FirebaseApp } from "firebase/app";
import type { Auth, User } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import { applyRemoteLibrary, getLibrary, onLocalLibraryChange, type LibraryState } from "./library";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

export const isLoginAvailable = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

export interface AccountUser {
  uid: string;
  name: string;
  email: string;
  photoUrl: string;
}

type SyncStatus = "off" | "syncing" | "synced" | "error";
interface AuthState {
  user: AccountUser | null;
  ready: boolean;
  sync: SyncStatus;
}

let state: AuthState = { user: null, ready: !isLoginAvailable, sync: "off" };
const listeners = new Set<() => void>();
const set = (patch: Partial<AuthState>) => {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getState = () => state;

export const useAuth = () => useSyncExternalStore(subscribe, getState, getState);

let services: Promise<{ app: FirebaseApp; auth: Auth; db: Firestore }> | null = null;

const loadServices = () => {
  services ??= (async () => {
    const [{ initializeApp }, authModule, { getFirestore }] = await Promise.all([
      import("firebase/app"),
      import("firebase/auth"),
      import("firebase/firestore"),
    ]);
    const app = initializeApp(firebaseConfig);
    // Persistência no aparelho: a pessoa continua logada ao reabrir o app.
    const auth = authModule.initializeAuth(app, {
      persistence: [authModule.indexedDBLocalPersistence, authModule.browserLocalPersistence],
      popupRedirectResolver: authModule.browserPopupRedirectResolver,
    });
    return { app, auth, db: getFirestore(app) };
  })();
  return services;
};

const toAccount = (user: User): AccountUser => ({
  uid: user.uid,
  name: user.displayName ?? "",
  email: user.email ?? "",
  photoUrl: user.photoURL ?? "",
});

// --- sincronização ------------------------------------------------------------

let stopSync: (() => void) | null = null;

const SYNCED_FIELDS: (keyof LibraryState)[] = ["liked", "recent", "offsets", "unliked", "songs", "removedSongs"];
const pick = (library: LibraryState) => Object.fromEntries(SYNCED_FIELDS.map((key) => [key, library[key]])) as unknown as LibraryState;

const startSync = async (uid: string) => {
  stopSync?.();
  const { db } = await loadServices();
  const { doc, getDoc, onSnapshot, setDoc, serverTimestamp } = await import("firebase/firestore");
  const ref = doc(db, "users", uid);
  set({ sync: "syncing" });

  let timer: ReturnType<typeof setTimeout> | undefined;
  const push = async () => {
    try {
      await setDoc(ref, { ...pick(getLibrary()), updatedAt: serverTimestamp() });
      set({ sync: "synced" });
    } catch {
      set({ sync: "error" });
    }
  };

  try {
    // Primeiro login neste aparelho: junta o que está aqui com o que está na nuvem e salva o resultado.
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) applyRemoteLibrary(snapshot.data() as LibraryState);
    await push();
  } catch {
    set({ sync: "error" });
  }

  const offRemote = onSnapshot(ref, (snapshot) => {
    // Mudanças feitas em outro aparelho (as deste ainda pendentes já estão aplicadas).
    if (snapshot.exists() && !snapshot.metadata.hasPendingWrites) applyRemoteLibrary(snapshot.data() as LibraryState);
  });
  const offLocal = onLocalLibraryChange(() => {
    clearTimeout(timer);
    set({ sync: "syncing" });
    timer = setTimeout(() => void push(), 1500);
  });

  stopSync = () => {
    clearTimeout(timer);
    offRemote();
    offLocal();
    stopSync = null;
  };
};

// --- login --------------------------------------------------------------------

let started = false;

/** Liga o acompanhamento da sessão (chamado uma vez ao abrir o app). */
export const initAuth = async () => {
  if (!isLoginAvailable || started) return;
  started = true;
  try {
    const { auth } = await loadServices();
    const { onAuthStateChanged, getRedirectResult } = await import("firebase/auth");
    // Volta de um login por redirecionamento (quando o navegador bloqueou a janela).
    void getRedirectResult(auth).catch(() => undefined);
    onAuthStateChanged(auth, (user) => {
      set({ user: user ? toAccount(user) : null, ready: true, sync: user ? state.sync : "off" });
      if (user) void startSync(user.uid);
      else stopSync?.();
    });
  } catch {
    set({ ready: true, sync: "error" });
  }
};

export const signInWithGoogle = async () => {
  const { auth } = await loadServices();
  const { GoogleAuthProvider, signInWithCredential, signInWithPopup, signInWithRedirect } = await import("firebase/auth");

  if (Capacitor.isNativePlatform()) {
    // No app Android, o Google não aceita login dentro da WebView: usa o login nativo e repassa o token.
    const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");
    const result = await FirebaseAuthentication.signInWithGoogle();
    const idToken = result.credential?.idToken;
    if (!idToken) throw new Error("login cancelado");
    await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
    return;
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    const code = (error as { code?: string }).code ?? "";
    if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
      await signInWithRedirect(auth, provider);
      return;
    }
    throw error;
  }
};

export const signOutAccount = async () => {
  stopSync?.();
  const { auth } = await loadServices();
  const { signOut } = await import("firebase/auth");
  if (Capacitor.isNativePlatform()) {
    const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");
    await FirebaseAuthentication.signOut().catch(() => undefined);
  }
  await signOut(auth);
};
