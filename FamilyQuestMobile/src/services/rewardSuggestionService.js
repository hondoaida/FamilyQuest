import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '../config/api';

export const REWARD_SUGGESTION_STATUSES = {
  pending: 1,
  approved: 2,
  rejected: 3,
};

async function requestRewardSuggestions({ token, path, method = 'GET', body, errorMessage }) {
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

export async function suggestReward({ token, reward }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/api/me/reward-suggestions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        name: reward.name,
        dueDate: reward.dueDate,
        iconKey: reward.iconKey,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Slanje prijedloga nagrade nije uspjelo. Status: ${response.status}`);
    }

    return null;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Server nije dostupan. Provjerite da li je Web API pokrenut.');
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getRewardSuggestions({ token }) {
  return requestRewardSuggestions({
    token,
    path: '/api/rewardsuggestions',
    errorMessage: 'Ucitavanje prijedloga nagrada nije uspjelo.',
  });
}

export async function updateRewardSuggestionStatus({ token, suggestionId, status, requiredPoints, dueDate }) {
  return requestRewardSuggestions({
    token,
    path: `/api/rewardsuggestions/${suggestionId}/status`,
    method: 'PUT',
    body: {
      status,
      requiredPoints,
      dueDate,
    },
    errorMessage: 'Obrada prijedloga nagrade nije uspjela.',
  });
}
