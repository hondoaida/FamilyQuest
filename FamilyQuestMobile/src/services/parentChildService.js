import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '../config/api';

export async function createParentChildRelationship({ childId, token }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/api/parentchildren`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        childId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Povezivanje djeteta sa roditeljem nije uspjelo.');
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
