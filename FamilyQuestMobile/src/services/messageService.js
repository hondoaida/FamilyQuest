import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '../config/api';

export async function getMyMessages({ token }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/api/me/messages`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Ucitavanje poruka nije uspjelo.');
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

export async function sendMessage({ token, receiverId, content }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
      body: JSON.stringify({ receiverId, content }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Slanje poruke nije uspjelo.');
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
