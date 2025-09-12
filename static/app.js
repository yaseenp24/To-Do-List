function $(selector, root = document) {
  return root.querySelector(selector);
}

function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = 'task';
  li.dataset.id = task.id;
  li.dataset.completed = String(task.completed ? 1 : 0);

  const label = document.createElement('label');
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'toggle';
  checkbox.checked = !!task.completed;
  const span = document.createElement('span');
  span.className = 'title';
  span.textContent = task.title;
  label.appendChild(checkbox);
  label.appendChild(span);

  const del = document.createElement('button');
  del.className = 'delete';
  del.textContent = '✕';
  del.setAttribute('aria-label', 'Delete');

  li.appendChild(label);
  li.appendChild(del);
  return li;
}

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}

window.addEventListener('DOMContentLoaded', () => {
  const form = $('#add-form');
  const list = $('#task-list');
  const titleInput = $('#chore-title');
  const dateInput = $('#chore-date');
  const timeInput = $('#chore-time');

  form.addEventListener('submit', async (e) => {
    if (!titleInput.value.trim()) return;
    e.preventDefault();
    // Compose display title: title + optional date/time in parentheses
    let composed = titleInput.value.trim();
    const dateStr = dateInput.value ? new Date(dateInput.value).toLocaleDateString() : '';
    const timeStr = timeInput.value || '';
    if (dateStr || timeStr) {
      composed += ' ' + ['(', [dateStr, timeStr].filter(Boolean).join(' '), ')'].join('');
    }
    try {
      const data = await postJSON(form.action, { title: composed });
      const empty = list.querySelector('.empty');
      if (empty) empty.remove();
      const item = createTaskElement(data);
      list.prepend(item);
      titleInput.value = '';
      dateInput.value = '';
      timeInput.value = '';
    } catch (err) {
      console.error(err);
    }
  });

  list.addEventListener('click', async (e) => {
    const target = e.target;
    const item = target.closest('.task');
    if (!item) return;
    const id = item.dataset.id;

    if (target.classList.contains('toggle')) {
      try {
        const res = await fetch(`/toggle/${id}`, { method: 'POST' });
        const data = await res.json();
        item.dataset.completed = String(data.completed ? 1 : 0);
      } catch (err) {
        console.error(err);
      }
    }

    if (target.classList.contains('delete')) {
      try {
        await fetch(`/delete/${id}`, { method: 'POST' });
        item.remove();
        if (!list.children.length) {
          const li = document.createElement('li');
          li.className = 'empty';
          li.textContent = 'No chores yet. Add one above!';
          list.appendChild(li);
        }
      } catch (err) {
        console.error(err);
      }
    }
  });
});


