/**
 * FeatherCare API Client Service
 * Connects frontend components to the Express + SQLite backend.
 */

// Uses configurable environment variable, or falls back to port 5001 / port 5000 / proxy
const BACKEND_HOST = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const API_BASE = `${BACKEND_HOST}/api`;

/**
 * Mapping of bird species names to verified local canonical images in public/species folder
 */
export const SPECIES_IMAGE_MAP = {
  'cockatiel': '/species/cockatiel.jpg',
  'budgerigar': '/species/budgerigar.jpg',
  'budgie': '/species/budgerigar.jpg',
  'african grey': '/species/african-grey.jpg',
  'african grey parrot': '/species/african-grey.jpg',
  'lovebird': '/species/lovebird.jpg',
  'canary': '/species/canary.jpg',
  'atlantic canary': '/species/canary.jpg',
  'zebra finch': '/species/zebra-finch.png',
  'green-cheeked conure': '/species/green-cheeked-conure.jpg',
  'green cheeked conure': '/species/green-cheeked-conure.jpg',
  'barn owl': '/species/barn-owl.jpg',
  'blue jay': '/species/blue-jay.jpg',
  'sun conure': '/species/sun-conure.jpg',
  'eclectus parrot': '/species/eclectus-parrot.jpg',
  'eclectus': '/species/eclectus-parrot.jpg',
  'victoria crowned pigeon': '/species/victoria-crowned-pigeon.jpg',
  'bald eagle': '/species/bald-eagle.jpg',
  'snowy owl': '/species/snowy-owl.jpg',
  'common kingfisher': '/species/common-kingfisher.jpg',
  'kingfisher': '/species/common-kingfisher.jpg',
  'sulphur-crested cockatoo': '/species/sulphur-crested-cockatoo.jpg',
  'sulphur crested cockatoo': '/species/sulphur-crested-cockatoo.jpg',
  'california quail': '/species/california-quail.jpg',
  'quail': '/species/california-quail.jpg',
  'red-crowned kakariki': '/species/red-crowned-kakariki.jpg',
  'kakariki': '/species/red-crowned-kakariki.jpg',
  'rainbow lorikeet': '/species/rainbow-lorikeet.jpg',
  'lorikeet': '/species/rainbow-lorikeet.jpg',
  'european goldfinch': '/species/european-goldfinch.jpg',
  'goldfinch': '/species/european-goldfinch.jpg',
  'mourning dove': '/species/mourning-dove.jpg',
  'red-tailed hawk': '/species/red-tailed-hawk.jpg',
  'hawk': '/species/red-tailed-hawk.jpg',
  'mallard duck': '/species/mallard-duck.jpg',
  'mallard': '/species/mallard-duck.jpg',
  'hyacinth macaw': '/species/hyacinth-macaw.jpg',
  'scarlet macaw': '/species/scarlet-macaw.jpg',
  'macaw': '/species/scarlet-macaw.jpg',
  'mandarin duck': '/species/mandarin-duck.jpg',
  'hummingbird': '/species/hummingbird.jpg',
  "anna's hummingbird": '/species/hummingbird.jpg',
  'keel-billed toucan': '/species/keel-billed-toucan.jpg',
  'toucan': '/species/keel-billed-toucan.jpg',
  'diamond dove': '/species/diamond-dove.jpg',
  'gouldian finch': '/species/gouldian-finch.jpg',
  'peregrine falcon': '/species/peregrine-falcon.jpg',
  'falcon': '/species/peregrine-falcon.jpg',
  'bali myna': '/species/bali-myna.jpg',
  'java sparrow': '/species/java-sparrow.jpg',
  'wood duck': '/species/wood-duck.jpg',
  'indian peafowl': '/species/indian-peafowl.jpg',
  'peacock': '/species/indian-peafowl.jpg',
  'peafowl': '/species/indian-peafowl.jpg',
  'resplendent quetzal': '/species/resplendent-quetzal.jpg',
  'quetzal': '/species/resplendent-quetzal.jpg',
  'superb lyrebird': '/species/superb-lyrebird.jpg',
  'lyrebird': '/species/superb-lyrebird.jpg'
};

/**
 * Resolves species card image URL, giving first priority to the frontend public species folder.
 */
export function getSpeciesImageUrl(speciesName, path) {
  if (typeof path === 'string' && path.trim()) {
    const trimmedPath = path.trim();
    if (trimmedPath.startsWith('/species/')) {
      return trimmedPath;
    }
    if (trimmedPath.startsWith('/uploads/species/')) {
      return trimmedPath.replace('/uploads/species/', '/species/');
    }
    if (trimmedPath.includes('/species/')) {
      const filename = trimmedPath.split('/').pop();
      return `/species/${filename}`;
    }
  }

  if (speciesName && typeof speciesName === 'string') {
    const key = speciesName.trim().toLowerCase();
    if (SPECIES_IMAGE_MAP[key]) {
      return SPECIES_IMAGE_MAP[key];
    }
    for (const [sKey, sUrl] of Object.entries(SPECIES_IMAGE_MAP)) {
      if (key === sKey || key.includes(sKey) || sKey.includes(key)) {
        return sUrl;
      }
    }
  }

  return getImageUrl(path);
}

/**
 * Helper to resolve static image URLs from the backend
 */
export function getImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('/species/')) {
    return path;
  }
  if (path.startsWith('/uploads/species/')) {
    return path.replace('/uploads/species/', '/species/');
  }
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

/**
 * AI-powered Discover New Bird generator
 */
export async function discoverNewBird() {
  return request('/species/discover', {
    method: 'POST'
  });
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

export async function checkSymptoms({ symptoms, species, birdName }) {
  return request('/symptoms', {
    method: 'POST',
    body: JSON.stringify({ symptoms, species, birdName })
  });
}

// ==========================================
// 4. AI Bonding Activity API
// ==========================================

export async function getBondingTip({ species, age, notes, birdName }) {
  return request('/bonding-tip', {
    method: 'POST',
    body: JSON.stringify({ species, age, notes, birdName })
  });
}

// ==========================================
// 5. My Birds CRUD API
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
  discoverNewBird,
  identifyBird,
  getSymptoms,
  checkSymptoms,
  getBondingTip,
  getMyBirds,
  getMyBirdById,
  createMyBird,
  updateMyBird,
  deleteMyBird,
  getImageUrl,
  getSpeciesImageUrl,
  SPECIES_IMAGE_MAP
};
