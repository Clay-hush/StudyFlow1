/* StudyFlow - comportamento da tela de login e cadastro */
(function () {
  'use strict';
 
  if (!window.Auth) return;
  Auth.redirectIfLoggedIn();
 
  const $ = (id) => document.getElementById(id);
 
  const form = $('auth-form');
  const fields = {
    name: $('name'),
    email: $('email'),
    password: $('password'),
    confirm: $('confirm'),
  };
  const remember = $('remember');
  const submit = $('submit');
  const demoBtn = $('demo-btn');
  const switchBtn = $('switch-btn');
  const switchText = $('switch-text');
  const formError = $('form-error');
  const reveal = $('reveal');
 
  const COPY = {
    login: {
      pageTitle: 'Entrar | StudyFlow',
      title: 'Entrar no StudyFlow',
      subtitle: 'Continue de onde você parou.',
      submit: 'Entrar',
      busy: 'Entrando…',
      switchText: 'Ainda não tem conta?',
      switchBtn: 'Criar conta',
      autocomplete: 'current-password',
    },
    register: {
      pageTitle: 'Criar conta | StudyFlow',
      title: 'Criar sua conta',
      subtitle: 'Leva menos de um minuto.',
      submit: 'Criar conta',
      busy: 'Criando conta…',
      switchText: 'Já tem conta?',
      switchBtn: 'Entrar',
      autocomplete: 'new-password',
    },
  };
 
  let mode = 'login';
 
  /* ---------- erros ---------- */
 
  function showFormError(message) {
    formError.textContent = message;
    formError.hidden = false;
  }
 
  function showFieldError(field, message) {
    const input = fields[field];
    const out = $(field + '-error');
    if (!input || !out) {
      showFormError(message);
      return;
    }
    input.setAttribute('aria-invalid', 'true');
    out.textContent = message;
    out.hidden = false;
  }
 
  function clearFieldError(field) {
    const input = fields[field];
    const out = $(field + '-error');
    input.removeAttribute('aria-invalid');
    if (out) {
      out.textContent = '';
      out.hidden = true;
    }
  }
 
  function clearErrors() {
    Object.keys(fields).forEach(clearFieldError);
    formError.textContent = '';
    formError.hidden = true;
  }
 
  Object.keys(fields).forEach((name) => {
    fields[name].addEventListener('input', () => clearFieldError(name));
  });
 
  /* ---------- modo: entrar ou criar conta ---------- */
 
  function setMode(next) {
    mode = next;
    const copy = COPY[next];
    const isRegister = next === 'register';
 
    document.title = copy.pageTitle;
    $('auth-title').textContent = copy.title;
    $('auth-subtitle').textContent = copy.subtitle;
    submit.textContent = copy.submit;
    switchText.textContent = copy.switchText;
    switchBtn.textContent = copy.switchBtn;
    fields.password.autocomplete = copy.autocomplete;
 
    document.querySelectorAll('[data-only="register"]').forEach((el) => {
      el.hidden = !isRegister;
      el.querySelectorAll('input').forEach((input) => {
        input.disabled = !isRegister;
      });
    });
 
    clearErrors();
 
    try {
      history.replaceState(null, '', isRegister ? '#cadastro' : location.pathname + location.search);
    } catch (_) {
      /* alguns navegadores bloqueiam isso em file:// */
    }
  }
 
  switchBtn.addEventListener('click', () => {
    setMode(mode === 'login' ? 'register' : 'login');
    (mode === 'register' ? fields.name : fields.email).focus();
  });
 
  /* ---------- mostrar / ocultar senha ---------- */
 
  reveal.addEventListener('click', () => {
    const show = fields.password.type === 'password';
    fields.password.type = show ? 'text' : 'password';
    fields.confirm.type = show ? 'text' : 'password';
    reveal.textContent = show ? 'Ocultar' : 'Mostrar';
    reveal.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
  });
 
  /* ---------- envio ---------- */
 
  function setBusy(busy) {
    submit.disabled = busy;
    demoBtn.disabled = busy;
    submit.textContent = busy ? COPY[mode].busy : COPY[mode].submit;
  }
 
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors();
 
    if (mode === 'register' && fields.password.value !== fields.confirm.value) {
      showFieldError('confirm', 'As senhas não são iguais. Digite a mesma senha nos dois campos.');
      fields.confirm.focus();
      return;
    }
 
    setBusy(true);
    try {
      const data = {
        name: fields.name.value,
        email: fields.email.value,
        password: fields.password.value,
        remember: remember.checked,
      };
      if (mode === 'register') {
        await Auth.register(data);
      } else {
        await Auth.login(data);
      }
      window.location.assign('index.html');
    } catch (err) {
      setBusy(false);
      if (err && err.name === 'AuthError') {
        if (err.field && fields[err.field] && !fields[err.field].disabled) {
          showFieldError(err.field, err.message);
          fields[err.field].focus();
        } else {
          showFormError(err.message);
        }
      } else {
        console.error(err);
        showFormError('Algo deu errado. Tente novamente em instantes.');
      }
    }
  });
 
  demoBtn.addEventListener('click', () => {
    clearErrors();
    try {
      Auth.demoLogin();
      window.location.assign('index.html');
    } catch (err) {
      showFormError(err && err.message ? err.message : 'Não foi possível abrir a conta de demonstração.');
    }
  });
 
  /* ---------- início ---------- */
 
  setMode(location.hash === '#cadastro' ? 'register' : 'login');
})();
 