import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, FlatList, Image, Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCategories, getPerks, getSuggestions, getInternalPerks, getTopProviders } from '../../lib/api';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
function imgSrc(path) {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `${API_URL}${path}`;
}

export default function CatalogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { category: initialCategory } = useLocalSearchParams();
  const [categories, setCategories] = useState([]);
  const [perks, setPerks] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [internalPerks, setInternalPerks] = useState([]);
  const [topProviders, setTopProviders] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || null);
  const [search, setSearch] = useState('');
  const [minRating, setMinRating] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
    loadSuggestions();
    loadInternalPerks();
    getTopProviders().then(setTopProviders).catch(() => {});
  }, []);

  useEffect(() => {
    loadPerks();
  }, [selectedCategory, search]);

  async function loadCategories() {
    try {
      const data = await getCategories();
      setCategories(Array.isArray(data) ? data : data?.results || []);
    } catch (e) {}
  }

  async function loadInternalPerks() {
    try {
      const data = await getInternalPerks();
      setInternalPerks(Array.isArray(data) ? data : []);
    } catch (e) {}
  }

  async function loadSuggestions() {
    try {
      const data = await getSuggestions();
      setSuggestions(Array.isArray(data) ? data : data?.results || []);
    } catch (e) {}
  }

  async function loadPerks() {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory) params.category = selectedCategory;
      if (search) params.search = search;
      const data = await getPerks(params);
      setPerks(Array.isArray(data) ? data : data?.results || []);
    } catch (e) {
      setPerks([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Catalog</Text>
        <TextInput
          style={styles.search}
          placeholder="Search perks..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        <Pressable
          android_ripple={null}
          style={[styles.filterChip, !selectedCategory && styles.filterChipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.filterText, !selectedCategory && styles.filterTextActive]}>All</Text>
        </Pressable>
        {categories.map((cat) => (
          <Pressable
            key={cat.id}
            android_ripple={null}
            style={[styles.filterChip, selectedCategory === cat.name && styles.filterChipActive]}
            onPress={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
          >
            <Text style={styles.filterIcon}>{cat.icon}</Text>
            <Text style={[styles.filterText, selectedCategory === cat.name && styles.filterTextActive]}>
              {cat.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Rating Filter — tap a star to set minimum */}
      <View style={styles.ratingFilterRow}>
        <Text style={styles.ratingFilterLabel}>Min. rating</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} android_ripple={null} onPress={() => setMinRating(minRating === n ? null : n)}>
              <Text style={[styles.starIcon, minRating && n <= minRating && styles.starIconActive]}>★</Text>
            </Pressable>
          ))}
        </View>
        {minRating && (
          <Pressable android_ripple={null} onPress={() => setMinRating(null)} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>✕ Clear</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={loading ? [] : perks.filter(p => {
          if (!minRating) return true;
          if (!p.avg_rating || p.review_count < 10) return false;
          return Number(p.avg_rating) >= minRating - 0.5; // e.g. tap 4★ = shows 3.5+
        })}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ListHeaderComponent={
          <>
            {/* Suggestions */}
            {!selectedCategory && !search && suggestions.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Just for you ✨</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestRow}>
                  {suggestions.map((perk) => (
                    <TouchableOpacity
                      key={perk.id}
                      style={styles.suggestCard}
                      onPress={() => router.push(`/perk/${perk.id}`)}
                    >
                      <Text style={styles.suggestName}>{perk.name}</Text>
                      <Text style={styles.suggestProvider}>{perk.provider_name}</Text>
                      <Text style={styles.suggestPrice}>{perk.credit_price} credits</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Internal Perks */}
            {internalPerks.length > 0 && !search && !selectedCategory && (
              <View>
                <Text style={styles.sectionTitle}>🏢 Your Company Perks</Text>
                {internalPerks.map(p => (
                  <InternalPerkCard key={p.id} perk={p} onPress={() => router.push(`/internal-perk/${p.id}`)} />
                ))}
              </View>
            )}

            {/* Top 3 Providers */}
            {!search && !selectedCategory && topProviders.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>🏆 Top Rated Providers</Text>
                {topProviders.map((p, i) => (
                  <TopProviderCard key={p.provider_id} provider={p} rank={i + 1} />
                ))}
              </View>
            )}

            <Text style={styles.sectionTitle}>
              {selectedCategory ? selectedCategory : 'All Perks'} {perks.length > 0 ? `(${perks.length})` : ''}
            </Text>

            {loading && <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />}
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.perkCard}
            onPress={() => router.push(`/perk/${item.id}`)}
          >
            {item.images?.[0] ? (
              <Image source={{ uri: imgSrc(item.images[0].image) }} style={styles.perkImage} />
            ) : (
              <View style={styles.perkImagePlaceholder}>
                <Text style={{ fontSize: 24 }}>🎁</Text>
              </View>
            )}
            <View style={styles.perkLeft}>
              <Text style={styles.perkName}>{item.name}</Text>
              <Text style={styles.perkProvider}>{item.provider_name}</Text>
              <View style={styles.tagRow}>
                <Text style={styles.categoryBadge}>{item.category_name}</Text>
                {item.is_featured && <Text style={styles.featuredBadge}>Featured</Text>}
                {item.review_count >= 10 && item.avg_rating != null && (
                  <Text style={styles.ratingBadge}>★ {Number(item.avg_rating).toFixed(1)}</Text>
                )}
                {item.review_count >= 10 && item.reputation_tier && item.reputation_tier !== 'unranked' && (
                  <Text style={[styles.tierBadge, tierBadgeStyle(item.reputation_tier)]}>
                    {item.reputation_tier.toUpperCase()}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.perkRight}>
              <Text style={styles.price}>{item.credit_price}</Text>
              <Text style={styles.priceLabel}>credits</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No perks found.</Text> : null}
      />
    </View>
  );
}

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const RANK_LABELS = ['1st', '2nd', '3rd'];

function TopProviderCard({ provider, rank }) {
  const tierColor = TIER_COLORS[provider.tier] || '#6b7280';
  const rankColor = RANK_COLORS[rank - 1] || '#9ca3af';
  return (
    <View style={tp.card}>
      <View style={[tp.rankBadge, { backgroundColor: rankColor }]}>
        <Text style={tp.rankTxt}>{RANK_LABELS[rank - 1]}</Text>
      </View>
      <View style={tp.avatar}>
        <Text style={{ fontSize: 22 }}>🏪</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={tp.name}>{provider.company_name}</Text>
          <View style={[tp.tierChip, { borderColor: tierColor, backgroundColor: tierColor + '18' }]}>
            <Text style={[tp.tierTxt, { color: tierColor }]}>{provider.tier.toUpperCase()}</Text>
          </View>
        </View>
        <View style={tp.meta}>
          <Text style={tp.stars}>{'★'.repeat(Math.round(provider.avg_stars || 0))}{'☆'.repeat(5 - Math.round(provider.avg_stars || 0))}</Text>
          <Text style={tp.score}>{Number(provider.avg_stars || 0).toFixed(1)}</Text>
          <Text style={tp.dot}>·</Text>
          <Text style={tp.reviews}>{provider.review_count} reviews</Text>
          <Text style={tp.dot}>·</Text>
          <Text style={tp.perks}>{provider.perk_count} perks</Text>
        </View>
        {provider.top_perk && <Text style={tp.topPerk} numberOfLines={1}>✦ {provider.top_perk}</Text>}
      </View>
      <Text style={[tp.score2, { color: rankColor }]}>{provider.composite_score}</Text>
    </View>
  );
}

const tp = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: '#e5e7eb', gap: 12 },
  rankBadge: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', shrink: 0 },
  rankTxt: { fontSize: 11, fontWeight: '900', color: '#fff' },
  avatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 14, fontWeight: '800', color: '#111827', flexShrink: 1 },
  tierChip: { borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  tierTxt: { fontSize: 10, fontWeight: '800' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  stars: { fontSize: 11, color: '#f59e0b' },
  score: { fontSize: 12, fontWeight: '700', color: '#111827' },
  dot: { fontSize: 11, color: '#d1d5db' },
  reviews: { fontSize: 11, color: '#6b7280' },
  perks: { fontSize: 11, color: '#6b7280' },
  topPerk: { fontSize: 11, color: '#6366f1', fontWeight: '600', marginTop: 3 },
  score2: { fontSize: 20, fontWeight: '900', marginLeft: 4 },
});

const TIER_COLORS = {
  bronze: '#cd7f32',
  silver: '#adb5bd',
  gold: '#d97706',
  platinum: '#6b7280',
};

function tierBadgeStyle(tier) {
  const color = TIER_COLORS[tier] || '#6b7280';
  return { color, borderColor: color, backgroundColor: color + '18' };
}

function InternalPerkCard({ perk, onPress }) {
  const statusColor = perk.has_requested
    ? perk.my_request_status === 'approved' ? '#10b981' : perk.my_request_status === 'denied' ? '#ef4444' : '#f59e0b'
    : '#6366f1';

  return (
    <TouchableOpacity style={ip.card} onPress={onPress} activeOpacity={0.85}>
      <View style={ip.iconWrap}>
        <Text style={{ fontSize: 28 }}>{perk.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={ip.title}>{perk.title}</Text>
        <Text style={ip.desc} numberOfLines={2}>{perk.description}</Text>
        <View style={ip.row}>
          {perk.is_free || perk.credit_cost === 0
            ? <Text style={ip.free}>FREE</Text>
            : <Text style={ip.cost}>{perk.credit_cost} credits</Text>
          }
          {perk.slots_remaining !== null && (
            <Text style={ip.slots}>{perk.slots_remaining} left</Text>
          )}
          {perk.has_requested && (
            <View style={[ip.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[ip.statusTxt, { color: statusColor }]}>{perk.my_request_status}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const ip = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: '#e0e7ff', gap: 14 },
  iconWrap: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '800', color: '#111', marginBottom: 3 },
  desc: { fontSize: 12, color: '#6b7280', lineHeight: 17 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  free: { fontSize: 11, fontWeight: '800', color: '#10b981', backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  cost: { fontSize: 11, fontWeight: '700', color: '#6366f1' },
  slots: { fontSize: 11, color: '#9ca3af' },
  statusBadge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  statusTxt: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#fff', padding: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 12 },
  search: {
    backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 10, fontSize: 15, color: '#111827',
  },
  filterRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, backgroundColor: '#fff' },
  ratingFilterRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  ratingFilterLabel: { fontSize: 12, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 },
  starsRow: { flexDirection: 'row', gap: 4 },
  starIcon: { fontSize: 26, color: '#e5e7eb' },
  starIconActive: { color: '#f59e0b' },
  clearBtn: { marginLeft: 'auto', backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  clearBtnText: { fontSize: 12, fontWeight: '700', color: '#d97706' },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#fff',
  },
  filterChipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  filterIcon: { fontSize: 14 },
  filterText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  filterTextActive: { color: '#fff' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginHorizontal: 16, marginTop: 16, marginBottom: 10 },
  suggestRow: { paddingHorizontal: 16, gap: 12 },
  suggestCard: {
    width: 160, padding: 14, backgroundColor: '#fff',
    borderRadius: 16, borderWidth: 1.5, borderColor: '#e5e7eb',
  },
  suggestName: { fontSize: 13, fontWeight: '700', color: '#111827' },
  suggestProvider: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  suggestPrice: { fontSize: 13, color: '#6366f1', fontWeight: '700', marginTop: 6 },
  perkCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16, padding: 12,
    borderWidth: 1.5, borderColor: '#e5e7eb', marginBottom: 10, gap: 12,
  },
  perkImage: { width: 56, height: 56, borderRadius: 10 },
  perkImagePlaceholder: {
    width: 56, height: 56, borderRadius: 10,
    backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center',
  },
  perkLeft: { flex: 1 },
  perkName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  perkProvider: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  categoryBadge: {
    fontSize: 11, color: '#6366f1', fontWeight: '600',
    backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  featuredBadge: {
    fontSize: 11, color: '#d97706', fontWeight: '600',
    backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  ratingBadge: {
    fontSize: 11, color: '#f59e0b', fontWeight: '700',
    backgroundColor: '#fffbeb', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  tierBadge: {
    fontSize: 10, fontWeight: '800',
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1,
  },
  perkRight: { alignItems: 'center', marginLeft: 12 },
  price: { fontSize: 20, fontWeight: '800', color: '#6366f1' },
  priceLabel: { fontSize: 11, color: '#6b7280' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 14 },
});
