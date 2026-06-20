import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '../config/api';

export const TASK_STATUSES = {
  assigned: 1,
  pendingApproval: 2,
  approved: 3,
  rejected: 4,
};

async function requestTasks({ token, path, method = 'GET', body, errorMessage }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || errorMessage);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Server nije dostupan. Provjerite da li je Web API pokrenut.');
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getTasks({ token }) {
  return requestTasks({
    token,
    path: '/api/tasks',
    errorMessage: 'Učitavanje zadataka nije uspjelo.',
  });
}

export async function createTask({ token, task }) {
  const createdTask = await requestTasks({
    token,
    path: '/api/tasks',
    method: 'POST',
    body: {
      name: task.name,
      description: task.description ?? null,
      points: task.points,
      dueDate: task.dueDate,
      status: task.status,
      childId: task.childId,
      iconKey: task.taskIcon,
    },
    errorMessage: 'Dodavanje zadatka nije uspjelo.',
  });

  return { ...createdTask, taskIcon: createdTask.iconKey ?? task.taskIcon };
}

export async function updateTaskStatus({ token, taskId, status, completionImageDataUrl }) {
  await requestTasks({
    token,
    path: `/api/tasks/${taskId}/status`,
    method: 'PUT',
    body: { status, completionImageDataUrl },
    errorMessage: 'Ažuriranje statusa zadatka nije uspjelo.',
  });
}
