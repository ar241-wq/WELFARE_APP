import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, FlatList, Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCategories, getPerks, getSuggestions } from '../../lib/api';

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
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
    loadSuggestions();
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
        <TouchableOpacity
          style={[styles.filterChip, !selectedCategory && styles.filterChipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.filterText, !selectedCategory && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.filterChip, selectedCategory === cat.name && styles.filterChipActive]}
            onPress={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
          >
            <Text style={styles.filterIcon}>{cat.icon}</Text>
            <Text style={[styles.filterText, selectedCategory === cat.name && styles.filterTextActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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

      <Text style={styles.sectionTitle}>
        {selectedCategory ? selectedCategory : 'All Perks'} {perks.length > 0 ? `(${perks.length})` : ''}
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={perks}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
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
                </View>
              </View>
              <View style={styles.perkRight}>
                <Text style={styles.price}>{item.credit_price}</Text>
                <Text style={styles.priceLabel}>credits</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No perks found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#fff', padding: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 12 },
  search: {
    backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 10, fontSize: 15, color: '#111827',
  },
  filterRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, backgroundColor: '#fff' },
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
  perkRight: { alignItems: 'center', marginLeft: 12 },
  price: { fontSize: 20, fontWeight: '800', color: '#6366f1' },
  priceLabel: { fontSize: 11, color: '#6b7280' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 14 },
});
