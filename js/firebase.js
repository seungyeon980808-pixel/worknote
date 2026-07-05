// ===== FIREBASE INIT =====
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  onAuthStateChanged, signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyAbHRNi10RttJNoLJCuxZQHucwp5Vttn90',
  authDomain: 'edunote-96bd7.firebaseapp.com',
  projectId: 'edunote-96bd7',
  storageBucket: 'edunote-96bd7.firebasestorage.app',
  messagingSenderId: '769455023609',
  appId: '1:769455023609:web:48fc29f58bf069acaa0928',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// 오프라인 캐시 + 탭 간 공유: 비행기 모드에서도 조회/입력 가능, 온라인 복귀 시 자동 동기화
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

export function watchAuth(cb) {
  return onAuthStateChanged(auth, cb);
}

export async function login() {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    // 팝업이 차단된 환경(일부 모바일 브라우저)은 리다이렉트로 대체
    await signInWithRedirect(auth, provider);
  }
}

export function logout() {
  return signOut(auth);
}
