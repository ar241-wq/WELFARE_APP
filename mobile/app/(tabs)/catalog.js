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
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
                  {topProviders.map((p, i) => (
                    <TopProviderCard key={p.provider_id} provider={p} rank={i + 1} />
                  ))}
                </ScrollView>
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

const RANK_MEDALS = ['🥇', '🥈', '🥉'];
const RANK_COLORS = {
  1: { bg: '#FFFBEB', border: '#FDE68A', accent: '#9A6700', badge: '#F59E0B' },
  2: { bg: '#F8F9FA', border: '#D4D6DC', accent: '#4B5563', badge: '#6B7280' },
  3: { bg: '#FDF6F0', border: '#F5CBA7', accent: '#8B5E3C', badge: '#B45309' },
};
const TIER_CHIP_COLORS = {
  platinum: { bg: '#EEF2FF', text: '#4338CA' },
  gold:     { bg: '#FFFBEB', text: '#9A6700' },
  silver:   { bg: '#F3F4F6', text: '#4B5563' },
  bronze:   { bg: '#FDF6F0', text: '#8B5E3C' },
};

function TopProviderCard({ provider, rank }) {
  const colors = RANK_COLORS[rank] || RANK_COLORS[3];
  const tier = provider.tier || 'bronze';
  const tierColors = TIER_CHIP_COLORS[tier] || TIER_CHIP_COLORS.bronze;
  const initial = (provider.company_name || '?')[0].toUpperCase();
  const avgStars = Number(provider.avg_stars || 0);
  const fullStars = Math.round(avgStars);

  return (
    <View style={[tp.card, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      {/* Medal */}
      <Text style={tp.medal}>{RANK_MEDALS[rank - 1]}</Text>

      {/* Avatar circle */}
      <View style={[tp.avatar, { borderColor: colors.accent + '40' }]}>
        <Text style={[tp.avatarLetter, { color: colors.accent }]}>{initial}</Text>
      </View>

      {/* Name + tier */}
      <Text style={tp.name} numberOfLines={1}>{provider.company_name}</Text>

      {tier !== 'unranked' && (
        <View style={[tp.tierChip, { backgroundColor: tierColors.bg }]}>
          <Text style={[tp.tierTxt, { color: tierColors.text }]}>{tier.toUpperCase()}</Text>
        </View>
      )}

      {/* Stars */}
      <View style={tp.starsRow}>
        {[1,2,3,4,5].map(n => (
          <Text key={n} style={[tp.star, { color: n <= fullStars ? colors.badge : '#D4D6DC' }]}>★</Text>
        ))}
        <Text style={[tp.avgNum, { color: colors.accent }]}>{avgStars.toFixed(1)}</Text>
      </View>

      {/* Stats */}
      <View style={tp.statsRow}>
        <View style={tp.statBox}>
          <Text style={[tp.statNum, { color: colors.accent }]}>{provider.review_count}</Text>
          <Text style={tp.statLabel}>reviews</Text>
        </View>
        <View style={[tp.statBox, tp.statBorder]}>
          <Text style={[tp.statNum, { color: colors.accent }]}>{provider.perk_count}</Text>
          <Text style={tp.statLabel}>perks</Text>
        </View>
        <View style={[tp.statBox, tp.statBorder]}>
          <Text style={[tp.statNum, { color: colors.accent }]}>{provider.composite_score}</Text>
          <Text style={tp.statLabel}>score</Text>
        </View>
      </View>

      {provider.top_perk && (
        <Text style={tp.topPerk} numberOfLines={1}>Top: {provider.top_perk}</Text>
      )}
    </View>
  );
}

const tp = StyleSheet.create({
  card: {
    width: 200, borderRadius: 16, padding: 16,
    borderWidth: 1.5, marginBottom: 4,
    alignItems: 'center',
  },
  medal: { fontSize: 32, marginBottom: 8 },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#fff', borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatarLetter: { fontSize: 22, fontWeight: '800' },
  name: { fontSize: 14, fontWeight: '700', color: '#0A0A0B', textAlign: 'center', marginBottom: 6 },
  tierChip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginBottom: 10 },
  tierTxt: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 12 },
  star: { fontSize: 14 },
  avgNum: { fontSize: 13, fontWeight: '700', marginLeft: 4 },
  statsRow: { flexDirection: 'row', width: '100%', borderRadius: 10, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 10 },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  statBorder: { borderLeftWidth: 1, borderLeftColor: '#E5E7EB' },
  statNum: { fontSize: 15, fontWeight: '800' },
  statLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '500', marginTop: 1 },
  topPerk: { fontSize: 11, color: '#6B7280', fontWeight: '500', textAlign: 'center' },
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
