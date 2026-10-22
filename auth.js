/*
 * StudyFlow - autenticação (modo demonstração)
 *
 * IMPORTANTE: este módulo roda só no navegador. As contas ficam no
 * localStorage de quem usa o site, então serve para demonstrar o fluxo de
 * login no portfólio, mas NÃO protege dados de verdade.
 *
 * Para um login real, troque o corpo de register(), login(), logout() e
 * currentUser() por chamadas ao Firebase Authentication, ao Supabase Auth
 * ou à sua própria API. O resto do site continua igual, porque só conversa
 * com o objeto Auth exposto no final deste arquivo.
 */
(function (global) {
  'use strict';
 
  const USERS_KEY = 'studyflow.users';
  const SESSION_KEY = 'studyflow.session';
  const LOGIN_PAGE = 'login.html';
  const HOME_PAGE = 'index.html';
  const ITERATIONS = 100000;
  const MIN_PASSWORD = 8;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
 
  class AuthError extends Error {
    constructor(message, field) {
      super(message);
      this.name = 'AuthError';
      this.field = field || null;
    }
  }
 
  /* ---------- armazenamento ---------- */
 
  function store(kind) {
    return kind === 'local' ? global.localStorage : global.sessionStorage;
  }
 
  function load(kind, key) {
    try {
      const raw = store(kind).getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }
 
  function save(kind, key, value) {
    try {
      store(kind).setItem(key, JSON.stringify(value));
    } catch (_) {
      throw new AuthError(
        'Não foi possível salvar os dados neste navegador. Verifique se o armazenamento do site não está bloqueado.'
      );
    }
  }
 
  function remove(kind, key) {
    try {
      store(kind).removeItem(key);
    } catch (_) {
      /* sem armazenamento: nada a remover */
    }
  }
 
  /* ---------- senha (hash com sal) ---------- */
 
  function subtle() {
    const c = global.crypto;
    if (!c || !c.subtle) {
      throw new AuthError(
        'Este navegador não liberou criptografia para esta página. Abra o site por https ou localhost.'
      );
    }
    return c.subtle;
  }
 
  function toHex(bytes) {
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
 
  function randomSalt() {
    return toHex(global.crypto.getRandomValues(new Uint8Array(16)));
  }
 
  async function hashPassword(password, salt) {
    const enc = new TextEncoder();
    const key = await subtle().importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await subtle().deriveBits(
      { name: 'PBKDF2', salt: enc.encode(salt), iterations: ITERATIONS, hash: 'SHA-256' },
      key,
      256
    );
    return toHex(new Uint8Array(bits));
  }
 
  /* ---------- validação ---------- */
 
  function cleanEmail(value) {
    return String(value || '').trim().toLowerCase();
  }
 
  function checkEmail(email) {
    if (!email) throw new AuthError('Informe o seu e-mail.', 'email');
    if (!EMAIL_RE.test(email)) {
      throw new AuthError('Esse e-mail não parece válido. Use o formato nome@exemplo.com.', 'email');
    }
  }
 
  /* ---------- sessão ---------- */
 
  function startSession(user, remember) {
    const session = {
      name: user.name,
      email: user.email,
      demo: Boolean(user.demo),
      startedAt: new Date().toISOString(),
    };
    remove('local', SESSION_KEY);
    remove('session', SESSION_KEY);
    save(remember ? 'local' : 'session', SESSION_KEY, session);
    return session;
  }
 
  function currentUser() {
    const s = load('session', SESSION_KEY) || load('local', SESSION_KEY);
    return s && typeof s.email === 'string' && typeof s.name === 'string' ? s : null;
  }
 
  /* ---------- ações públicas ---------- */
 
  async function register({ name, email, password, remember }) {
    const cleanName = String(name || '').trim().replace(/\s+/g, ' ');
    const mail = cleanEmail(email);
 
    if (cleanName.length < 2) throw new AuthError('Informe seu nome com pelo menos 2 letras.', 'name');
    checkEmail(mail);
    if (String(password || '').length < MIN_PASSWORD) {
      throw new AuthError('A senha precisa ter pelo menos ' + MIN_PASSWORD + ' caracteres.', 'password');
    }
 
    const users = load('local', USERS_KEY) || {};
    if (users[mail]) throw new AuthError('Já existe uma conta com esse e-mail. Tente entrar.', 'email');
 
    const salt = randomSalt();
    users[mail] = {
      name: cleanName,
      email: mail,
      salt: salt,
      hash: await hashPassword(String(password), salt),
      createdAt: new Date().toISOString(),
    };
    save('local', USERS_KEY, users);
    return startSession({ name: cleanName, email: mail }, remember);
  }
 
  async function login({ email, password, remember }) {
    const mail = cleanEmail(email);
    checkEmail(mail);
    if (!password) throw new AuthError('Informe a sua senha.', 'password');
 
    const users = load('local', USERS_KEY) || {};
    const user = users[mail];
    // Calcula o hash mesmo quando a conta não existe, para a resposta
    // demorar o mesmo tempo e a mensagem de erro ser sempre a mesma.
    const hash = await hashPassword(String(password), user ? user.salt : '00');
 
    if (!user || hash !== user.hash) {
      throw new AuthError('E-mail ou senha incorretos. Confira os dados e tente de novo.');
    }
    return startSession({ name: user.name, email: user.email }, remember);
  }
 
  function demoLogin() {
    return startSession({ name: 'Visitante', email: 'demo@studyflow.app', demo: true }, false);
  }
 
  function logout() {
    remove('local', SESSION_KEY);
    remove('session', SESSION_KEY);
    global.location.replace(LOGIN_PAGE);
  }
 
  // Use no <head> das páginas protegidas, antes do conteúdo aparecer.
  function requireLogin() {
    const session = currentUser();
    if (!session) {
      global.document.documentElement.style.visibility = 'hidden';
      global.location.replace(LOGIN_PAGE);
    }
    return session;
  }
 
  // Use na página de login: quem já entrou vai direto para o painel.
  function redirectIfLoggedIn() {
    if (currentUser()) global.location.replace(HOME_PAGE);
  }
 
  global.Auth = {
    register,
    login,
    demoLogin,
    logout,
    currentUser,
    requireLogin,
    redirectIfLoggedIn,
    AuthError,
  };
})(typeof window !== 'undefined' ? window : globalThis);
 