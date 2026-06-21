import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

async function getToken() {
  return await SecureStore.getItemAsync('access_token');
}

async function request(method, path, body = null, requiresAuth = true) {
  const headers = { 'Content-Type': 'application/json' };

  if (requiresAuth) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  const res = await fetch(`${API_URL}${path}`, config);

  if (res.status === 401) {
    // Try to refresh
    const refreshed = await refreshToken();
    if (refreshed) {
      const newToken = await getToken();
      headers['Authorization'] = `Bearer ${newToken}`;
      const retryRes = await fetch(`${API_URL}${path}`, { ...config, headers });
      if (!retryRes.ok) throw new Error(`${retryRes.status}`);
      return retryRes.json();
    }
    throw new Error('401');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

async function refreshToken() {
  try {
    const refresh = await SecureStore.getItemAsync('refresh_token');
    if (!refresh) return false;
    const res = await fetch(`${API_URL}/api/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    await SecureStore.setItemAsync('access_token', data.access);
    return true;
  } catch {
    return false;
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export async function login(email, password) {
  const data = await request('POST', '/api/auth/login/', { email, password }, false);
  await SecureStore.setItemAsync('access_token', data.access);
  await SecureStore.setItemAsync('refresh_token', data.refresh);
  return data;
}

export async function register(fullName, email, password) {
  const data = await request('POST', '/api/auth/register/', {
    full_name: fullName,
    email,
    password,
    role: 'employee',
  }, false);
  return data;
}

export async function logout() {
  await SecureStore.deleteItemAsync('access_token');
  await SecureStore.deleteItemAsync('refresh_token');
}

export async function getMe() {
  return request('GET', '/api/auth/me/');
}

export async function updateProfile(data) {
  return request('PATCH', '/api/auth/me/', data);
}

// ─── Wallet ───────────────────────────────────────────────────────────────────
export async function getWallet() {
  return request('GET', '/api/wallet/');
}

export async function getTransactions() {
  return request('GET', '/api/wallet/transactions/');
}

export async function giftCredits(recipientId, amount, note = '') {
  return request('POST', '/api/wallet/gift/', { recipient_id: recipientId, amount, note });
}

// ─── Catalog ──────────────────────────────────────────────────────────────────
export async function getCategories() {
  return request('GET', '/api/catalog/categories/');
}

export async function getPerks(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request('GET', `/api/catalog/perks/${query ? '?' + query : ''}`);
}

export async function getFeaturedPerks() {
  return request('GET', '/api/catalog/perks/featured/');
}

export async function getSuggestions() {
  return request('GET', '/api/catalog/perks/suggestions/');
}

export async function getPerkById(id) {
  return request('GET', `/api/catalog/perks/${id}/`);
}

export async function redeemPerk(id) {
  return request('POST', `/api/catalog/redeem/${id}/`);
}

export async function getRedemptions() {
  return request('GET', '/api/catalog/redemptions/');
}

export async function checkReview(redemptionId) {
  return request('GET', `/api/catalog/reviews/check/?redemption_id=${redemptionId}`);
}

export async function submitReview(redemptionId, stars, comment = '') {
  return request('POST', '/api/catalog/reviews/', {
    redemption_id: Number(redemptionId),
    stars,
    comment,
  });
}

// ─── Approvals ────────────────────────────────────────────────────────────────
export async function getMyRequests() {
  return request('GET', '/api/approvals/requests/');
}

export async function submitPerkRequest(data) {
  return request('POST', '/api/approvals/requests/', data);
}

// ─── Life Moments ─────────────────────────────────────────────────────────────
export async function getMyLifeEvents() {
  return request('GET', '/api/life-moments/');
}

export async function getCompanyFeed() {
  return request('GET', '/api/life-moments/company-feed/');
}

export async function getBirthdaysToday() {
  return request('GET', '/api/auth/birthday-today/');
}

export async function sendBirthdayGift(recipientId, amount) {
  return request('POST', '/api/wallet/birthday-gift/', { recipient_id: recipientId, amount });
}

export async function getBirthdayGiftsReceived() {
  return request('GET', '/api/wallet/birthday-gifts/received/');
}

export async function markLifeEvent(eventType, note = '') {
  return request('POST', '/api/life-moments/', { event_type: eventType, note });
}

export async function getDonationInfo(eventId) {
  return request('GET', `/api/life-moments/${eventId}/donate/`);
}

export async function donateCredits(eventId, amount) {
  return request('POST', `/api/life-moments/${eventId}/donate/`, { amount });
}

export async function getCompanyPackages() {
  return request('GET', '/api/collaborations/my-packages/');
}

export async function redeemPackage(id) {
  return request('POST', `/api/collaborations/my-packages/${id}/redeem/`);
}

// ─── Community ────────────────────────────────────────────────────────────────
export async function getCommunityCategories() {
  return request('GET', '/api/community/categories/');
}

export async function getCommunityPosts(categoryId) {
  const q = categoryId ? `?category=${categoryId}` : '';
  return request('GET', `/api/community/${q}`);
}

export async function getMyInstants() {
  return request('GET', '/api/community/mine/');
}

export async function markInstantViewed(id) {
  return request('POST', `/api/community/${id}/view/`);
}

export async function createPost(formData) {
  const token = await getToken();
  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
  const res = await fetch(`${API_URL}/api/community/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `${res.status}`);
  }
  return res.json();
}

export async function likePost(id) {
  return request('POST', `/api/community/${id}/like/`);
}

export async function deletePost(id) {
  return request('DELETE', `/api/community/${id}/`);
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
export async function getConversations() {
  return request('GET', '/api/chat/conversations/');
}

export async function getMessages(userId) {
  return request('GET', `/api/chat/messages/?with=${userId}`);
}

export async function sendMessage(recipientId, text, replyContext = '') {
  return request('POST', '/api/chat/messages/', { recipient_id: recipientId, text, reply_context: replyContext });
}

export async function searchUsers(q) {
  return request('GET', `/api/chat/users/?q=${encodeURIComponent(q)}`);
}

export async function getGroupChats() {
  return request('GET', '/api/chat/groups/');
}

export async function getGroupMessages(groupId) {
  return request('GET', `/api/chat/groups/${groupId}/messages/`);
}

export async function sendGroupMessage(groupId, text) {
  return request('POST', `/api/chat/groups/${groupId}/messages/`, { text });
}

// ─── Challenges ───────────────────────────────────────────────────────────────
export async function getChallenges() {
  return request('GET', '/api/challenges/');
}

export async function getChallengeDetail(id) {
  return request('GET', `/api/challenges/${id}/`);
}

export async function getChallengeWinNotifications() {
  return request('GET', '/api/challenges/win-notifications/');
}

// ─── Reviews & Reputation ──────────────────────────────────────────────────────
export async function getTopProviders(limit = 3) {
  return request('GET', `/api/catalog/providers/top/?limit=${limit}`);
}

export async function getPerkReviews(perkId) {
  return request('GET', `/api/catalog/perks/${perkId}/reviews/`);
}

// ─── Profiles ─────────────────────────────────────────────────────────────────
export async function getColleagueProfile(id) {
  return request('GET', `/api/auth/profile/${id}/`);
}

// ─── AI Assistant ──────────────────────────────────────────────────────────────
export async function askAI(message) {
  return request('POST', '/api/slack/ai/', { message });
}

// ─── Secret Santa ──────────────────────────────────────────────────────────────
export const getSantaEvents = () => request('GET', '/api/santa/');
export const getSantaEvent = (id) => request('GET', `/api/santa/${id}/`);
export const joinSantaEvent = (id) => request('POST', `/api/santa/${id}/join/`);
export const sendSantaGift = (id, amount) => request('POST', `/api/santa/${id}/send-gift/`, { amount });
export const sendSantaGiftPerk = (id, perkId) => request('POST', `/api/santa/${id}/send-gift/`, { perk_id: perkId });

// ─── Group Buying ─────────────────────────────────────────────────────────────
export const getPerkGroupBuys = (perkId) => request('GET', `/api/group-buy/perk/${perkId}/`);
export const startGroupBuy = (perkId) => request('POST', `/api/group-buy/perk/${perkId}/`);
export const joinGroupBuy = (id) => request('POST', `/api/group-buy/${id}/join/`);
export const lockInGroupBuy = (id) => request('POST', `/api/group-buy/${id}/lock-in/`);
export const getMyGroupBuys = () => request('GET', '/api/group-buy/my/');

// ─── Internal Perks ───────────────────────────────────────────────────────────
export const getInternalPerks = () => request('GET', '/api/internal-perks/');
export const getInternalPerk = (id) => request('GET', `/api/internal-perks/${id}/`);
export const redeemInternalPerk = (id, note = '') => request('POST', `/api/internal-perks/${id}/redeem/`, { note });
