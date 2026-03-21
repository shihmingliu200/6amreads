import { API_URL, fetchProfile, onboardingComplete } from './api';

export async function redirectAfterAuth(router) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) {
    router.push('/login');
    return;
  }
  const profile = await fetchProfile(token);
  if (onboardingComplete(profile)) {
    router.push('/dashboard');
  } else {
    router.push('/onboarding');
  }
}

export async function postGoogleCredential(credential) {
  const res = await fetch(`${API_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Google sign-in failed');
  }
  return data;
}
