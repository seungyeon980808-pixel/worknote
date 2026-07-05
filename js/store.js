// ===== FIRESTORE STORE =====
// 경로 구조: users/{uid}/items/{id}, users/{uid}/secrets/{id}
import { db } from './firebase.js';
import {
  collection, doc, addDoc, updateDoc, deleteDoc, setDoc, onSnapshot,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const now = () => new Date().toISOString();
const itemsCol = uid => collection(db, 'users', uid, 'items');
const secretsCol = uid => collection(db, 'users', uid, 'secrets');

// ===== ITEMS =====
export function subscribeItems(uid, cb) {
  return onSnapshot(
    itemsCol(uid),
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    err => console.error('items subscribe error', err)
  );
}
export function addItem(uid, data) {
  return addDoc(itemsCol(uid), { ...data, createdAt: now(), updatedAt: now() });
}
export function updateItem(uid, id, patch) {
  return updateDoc(doc(db, 'users', uid, 'items', id), { ...patch, updatedAt: now() });
}
export function deleteItem(uid, id) {
  return deleteDoc(doc(db, 'users', uid, 'items', id));
}

// ===== SECRETS =====
export function subscribeSecrets(uid, cb) {
  return onSnapshot(
    secretsCol(uid),
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    err => console.error('secrets subscribe error', err)
  );
}
export function addSecret(uid, data) {
  return addDoc(secretsCol(uid), { ...data, createdAt: now(), updatedAt: now() });
}
export function updateSecret(uid, id, patch) {
  return updateDoc(doc(db, 'users', uid, 'secrets', id), { ...patch, updatedAt: now() });
}
export function deleteSecret(uid, id) {
  return deleteDoc(doc(db, 'users', uid, 'secrets', id));
}
// 금고 암호 검증용 문서(id 고정: _check)
export function setSecretCheck(uid, data) {
  return setDoc(doc(db, 'users', uid, 'secrets', '_check'), { ...data, updatedAt: now() });
}
