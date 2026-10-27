/**
 * FeatherCare API Client Service
 * Connects frontend components to the Express + SQLite backend.
 */

// Uses configurable environment variable, or falls back to port 5001 / port 5000 / proxy
const BACKEND_HOST = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const API_BASE = `${BACKEND_HOST}/api`;

/**
 * Helper to resolve static image URLs from the backend
 */
export function getImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  if (path.startsWith('/uploads')) {
    return `${BACKEND_HOST}${path}`;
  }
  return path;
}

/**
 * Generic request helper with error handling
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = options.headers || {};

  // If body is NOT FormData, default to application/json
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.error) {
        errorMsg = errorData.error;
      }
    } catch {
      // response wasn't json
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

// ==========================================
// 1. Species API
// ==========================================

export async function getSpecies({ search = '', type = '' } = {}) {
  const params = new URLSearchParams();
  if (search && search.trim() !== '') params.append('search', search.trim());
  if (type && type !== 'All') params.append('type', type);

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  return request(`/species${queryStr}`);
}

export async function getSpeciesById(id) {
  return request(`/species/${id}`);
}

export async function getSpeciesTypes() {
  return request('/species/types');
}

// ==========================================
// 2. Bird Identification API
// ==========================================

export async function identifyBird(data) {
  let body;
  const headers = {};

  if (data instanceof FormData) {
    body = data;
    // Don't set Content-Type header so browser sets multipart boundary
  } else {
    body = JSON.stringify(data);
    headers['Content-Type'] = 'application/json';
  }

  return request('/identify', {
    method: 'POST',
    body,
    headers
  });
}

// ==========================================
// 3. Symptoms API
// ==========================================

export async function getSymptoms() {
  return request('/symptoms');
}

export async function checkSymptoms({ symptoms, birdName }) {
  return request('/symptoms', {
    method: 'POST',
    body: JSON.stringify({ symptoms, birdName })
  });
}

// ==========================================
// 4. My Birds CRUD API
// ==========================================

export async function getMyBirds() {
  return request('/my-birds');
}

export async function getMyBirdById(id) {
  return request(`/my-birds/${id}`);
}

export async function createMyBird({ name, species_id, age, notes }) {
  return request('/my-birds', {
    method: 'POST',
    body: JSON.stringify({ name, species_id, age, notes })
  });
}

export async function updateMyBird(id, { name, species_id, age, notes }) {
  return request(`/my-birds/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, species_id, age, notes })
  });
}

export async function deleteMyBird(id) {
  return request(`/my-birds/${id}`, {
    method: 'DELETE'
  });
}

export default {
  getSpecies,
  getSpeciesById,
  getSpeciesTypes,
  identifyBird,
  getSymptoms,
  checkSymptoms,
  getMyBirds,
  getMyBirdById,
  createMyBird,
  updateMyBird,
  deleteMyBird,
  getImageUrl
};
