export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function clearToken() {
  if (typeof window !== 'undefined') localStorage.removeItem('token');
}

export async function fetchProfile(token) {
  const res = await fetch(`${API_URL}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.profile;
}

export function onboardingComplete(profile) {
  return profile && profile.age != null && profile.main_goal;
}
