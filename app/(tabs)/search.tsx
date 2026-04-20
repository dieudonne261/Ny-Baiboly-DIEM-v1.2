import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useDatabase, SearchResult } from '@/hooks/useDatabase';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { searchVerses } = useDatabase();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;
    Keyboard.dismiss();
    setIsSearching(true);
    setHasSearched(true);
    setTimeout(() => {
      const data = searchVerses(query);
      setResults(data);
      setIsSearching(false);
    }, 100);
  };

  const navigateToVerse = (res: SearchResult) => {
    router.push({
      pathname: '/reader',
      params: { bookId: res.a_bid, bookName: res.b_name, chapter: res.a_toko },
    });
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Hikaroka</Text>
      </Animated.View>

      <Animated.View 
        entering={FadeInDown.delay(100).duration(400)}
        style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Teny, andalan-tsoratra..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={clearSearch}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {isSearching ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.hint, { color: colors.textSecondary }]}>Mikaroka...</Text>
        </View>
      ) : hasSearched && results.length === 0 ? (
        <Animated.View entering={FadeInDown} style={styles.centered}>
          <Ionicons name="search-outline" size={48} color={colors.border} />
          <Text style={[styles.hint, { color: colors.textSecondary }]}>Tsy nisy valiny</Text>
        </Animated.View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <Animated.View 
              entering={FadeInDown.delay(100 + index * 30).duration(400)}
              layout={Layout.duration(300)}
            >
              <TouchableOpacity
                style={[styles.resultRow, { borderBottomColor: colors.border }]}
                onPress={() => navigateToVerse(item)}
                activeOpacity={0.6}
              >
                <Text style={[styles.resultRef, { color: colors.primary }]}>
                  {item.b_name} {item.a_toko}:{item.a_and}
                </Text>
                <Text style={[styles.resultText, { color: colors.text }]} numberOfLines={3}>
                  {item.a_text}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            results.length > 0 ? (
              <Animated.Text entering={FadeInDown} style={[styles.countText, { color: colors.textMuted }]}>
                {results.length} valiny
              </Animated.Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 4,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    height: '100%',
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '500',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
    gap: 12,
  },
  hint: {
    fontSize: 15,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  resultRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  resultRef: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  resultText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
});
