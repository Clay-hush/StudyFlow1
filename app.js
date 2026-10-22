(() => {
  'use strict';

  const STORAGE_KEY = 'studyflow-v1';
  const COLORS = ['purple', 'blue', 'green', 'orange', 'pink'];
  const PRIORITIES = {
    high: 'Alta',
    medium: 'Média',
    low: 'Baixa'
  };

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

  const makeId = () =>
    window.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  function dateOffset(days) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + days);

    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');
  }

  function initialData() {
    const subjects = [
      { id: 'python', name: 'Python', color: 'purple' },
      { id: 'web', name: 'HTML e CSS', color: 'blue' },
      { id: 'database', name: 'Banco de Dados', color: 'green' },
      { id: 'javascript', name: 'JavaScript', color: 'orange' },
      { id: 'algorithms', name: 'Algoritmos', color: 'pink' }
    ];

    const tasks = [
      {
        id: makeId(),
        title: 'Praticar funções em Python',
        subjectId: 'python',
        dueDate: dateOffset(0),
        priority: 'high',
        notes: '',
        completed: false,
        createdAt: Date.now() - 4000
      },
      {
        id: makeId(),
        title: 'Revisar estrutura HTML',
        subjectId: 'web',
        dueDate: dateOffset(1),
        priority: 'medium',
        notes: '',
        completed: false,
        createdAt: Date.now() - 3000
      },
      {
        id: makeId(),
        title: 'Estudar modelagem de dados',
        subjectId: 'database',
        dueDate: dateOffset(2),
        priority: 'high',
        notes: '',
        completed: false,
        createdAt: Date.now() - 2000
      },
      {
        id: makeId(),
        title: 'Resolver exercícios de lógica',
        subjectId: 'algorithms',
        dueDate: dateOffset(4),
        priority: 'low',
        notes: '',
        completed: false,
        createdAt: Date.now() - 1000
      }
    ];

    return {
      subjects,
      tasks,
      sessions: []
    };
  }

  function loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        return initialData();
      }

      const parsed = JSON.parse(saved);

      if (
        !parsed ||
        !Array.isArray(parsed.subjects) ||
        !Array.isArray(parsed.tasks)
      ) {
        return initialData();
      }

      return {
        subjects: parsed.subjects.filter(subject =>
          subject &&
          typeof subject.id === 'string' &&
          typeof subject.name === 'string' &&
          COLORS.includes(subject.color)
        ),

        tasks: parsed.tasks.filter(task =>
          task &&
          typeof task.id === 'string' &&
          typeof task.title === 'string'
        ),

        sessions: Array.isArray(parsed.sessions)
          ? parsed.sessions.filter(session =>
              session &&
              Number.isFinite(session.minutes) &&
              typeof session.date === 'string'
            )
          : []
      };
    } catch (error) {
      console.error('Erro ao carregar os dados:', error);
      return initialData();
    }
  }

  let data = loadData();
  let toastTimer;

  function saveData() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
      );

      return true;
    } catch (error) {
      console.error('Erro ao salvar os dados:', error);

      showToast(
        'Não foi possível salvar os dados no navegador.'
      );

      return false;
    }
  }

  function escapeHTML(value = '') {
    return String(value).replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]);
  }

  function getSubject(id) {
    return data.subjects.find(
      subject => subject.id === id
    );
  }

  function formatDate(value) {
    if (!value) return '';

    const [year, month, day] = value.split('-').map(Number);

    if (!year || !month || !day) return '';

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short'
    })
      .format(new Date(year, month - 1, day))
      .replace('.', '');
  }

  function showToast(message) {
    let toast = $('#sf-toast');

    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'sf-toast';
      toast.className = 'sf-toast';
      toast.setAttribute('role', 'status');

      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('visible');

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toast.classList.remove('visible');
    }, 2800);
  }

  function injectStyles() {
    if ($('#sf-dynamic-styles')) return;

    const style = document.createElement('style');
    style.id = 'sf-dynamic-styles';

    style.textContent = `
      .sf-toolbar {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
        margin: -8px 0 10px;
      }

      .sf-toolbar select,
      .sf-field input,
      .sf-field select,
      .sf-field textarea {
        width: 100%;
        padding: 10px 11px;
        border: 1px solid #e3e3ee;
        border-radius: 8px;
        background: #fff;
        color: #24243a;
        font: inherit;
      }

      .sf-toolbar select {
        width: auto;
        max-width: 100%;
        font-size: 12px;
      }

      .sf-button {
        border: 0;
        border-radius: 8px;
        padding: 10px 13px;
        background: #6558d3;
        color: #fff;
        font: inherit;
        font-size: 12px;
        font-weight: 650;
        cursor: pointer;
      }

      .sf-button.secondary {
        background: #f0effb;
        color: #6558d3;
      }

      .sf-button:disabled {
        opacity: .45;
        cursor: not-allowed;
      }

      .sf-dialog {
        width: min(480px, calc(100% - 28px));
        max-width: none;
        max-height: 90vh;
        overflow: auto;
        border: 0;
        border-radius: 16px;
        padding: 0;
        color: #24243a;
        box-shadow: 0 20px 70px #17172c30;
      }

      .sf-dialog::backdrop {
        background: #17172c66;
        backdrop-filter: blur(2px);
      }

      .sf-dialog-card {
        padding: 24px;
      }

      .sf-dialog-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 18px;
      }

      .sf-dialog-head h2 {
        font-size: 19px;
      }

      .sf-close {
        border: 0;
        background: transparent;
        font-size: 24px;
        cursor: pointer;
        color: #777;
      }

      .sf-form {
        display: grid;
        gap: 14px;
      }

      .sf-field {
        display: grid;
        gap: 6px;
        font-size: 12px;
        font-weight: 650;
      }

      .sf-field textarea {
        min-height: 76px;
        resize: vertical;
      }

      .sf-form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .sf-form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 9px;
        margin-top: 4px;
      }

      .sf-task-check {
        width: 16px;
        height: 16px;
        accent-color: #6558d3;
        flex-shrink: 0;
        cursor: pointer;
      }

      .sf-task-item.is-complete .task-details h3 {
        text-decoration: line-through;
        color: #85869a;
      }

      .sf-task-item.is-complete {
        opacity: .72;
      }

      .sf-task-actions,
      .sf-subject-actions {
        display: flex;
        gap: 5px;
        align-items: center;
      }

      .sf-icon-button {
        border: 0;
        background: #f6f5fb;
        color: #77758e;
        border-radius: 7px;
        width: 28px;
        height: 28px;
        cursor: pointer;
        font-size: 15px;
        flex-shrink: 0;
      }

      .sf-icon-button:hover {
        background: #eeebff;
        color: #6558d3;
      }

      .sf-icon-button.delete:hover {
        background: #fff0ee;
        color: #d85d55;
      }

      .sf-icon-button:disabled {
        opacity: .25;
        cursor: not-allowed;
      }

      .sf-subject-top {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }

      .sf-subject-top .subject-heading {
        flex: 1;
        margin: 0;
      }

      .sf-subject-meta {
        display: flex;
        justify-content: space-between;
        color: #85869a;
        font-size: 10px;
        margin-top: 6px;
      }

      .sf-empty {
        padding: 18px 8px;
        text-align: center;
        color: #85869a;
        font-size: 12px;
      }

      .sf-subject-add {
        width: auto !important;
        margin: 0 !important;
        padding: 8px 10px !important;
      }

      .sf-time-button {
        margin-left: auto;
        white-space: nowrap;
      }

      .sf-toast {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 9999;
        max-width: min(360px, calc(100% - 40px));
        padding: 12px 16px;
        border-radius: 10px;
        background: #24243a;
        color: white;
        box-shadow: 0 8px 30px #17172c30;
        opacity: 0;
        transform: translateY(8px);
        pointer-events: none;
        transition: .2s;
        font-size: 13px;
      }

      .sf-toast.visible {
        opacity: 1;
        transform: translateY(0);
      }

      .task-details {
        overflow-wrap: anywhere;
      }

      @media (max-width: 500px) {
        .sf-form-grid {
          grid-template-columns: 1fr;
        }

        .sf-dialog-card {
          padding: 19px;
        }

        .sf-task-actions {
          gap: 3px;
        }

        .sf-icon-button {
          width: 25px;
          height: 25px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function ensureDialog() {
    let dialog = $('#sf-dialog');

    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'sf-dialog';
      dialog.className = 'sf-dialog';

      document.body.appendChild(dialog);
    }

    return dialog;
  }

  function openDialog(title, body, onSubmit) {
    const dialog = ensureDialog();

    dialog.innerHTML = `
      <div class="sf-dialog-card">
        <div class="sf-dialog-head">
          <h2>${escapeHTML(title)}</h2>
          <button
            class="sf-close"
            type="button"
            data-dialog-close
            aria-label="Fechar"
          >×</button>
        </div>

        ${body}
      </div>
    `;

    dialog.showModal();

    const form = $('form', dialog);

    if (form && onSubmit) {
      form.addEventListener('submit', onSubmit);
    }

    $$('[data-dialog-close]', dialog).forEach(button => {
      button.addEventListener('click', () => dialog.close());
    });

    dialog.addEventListener('click', function closeOutside(event) {
      if (event.target === dialog) {
        dialog.close();
      }
    }, { once: true });

    return dialog;
  }

  function openTaskForm(task = null) {
    if (!data.subjects.length) {
      showToast(
        'Cadastre uma disciplina antes de criar uma tarefa.'
      );

      openSubjectForm();
      return;
    }

    const subjectOptions = data.subjects.map(subject => `
      <option
        value="${escapeHTML(subject.id)}"
        ${subject.id === (task?.subjectId || data.subjects[0].id)
          ? 'selected'
          : ''}
      >
        ${escapeHTML(subject.name)}
      </option>
    `).join('');

    const body = `
      <form id="sf-task-form" class="sf-form">
        <label class="sf-field">
          Título da tarefa
          <input
            name="title"
            maxlength="100"
            required
            value="${escapeHTML(task?.title || '')}"
            placeholder="Ex.: Revisar funções em Python"
          >
        </label>

        <label class="sf-field">
          Disciplina
          <select name="subjectId" required>
            ${subjectOptions}
          </select>
        </label>

        <div class="sf-form-grid">
          <label class="sf-field">
            Prioridade
            <select name="priority">
              <option value="low" ${task?.priority === 'low' ? 'selected' : ''}>
                Baixa
              </option>
              <option value="medium" ${!task || task.priority === 'medium' ? 'selected' : ''}>
                Média
              </option>
              <option value="high" ${task?.priority === 'high' ? 'selected' : ''}>
                Alta
              </option>
            </select>
          </label>

          <label class="sf-field">
            Prazo
            <input
              name="dueDate"
              type="date"
              value="${escapeHTML(task?.dueDate || '')}"
            >
          </label>
        </div>

        <label class="sf-field">
          Observações
          <textarea
            name="notes"
            maxlength="500"
            placeholder="Detalhes opcionais"
          >${escapeHTML(task?.notes || '')}</textarea>
        </label>

        <div class="sf-form-actions">
          <button
            class="sf-button secondary"
            type="button"
            data-dialog-close
          >Cancelar</button>

          <button class="sf-button" type="submit">
            ${task ? 'Salvar alterações' : 'Adicionar tarefa'}
          </button>
        </div>
      </form>
    `;

    const dialog = openDialog(
      task ? 'Editar tarefa' : 'Nova tarefa',
      body,
      event => {
        event.preventDefault();

        const values = new FormData(event.currentTarget);
        const title = String(values.get('title') || '').trim();
        const subjectId = String(values.get('subjectId') || '');

        if (!title || !getSubject(subjectId)) return;

        const record = {
          id: task?.id || makeId(),
          title,
          subjectId,
          priority: ['high', 'medium', 'low'].includes(
            values.get('priority')
          ) ? values.get('priority') : 'medium',
          dueDate: String(values.get('dueDate') || ''),
          notes: String(values.get('notes') || '').trim(),
          completed: task?.completed || false,
          createdAt: task?.createdAt || Date.now()
        };

        if (task) {
          data.tasks = data.tasks.map(item =>
            item.id === task.id ? record : item
          );
        } else {
          data.tasks.push(record);
        }

        if (saveData()) {
          dialog.close();
          render();

          showToast(
            task ? 'Tarefa atualizada.' : 'Tarefa adicionada.'
          );
        }
      }
    );

    $('[name="title"]', dialog)?.focus();
  }

  function openSubjectForm(subject = null) {
    const colorLabels = {
      purple: 'Roxo',
      blue: 'Azul',
      green: 'Verde',
      orange: 'Laranja',
      pink: 'Rosa'
    };

    const body = `
      <form id="sf-subject-form" class="sf-form">
        <label class="sf-field">
          Nome da disciplina
          <input
            name="name"
            maxlength="60"
            required
            value="${escapeHTML(subject?.name || '')}"
            placeholder="Ex.: Desenvolvimento Web"
          >
        </label>

        <label class="sf-field">
          Cor de identificação
          <select name="color">
            ${COLORS.map(color => `
              <option
                value="${color}"
                ${(subject?.color || 'purple') === color ? 'selected' : ''}
              >
                ${colorLabels[color]}
              </option>
            `).join('')}
          </select>
        </label>

        <div class="sf-form-actions">
          <button
            class="sf-button secondary"
            type="button"
            data-dialog-close
          >Cancelar</button>

          <button class="sf-button" type="submit">
            ${subject ? 'Salvar alterações' : 'Adicionar disciplina'}
          </button>
        </div>
      </form>
    `;

    const dialog = openDialog(
      subject ? 'Editar disciplina' : 'Nova disciplina',
      body,
      event => {
        event.preventDefault();

        const values = new FormData(event.currentTarget);
        const name = String(values.get('name') || '').trim();
        const color = String(values.get('color') || 'purple');

        if (!name || !COLORS.includes(color)) return;

        const duplicate = data.subjects.some(item =>
          item.id !== subject?.id &&
          item.name.toLocaleLowerCase('pt-BR') ===
            name.toLocaleLowerCase('pt-BR')
        );

        if (duplicate) {
          showToast('Já existe uma disciplina com esse nome.');
          return;
        }

        if (subject) {
          data.subjects = data.subjects.map(item =>
            item.id === subject.id
              ? { ...item, name, color }
              : item
          );
        } else {
          data.subjects.push({
            id: makeId(),
            name,
            color
          });
        }

        if (saveData()) {
          dialog.close();
          render();

          showToast(
            subject
              ? 'Disciplina atualizada.'
              : 'Disciplina adicionada.'
          );
        }
      }
    );

    $('[name="name"]', dialog)?.focus();
  }

  function openStudyTimeForm() {
    const body = `
      <form id="sf-time-form" class="sf-form">
        <p style="font-size:12px;color:#85869a">
          Registre o tempo dedicado aos estudos hoje.
          O total semanal será atualizado automaticamente.
        </p>

        <label class="sf-field">
          Duração em minutos
          <input
            name="minutes"
            type="number"
            min="1"
            max="1440"
            step="1"
            required
            placeholder="Ex.: 45"
          >
        </label>

        <div class="sf-form-actions">
          <button
            class="sf-button secondary"
            type="button"
            data-dialog-close
          >Cancelar</button>

          <button class="sf-button" type="submit">
            Registrar tempo
          </button>
        </div>
      </form>
    `;

    const dialog = openDialog(
      'Registrar tempo de estudo',
      body,
      event => {
        event.preventDefault();

        const values = new FormData(event.currentTarget);
        const minutes = Number(values.get('minutes'));

        if (
          !Number.isInteger(minutes) ||
          minutes < 1 ||
          minutes > 1440
        ) {
          showToast('Informe um tempo entre 1 e 1440 minutos.');
          return;
        }

        data.sessions.push({
          id: makeId(),
          minutes,
          date: dateOffset(0)
        });

        if (saveData()) {
          dialog.close();
          renderStats();
          showToast('Tempo de estudo registrado.');
        }
      }
    );

    $('[name="minutes"]', dialog)?.focus();
  }

  function startOfWeek(date) {
    const result = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    const weekday = result.getDay();

    result.setDate(
      result.getDate() - (weekday === 0 ? 6 : weekday - 1)
    );

    result.setHours(0, 0, 0, 0);

    return result;
  }

  function weeklyMinutes() {
    const start = startOfWeek(new Date());
    const end = new Date(start);

    end.setDate(end.getDate() + 7);

    return data.sessions.reduce((sum, session) => {
      const [year, month, day] = session.date.split('-').map(Number);
      const date = new Date(year, month - 1, day);

      return date >= start && date < end
        ? sum + session.minutes
        : sum;
    }, 0);
  }

  function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;

    return `${hours}h ${String(remaining).padStart(2, '0')}min`;
  }

  function renderStats() {
    const cards = $$('.stats-grid .stat-card');

    const totalTasks = data.tasks.length;
    const completed = data.tasks.filter(
      task => task.completed
    ).length;

    const pending = totalTasks - completed;

    const progress = totalTasks
      ? Math.round((completed / totalTasks) * 100)
      : 0;

    const values = [
      data.subjects.length,
      pending,
      formatDuration(weeklyMinutes()),
      `${progress}%`
    ];

    const descriptions = [
      'Matérias em andamento',
      'Atividades para concluir',
      'Total nesta semana',
      `${completed} de ${totalTasks} tarefas concluídas`
    ];

    cards.forEach((card, index) => {
      const value = $('.stat-value', card);
      const description = $('.stat-description', card);

      if (value) value.textContent = values[index] ?? '';
      if (description) {
        description.textContent = descriptions[index] ?? '';
      }
    });

    const navCount = $('.nav-count');

    if (navCount) {
      navCount.textContent = pending;
    }

    const eyebrow = $('.eyebrow');

    if (eyebrow) {
      eyebrow.textContent = new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long'
      })
        .format(new Date())
        .toLocaleUpperCase('pt-BR');
    }
  }

  function renderTasks() {
    const list = $('.tasks-panel .task-list');

    if (!list) return;

    const statusFilter =
      $('#sf-status-filter')?.value || 'all';

    const subjectFilter =
      $('#sf-task-subject-filter')?.value || 'all';

    const tasks = data.tasks
      .filter(task => {
        if (
          statusFilter === 'pending' &&
          task.completed
        ) return false;

        if (
          statusFilter === 'completed' &&
          !task.completed
        ) return false;

        if (
          subjectFilter !== 'all' &&
          task.subjectId !== subjectFilter
        ) return false;

        return true;
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) {
          return Number(a.completed) - Number(b.completed);
        }

        if (
          a.dueDate &&
          b.dueDate &&
          a.dueDate !== b.dueDate
        ) {
          return a.dueDate.localeCompare(b.dueDate);
        }

        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;

        return (a.createdAt || 0) - (b.createdAt || 0);
      });

    list.innerHTML = tasks.map(task => {
      const subject = getSubject(task.subjectId);
      const color = subject?.color || 'purple';

      let dueLabel = 'Sem prazo';

      if (task.dueDate) {
        const today = dateOffset(0);
        const tomorrow = dateOffset(1);

        dueLabel = task.dueDate === today
          ? 'Hoje'
          : task.dueDate === tomorrow
            ? 'Amanhã'
            : formatDate(task.dueDate);
      }

      return `
        <div class="task-item sf-task-item ${task.completed ? 'is-complete' : ''}"
             data-id="${escapeHTML(task.id)}">

          <input
            class="sf-task-check"
            type="checkbox"
            data-action="toggle-task"
            data-id="${escapeHTML(task.id)}"
            aria-label="Marcar tarefa como concluída"
            ${task.completed ? 'checked' : ''}
          >

          <span class="task-marker ${color}-marker"></span>

          <div class="task-details">
            <h3>${escapeHTML(task.title)}</h3>

            <p>
              ${escapeHTML(subject?.name || 'Disciplina removida')}
              · ${escapeHTML(dueLabel)}
              ${task.notes ? ` · ${escapeHTML(task.notes)}` : ''}
            </p>
          </div>

          <span class="priority ${PRIORITIES[task.priority] ? task.priority : 'medium'}">
            ${PRIORITIES[task.priority] || 'Média'}
          </span>

          <div class="sf-task-actions">
            <button
              class="sf-icon-button"
              type="button"
              data-action="edit-task"
              data-id="${escapeHTML(task.id)}"
              aria-label="Editar tarefa"
              title="Editar"
            >✎</button>

            <button
              class="sf-icon-button delete"
              type="button"
              data-action="delete-task"
              data-id="${escapeHTML(task.id)}"
              aria-label="Excluir tarefa"
              title="Excluir"
            >×</button>
          </div>
        </div>
      `;
    }).join('');

    if (!tasks.length) {
      list.innerHTML = `
        <p class="sf-empty">
          Nenhuma tarefa encontrada.
          Adicione uma tarefa ou altere os filtros.
        </p>
      `;
    }

    const link = $('.tasks-panel .panel-header .text-link');

    if (link) {
      link.textContent = `Ver todas (${data.tasks.length})`;
    }
  }

  function renderSubjects() {
    const panel = $('.subjects-panel');

    if (!panel) return;

    $$('.subject-item', panel).forEach(item => item.remove());

    let list = $('#sf-subject-list');

    if (!list) {
      list = document.createElement('div');
      list.id = 'sf-subject-list';
      panel.appendChild(list);
    }

    list.innerHTML = data.subjects.map(subject => {
      const tasks = data.tasks.filter(
        task => task.subjectId === subject.id
      );

      const completed = tasks.filter(
        task => task.completed
      ).length;

      const progress = tasks.length
        ? Math.round((completed / tasks.length) * 100)
        : 0;

      const canDelete = tasks.length === 0;

      return `
        <div class="subject-item">
          <div class="sf-subject-top">
            <div class="subject-heading">
              <span class="subject-dot ${subject.color}-marker"></span>

              <span class="subject-name">
                ${escapeHTML(subject.name)}
              </span>

              <strong>${progress}%</strong>
            </div>

            <div class="sf-subject-actions">
              <button
                class="sf-icon-button"
                type="button"
                data-action="edit-subject"
                data-id="${escapeHTML(subject.id)}"
                aria-label="Editar disciplina"
                title="Editar"
              >✎</button>

              <button
                class="sf-icon-button delete"
                type="button"
                data-action="delete-subject"
                data-id="${escapeHTML(subject.id)}"
                aria-label="Excluir disciplina"
                title="Excluir"
                ${canDelete ? '' : 'disabled'}
              >×</button>
            </div>
          </div>

          <div
            class="progress-track"
            role="progressbar"
            aria-label="Progresso de ${escapeHTML(subject.name)}"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow="${progress}"
          >
            <div
              class="progress-fill ${subject.color}-fill"
              style="width:${progress}%"
            ></div>
          </div>

          <div class="sf-subject-meta">
            <span>${completed} de ${tasks.length} concluída(s)</span>
            <span>${tasks.length - completed} pendente(s)</span>
          </div>
        </div>
      `;
    }).join('');

    if (!data.subjects.length) {
      list.innerHTML = `
        <p class="sf-empty">
          Nenhuma disciplina cadastrada.
        </p>
      `;
    }
  }

  function renderFilters() {
    const panel = $('.tasks-panel');

    if (!panel) return;

    let toolbar = $('#sf-task-toolbar');

    if (!toolbar) {
      toolbar = document.createElement('div');
      toolbar.id = 'sf-task-toolbar';
      toolbar.className = 'sf-toolbar';

      const header = $('.panel-header', panel);

      header?.insertAdjacentElement('afterend', toolbar);
    }

    const oldStatus =
      $('#sf-status-filter')?.value || 'all';

    const oldSubject =
      $('#sf-task-subject-filter')?.value || 'all';

    toolbar.innerHTML = `
      <select
        id="sf-status-filter"
        aria-label="Filtrar tarefas por status"
      >
        <option value="all">Todas as tarefas</option>
        <option value="pending">Pendentes</option>
        <option value="completed">Concluídas</option>
      </select>

      <select
        id="sf-task-subject-filter"
        aria-label="Filtrar tarefas por disciplina"
      >
        <option value="all">Todas as disciplinas</option>

        ${data.subjects.map(subject => `
          <option value="${escapeHTML(subject.id)}">
            ${escapeHTML(subject.name)}
          </option>
        `).join('')}
      </select>
    `;

    $('#sf-status-filter').value = oldStatus;

    $('#sf-task-subject-filter').value =
      data.subjects.some(subject => subject.id === oldSubject)
        ? oldSubject
        : 'all';
  }

  function addInterfaceControls() {
    const subjectHeader = $('.subjects-panel .panel-header');

    if (subjectHeader && !$('#sf-add-subject')) {
      const button = document.createElement('button');

      button.id = 'sf-add-subject';
      button.type = 'button';
      button.className = 'primary-button sf-subject-add';
      button.textContent = '+ Disciplina';

      subjectHeader.appendChild(button);
    }

    const focusCard = $('.focus-card');

    if (focusCard && !$('#sf-add-time')) {
      const button = document.createElement('button');

      button.id = 'sf-add-time';
      button.type = 'button';
      button.className = 'sf-button sf-time-button';
      button.textContent = '+ Registrar tempo';

      focusCard.appendChild(button);
    }
  }

  function render() {
    renderFilters();
    renderStats();
    renderTasks();
    renderSubjects();
  }

  function bindEvents() {
    $('.tasks-panel .primary-button')?.addEventListener(
      'click',
      () => openTaskForm()
    );

    $('#sf-add-subject')?.addEventListener(
      'click',
      () => openSubjectForm()
    );

    $('#sf-add-time')?.addEventListener(
      'click',
      openStudyTimeForm
    );

    $('.tasks-panel .panel-header .text-link')
      ?.addEventListener('click', event => {
        event.preventDefault();

        if ($('#sf-status-filter')) {
          $('#sf-status-filter').value = 'all';
        }

        if ($('#sf-task-subject-filter')) {
          $('#sf-task-subject-filter').value = 'all';
        }

        renderTasks();
      });

    $('.tasks-panel')?.addEventListener('click', event => {
      const button = event.target.closest('button[data-action]');

      if (!button) return;

      const task = data.tasks.find(
        item => item.id === button.dataset.id
      );

      if (!task) return;

      if (button.dataset.action === 'edit-task') {
        openTaskForm(task);
      }

      if (button.dataset.action === 'delete-task') {
        if (!confirm(`Deseja excluir a tarefa "${task.title}"?`)) {
          return;
        }

        data.tasks = data.tasks.filter(
          item => item.id !== task.id
        );

        if (saveData()) {
          render();
          showToast('Tarefa excluída.');
        }
      }
    });

    $('.tasks-panel')?.addEventListener('change', event => {
      if (
        event.target.id === 'sf-status-filter' ||
        event.target.id === 'sf-task-subject-filter'
      ) {
        renderTasks();
        return;
      }

      const checkbox = event.target.closest(
        '[data-action="toggle-task"]'
      );

      if (!checkbox) return;

      const task = data.tasks.find(
        item => item.id === checkbox.dataset.id
      );

      if (!task) return;

      task.completed = checkbox.checked;

      if (saveData()) {
        render();

        showToast(
          task.completed
            ? 'Tarefa concluída.'
            : 'Tarefa reaberta.'
        );
      }
    });

    $('.subjects-panel')?.addEventListener('click', event => {
      const button = event.target.closest('button[data-action]');

      if (!button) return;

      const subject = getSubject(button.dataset.id);

      if (!subject) return;

      if (button.dataset.action === 'edit-subject') {
        openSubjectForm(subject);
      }

      if (button.dataset.action === 'delete-subject') {
        const hasTasks = data.tasks.some(
          task => task.subjectId === subject.id
        );

        if (hasTasks) {
          showToast(
            'Não é possível excluir uma disciplina que possui tarefas.'
          );
          return;
        }

        if (!confirm(`Deseja excluir a disciplina "${subject.name}"?`)) {
          return;
        }

        data.subjects = data.subjects.filter(
          item => item.id !== subject.id
        );

        if (saveData()) {
          render();
          showToast('Disciplina excluída.');
        }
      }
    });

    $$('.nav-item').forEach(link => {
      link.addEventListener('click', () => {
        $$('.nav-item').forEach(item => {
          item.classList.toggle('active', item === link);
        });
      });
    });
  }

  injectStyles();
  addInterfaceControls();
  render();
  bindEvents();
})();