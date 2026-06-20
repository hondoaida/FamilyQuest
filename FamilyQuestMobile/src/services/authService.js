import { API_BASE_URL, DEFAULT_USER_ROLE, REQUEST_TIMEOUT_MS, USER_ROLES } from '../config/api';

async function requestJson({ path, method = 'POST', body, token, errorMessage }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      signal: controller.signal,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || errorMessage);
    }

    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Server nije dostupan. Provjerite da li je Web API pokrenut i da li telefon koristi istu Wi-Fi mrežu.');
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function createUser({ name, email, password, role, avatarKey, errorMessage }) {
  return requestJson({
    path: '/api/user',
    body: {
      name,
      email,
      password,
      role,
      avatarKey,
    },
    errorMessage,
  });
}

export async function loginUser({ identifier, email, password }) {
  const loginIdentifier = identifier ?? email;

  return requestJson({
    path: '/api/auth/login',
    body: {
      email: loginIdentifier,
      identifier: loginIdentifier,
      password,
    },
    errorMessage: 'Prijava nije uspjela. Provjerite korisnicko ime/e-mail i lozinku.',
  });
}

export async function registerUser({ firstName, lastName, email, password, avatarKey }) {
  return createUser({
    name: `${firstName} ${lastName}`,
    email,
    password,
    role: DEFAULT_USER_ROLE,
    avatarKey,
    errorMessage: 'Registracija nije uspjela.',
  });
}

export async function createChildUser({ identifier, password, avatarKey }) {
  const trimmedIdentifier = identifier.trim();
  const isEmail = trimmedIdentifier.includes('@');
  const name = isEmail ? trimmedIdentifier.split('@')[0] : trimmedIdentifier;

  return createUser({
    name,
    email: isEmail ? trimmedIdentifier : null,
    password,
    role: USER_ROLES.child,
    avatarKey,
    errorMessage: 'Dodavanje djeteta nije uspjelo.',
  });
}
