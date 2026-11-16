// Firebase 연결 + 공통 도우미 (방명록 · 개발자 소개)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signInAnonymously, signInWithPopup, GoogleAuthProvider, signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore, collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc,
  query, orderBy, limit, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const app = initializeApp({
  apiKey: 'AIzaSyDRjBUSSrRXe_Jyn3fSY9cFbGJI_lkXwgY',
  authDomain: 'devjeonc-site.firebaseapp.com',
  projectId: 'devjeonc-site',
  appId: '1:389037201638:web:b6a8bdd70298387d7d8327',
});

export const auth = getAuth(app);
export const db = getFirestore(app);
export { collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, orderBy, limit, serverTimestamp };

// 사이트 주인 (Firestore 보안 규칙과 같은 기준 — 화면에 관리 버튼을 보일지만 정함)
const OWNER = 'jeoncassis@gmail.com';
export const isOwner = (u) => !!u && !u.isAnonymous && u.email === OWNER && u.emailVerified;

/** 로그인 상태가 정해지면 한 번 + 바뀔 때마다 호출 */
export function watchUser(cb) { return onAuthStateChanged(auth, cb); }

/** 방명록 글쓰기용: 로그인 안 돼 있으면 익명 로그인 (같은 브라우저에서 내 글 수정 가능) */
export async function ensureUser() {
  if (auth.currentUser) return auth.currentUser;
  return (await signInAnonymously(auth)).user;
}

export async function ownerLogin() {
  await signInWithPopup(auth, new GoogleAuthProvider());
}
export async function logout() { await signOut(auth); }

// ---------------------------------------------------------------- 화면 도우미
export const $ = (s, el = document) => el.querySelector(s);
export const param = (k) => new URLSearchParams(location.search).get(k);

export function fmtDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 글 본문을 안전하게 표시 (HTML 해석 안 함, 주소는 링크로) */
export function renderText(el, text) {
  el.textContent = '';
  const re = /(https?:\/\/[^\s<]+)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    el.append(text.slice(last, m.index));
    const a = document.createElement('a');
    a.href = m[1]; a.textContent = m[1]; a.target = '_blank'; a.rel = 'noopener noreferrer';
    el.append(a);
    last = m.index + m[1].length;
  }
  el.append(text.slice(last));
}

export function toast(msg) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.append(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2500);
}

export function errMsg(e) {
  const c = e && e.code || '';
  if (c.includes('permission-denied')) return '권한이 없어요. (내가 쓴 글이 아니거나, 관리자만 할 수 있는 작업이에요)';
  if (c.includes('popup-closed')) return '로그인 창이 닫혔어요.';
  if (c.includes('unavailable') || c.includes('network')) return '인터넷 연결을 확인해 주세요.';
  return '문제가 생겼어요. 잠시 후 다시 시도해 주세요.';
}

/** 페이지 아래 '관리자 로그인' 줄 */
export function adminBar(el, user) {
  el.textContent = '';
  if (isOwner(user)) {
    el.append('관리자로 로그인됨 · ');
    const b = document.createElement('button'); b.className = 'link'; b.textContent = '로그아웃';
    b.onclick = () => logout().catch((e) => toast(errMsg(e)));
    el.append(b);
  } else {
    const b = document.createElement('button'); b.className = 'link'; b.textContent = '관리자 로그인';
    b.onclick = () => ownerLogin().catch((e) => toast(errMsg(e)));
    el.append(b);
  }
}
