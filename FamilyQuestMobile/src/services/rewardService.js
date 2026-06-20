import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '../config/api';

async function requestRewards({ token, path, method = 'GET', body, errorMessage }) {
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

export async function getRewards({ token }) {
  return requestRewards({
    token,
    path: '/api/rewards',
    errorMessage: 'Učitavanje nagrada nije uspjelo.',
  });
}

export async function createReward({ token, reward }) {
  const createdReward = await requestRewards({
    token,
    path: '/api/rewards',
    method: 'POST',
    body: {
      name: reward.name,
      description: reward.description ?? null,
      requiredPoints: reward.requiredPoints,
      dueDate: reward.dueDate,
      childId: reward.childId,
      iconKey: reward.rewardIcon,
    },
    errorMessage: 'Dodavanje nagrade nije uspjelo.',
  });

  return { ...createdReward, rewardIcon: createdReward.iconKey ?? reward.rewardIcon };
}

export async function updateReward({ token, rewardId, reward }) {
  const updatedReward = await requestRewards({
    token,
    path: `/api/rewards/${rewardId}`,
    method: 'PUT',
    body: {
      name: reward.name,
      description: reward.description ?? null,
      requiredPoints: reward.requiredPoints,
      dueDate: reward.dueDate,
      iconKey: reward.rewardIcon ?? reward.iconKey,
      isActive: reward.isActive,
    },
    errorMessage: 'Izmjena nagrade nije uspjela.',
  });

  return { ...updatedReward, rewardIcon: updatedReward.iconKey ?? reward.rewardIcon ?? reward.iconKey };
}
