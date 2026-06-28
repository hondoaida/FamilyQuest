import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '../config/api';

export async function updateMyProfile({ token, email, avatarKey, currentPassword, newPassword }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const body = {
    avatarKey,
  };

  if (email !== undefined) {
    body.email = email;
  }

  if (currentPassword) {
    body.currentPassword = currentPassword;
  }

  if (newPassword) {
    body.newPassword = newPassword;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Spremanje profila nije uspjelo. Status: ${response.status}`);
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

export async function updateChildProfile({ token, childId, avatarKey, newPassword }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const body = {
    avatarKey,
  };

  if (newPassword) {
    body.newPassword = newPassword;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/me/children/${childId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Spremanje profila djeteta nije uspjelo. Status: ${response.status}`);
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
