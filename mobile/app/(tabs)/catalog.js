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
          placeholderTextColor="#8E9099"
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

      {/* Rating Filter */}
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
            <Text style={styles.clearBtnText}>Clear</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={loading ? [] : perks.filter(p => {
          if (!minRating) return true;
          if (!p.avg_rating || p.review_count < 10) return false;
          return Number(p.avg_rating) >= minRating - 0.5;
        })}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ListHeaderComponent={
          <>
            {!selectedCategory && !search && suggestions.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Just for you</Text>
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

            {internalPerks.length > 0 && !search && !selectedCategory && (
              <View>
                <Text style={styles.sectionTitle}>Company Perks</Text>
                {internalPerks.map(p => (
                  <InternalPerkCard key={p.id} perk={p} onPress={() => router.push(`/internal-perk/${p.id}`)} />
                ))}
              </View>
            )}

            {!search && !selectedCategory && topProviders.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Top Rated Providers</Text>
                {topProviders.map((p, i) => (
                  <TopProviderCard key={p.provider_id} provider={p} rank={i + 1} />
                ))}
              </View>
            )}

            <Text style={styles.sectionTitle}>
              {selectedCategory ? selectedCategory : 'All Perks'} {perks.length > 0 ? `(${perks.length})` : ''}
            </Text>

            {loading && <ActivityIndicator size="large" color="#1C3D5A" style={{ marginTop: 40 }} />}
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
                <View style={styles.perkImageDot} />
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

const RANK_COLORS = ['#9A6700', '#5B5E66', '#8B5E3C'];
const RANK_LABELS = ['1st', '2nd', '3rd'];

function TopProviderCard({ provider, rank }) {
  const rankColor = RANK_COLORS[rank - 1] || '#8E9099';
  const initial = (provider.company_name || '?')[0].toUpperCase();
  return (
    <View style={tp.card}>
      <View style={[tp.rankBadge, { backgroundColor: rankColor }]}>
        <Text style={tp.rankTxt}>{RANK_LABELS[rank - 1]}</Text>
      </View>
      <View style={tp.avatar}>
        <Text style={tp.avatarLetter}>{initial}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={tp.name}>{provider.company_name}</Text>
          {provider.tier && provider.tier !== 'unranked' && (
            <View style={tp.tierChip}>
              <Text style={tp.tierTxt}>{provider.tier.toUpperCase()}</Text>
            </View>
          )}
        </View>
        <View style={tp.meta}>
          <Text style={tp.stars}>{'★'.repeat(Math.round(provider.avg_stars || 0))}{'☆'.repeat(5 - Math.round(provider.avg_stars || 0))}</Text>
          <Text style={tp.score}>{Number(provider.avg_stars || 0).toFixed(1)}</Text>
          <Text style={tp.dot}>·</Text>
          <Text style={tp.reviews}>{provider.review_count} reviews</Text>
          <Text style={tp.dot}>·</Text>
          <Text style={tp.perks}>{provider.perk_count} perks</Text>
        </View>
        {provider.top_perk && <Text style={tp.topPerk} numberOfLines={1}>{provider.top_perk}</Text>}
      </View>
      <Text style={[tp.score2, { color: rankColor }]}>{provider.composite_score}</Text>
    </View>
  );
}

const tp = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#EEEFF2', gap: 12 },
  rankBadge: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rankTxt: { fontSize: 10, fontWeight: '700', color: '#fff' },
  avatar: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#EEEFF2', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 16, fontWeight: '700', color: '#5B5E66' },
  name: { fontSize: 14, fontWeight: '600', color: '#0A0A0B', flexShrink: 1 },
  tierChip: { borderWidth: 1, borderColor: '#D4D6DC', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tierTxt: { fontSize: 10, fontWeight: '600', color: '#5B5E66' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  stars: { fontSize: 11, color: '#8E9099' },
  score: { fontSize: 12, fontWeight: '600', color: '#0A0A0B' },
  dot: { fontSize: 11, color: '#D4D6DC' },
  reviews: { fontSize: 11, color: '#8E9099' },
  perks: { fontSize: 11, color: '#8E9099' },
  topPerk: { fontSize: 11, color: '#5B5E66', fontWeight: '500', marginTop: 3 },
  score2: { fontSize: 18, fontWeight: '700', marginLeft: 4 },
});

const TIER_COLORS = {
  bronze: '#8B5E3C',
  silver: '#5B5E66',
  gold:   '#9A6700',
  platinum: '#1C3D5A',
};

function tierBadgeStyle(tier) {
  const color = TIER_COLORS[tier] || '#8E9099';
  return { color, borderColor: color + '60', backgroundColor: color + '12' };
}

function InternalPerkCard({ perk, onPress }) {
  const statusColor = perk.has_requested
    ? perk.my_request_status === 'approved' ? '#1F7A4D' : perk.my_request_status === 'denied' ? '#B42318' : '#9A6700'
    : '#1C3D5A';

  return (
    <TouchableOpacity style={ip.card} onPress={onPress} activeOpacity={0.85}>
      <View style={ip.iconWrap}>
        <Text style={{ fontSize: 24 }}>{perk.icon}</Text>
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
            <View style={[ip.statusBadge, { backgroundColor: statusColor + '15' }]}>
              <Text style={[ip.statusTxt, { color: statusColor }]}>{perk.my_request_status}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const ip = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#EEEFF2', gap: 14 },
  iconWrap: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F7F7F8', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '600', color: '#0A0A0B', marginBottom: 3 },
  desc: { fontSize: 12, color: '#8E9099', lineHeight: 17 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  free: { fontSize: 11, fontWeight: '600', color: '#1F7A4D', backgroundColor: '#E6F4ED', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  cost: { fontSize: 11, fontWeight: '600', color: '#1C3D5A' },
  slots: { fontSize: 11, color: '#8E9099' },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusTxt: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F8' },
  header: { backgroundColor: '#FFFFFF', padding: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#EEEFF2' },
  title: { fontSize: 22, fontWeight: '700', color: '#0A0A0B', marginBottom: 12, letterSpacing: -0.3 },
  search: {
    backgroundColor: '#F7F7F8', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 10, fontSize: 15, color: '#0A0A0B', borderWidth: 1, borderColor: '#EEEFF2',
  },
  filterRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: '#FFFFFF' },
  ratingFilterRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEEFF2',
  },
  ratingFilterLabel: { fontSize: 11, fontWeight: '600', color: '#8E9099', textTransform: 'uppercase', letterSpacing: 0.5 },
  starsRow: { flexDirection: 'row', gap: 4 },
  starIcon: { fontSize: 22, color: '#D4D6DC' },
  starIconActive: { color: '#9A6700' },
  clearBtn: { marginLeft: 'auto', backgroundColor: '#F7F7F8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#D4D6DC' },
  clearBtnText: { fontSize: 12, fontWeight: '600', color: '#5B5E66' },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
    borderWidth: 1, borderColor: '#EEEFF2', backgroundColor: '#FFFFFF',
  },
  filterChipActive: { backgroundColor: '#1C3D5A', borderColor: '#1C3D5A' },
  filterIcon: { fontSize: 13 },
  filterText: { fontSize: 13, fontWeight: '500', color: '#5B5E66' },
  filterTextActive: { color: '#FFFFFF' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#8E9099', marginTop: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  suggestRow: { paddingBottom: 4, gap: 10 },
  suggestCard: {
    width: 152, padding: 14, backgroundColor: '#FFFFFF',
    borderRadius: 12, borderWidth: 1, borderColor: '#EEEFF2',
  },
  suggestName: { fontSize: 13, fontWeight: '600', color: '#0A0A0B' },
  suggestProvider: { fontSize: 11, color: '#8E9099', marginTop: 2 },
  suggestPrice: { fontSize: 13, color: '#1C3D5A', fontWeight: '600', marginTop: 8 },
  perkCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#EEEFF2', marginBottom: 8, gap: 12,
  },
  perkImage: { width: 52, height: 52, borderRadius: 10 },
  perkImagePlaceholder: {
    width: 52, height: 52, borderRadius: 10,
    backgroundColor: '#EEEFF2', justifyContent: 'center', alignItems: 'center',
  },
  perkImageDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#D4D6DC' },
  perkLeft: { flex: 1 },
  perkName: { fontSize: 14, fontWeight: '600', color: '#0A0A0B' },
  perkProvider: { fontSize: 12, color: '#8E9099', marginTop: 2 },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  categoryBadge: {
    fontSize: 11, color: '#1C3D5A', fontWeight: '500',
    backgroundColor: '#E8EDF2', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4,
  },
  featuredBadge: {
    fontSize: 11, color: '#9A6700', fontWeight: '500',
    backgroundColor: '#FEF3C7', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4,
  },
  ratingBadge: {
    fontSize: 11, color: '#5B5E66', fontWeight: '600',
    backgroundColor: '#EEEFF2', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4,
  },
  tierBadge: {
    fontSize: 10, fontWeight: '600',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1,
  },
  perkRight: { alignItems: 'flex-end', marginLeft: 8 },
  price: { fontSize: 18, fontWeight: '700', color: '#1C3D5A' },
  priceLabel: { fontSize: 11, color: '#8E9099' },
  empty: { textAlign: 'center', color: '#8E9099', marginTop: 40, fontSize: 14 },
});
