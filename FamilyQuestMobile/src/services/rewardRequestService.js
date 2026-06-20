import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '../config/api';

export const REWARD_REQUEST_STATUSES = {
  pending: 1,
  approved: 2,
  rejected: 3,
};

async function requestRewardRequests({ token, path, method = 'GET', body, errorMessage }) {
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

export async function getRewardRequests({ token }) {
  return requestRewardRequests({
    token,
    path: '/api/rewardrequests',
    errorMessage: 'Ucitavanje zahtjeva za nagrade nije uspjelo.',
  });
}

export async function createRewardRequest({ token, rewardId }) {
  return requestRewardRequests({
    token,
    path: '/api/rewardrequests',
    method: 'POST',
    body: { rewardId },
    errorMessage: 'Slanje zahtjeva za nagradu nije uspjelo.',
  });
}

export async function updateRewardRequestStatus({ token, requestId, status }) {
  return requestRewardRequests({
    token,
    path: `/api/rewardrequests/${requestId}/status`,
    method: 'PUT',
    body: { status },
    errorMessage: 'Obrada zahtjeva za nagradu nije uspjela.',
  });
}
