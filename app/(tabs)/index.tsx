import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  Layout, 
  SequencedTransition 
} from 'react-native-reanimated';
import { useDatabase, Testament, Book } from '@/hooks/useDatabase';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StorageService } from '@/hooks/useStorage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BibleIndex() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { getTestaments, getBooks } = useDatabase();
  const insets = useSafeAreaInsets();

  const [testaments, setTestaments] = useState<Testament[]>([]);
  const [selectedTestamentId, setSelectedTestamentId] = useState<number | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [lastPosition, setLastPosition] = useState<{ bookId: number; bookName: string; chapter: number } | null>(null);

  useEffect(() => {
    const data = getTestaments();
    setTestaments(data);
    if (data.length > 0) {
      setSelectedTestamentId(data[0].id);
    }
  }, []);

  useEffect(() => {
    if (selectedTestamentId !== null) {
      setBooks(getBooks(selectedTestamentId));
    }
  }, [selectedTestamentId]);

  useEffect(() => {
    const loadLastPosition = async () => {
      const pos = await StorageService.getLastPosition();
      setLastPosition(pos);
    };
    loadLastPosition();
  }, []);

  const handleBookPress = (bookId: number, bookName: string) => {
    router.push({
      pathname: '/reader',
      params: { bookId, bookName, chapter: 1 },
    });
  };

  const resumeReading = () => {
    if (lastPosition) {
      router.push({
        pathname: '/reader',
        params: {
          bookId: lastPosition.bookId,
          bookName: lastPosition.bookName,
          chapter: lastPosition.chapter,
        },
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View 
        entering={FadeInDown.duration(600)}
        style={styles.header}
      >
        <Text style={[styles.title, { color: colors.text }]}>Ny Baiboly DIEM</Text>
        <Text style={[styles.version, { color: colors.textMuted }]}>v1.2</Text>
      </Animated.View>

      {/* Resume card */}
      {lastPosition && (
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <TouchableOpacity
            style={[styles.resumeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={resumeReading}
            activeOpacity={0.7}
          >
            <View style={styles.resumeLeft}>
              <Ionicons name="play-circle" size={20} color={colors.primary} />
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.resumeLabel, { color: colors.textSecondary }]}>Hanohy</Text>
                <Text style={[styles.resumeRef, { color: colors.text }]}>
                  {lastPosition.bookName} {lastPosition.chapter}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Testament tabs */}
      <Animated.View 
        entering={FadeIn.delay(400)}
        style={[styles.tabBar, { borderBottomColor: colors.border }]}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {testaments.map((t) => {
            const active = selectedTestamentId === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.tab, active && styles.tabActive, active && { borderBottomColor: colors.primary }]}
                onPress={() => setSelectedTestamentId(t.id)}
              >
                <Text style={[styles.tabText, { color: active ? colors.primary : colors.textSecondary }]}>
                  {t.test_name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Book list */}
      <FlatList
        data={books}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <Animated.View 
            entering={FadeInDown.delay(500 + index * 40).duration(400)}
            layout={Layout.duration(300)}
          >
            <TouchableOpacity
              style={[styles.bookRow, { borderBottomColor: colors.border }]}
              onPress={() => handleBookPress(item.id, item.b_name)}
              activeOpacity={0.6}
            >
              <Text style={[styles.bookOrder, { color: colors.textMuted }]}>
                {String(item.b_order).padStart(2, '0')}
              </Text>
              <Text style={[styles.bookName, { color: colors.text }]}>{item.b_name}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.border} />
            </TouchableOpacity>
          </Animated.View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  appName: {
    fontSize: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    flex: 1,
  },
  version: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  resumeCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resumeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resumeLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  resumeRef: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 1,
  },
  tabBar: {
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  tabsRow: {
    paddingHorizontal: 20,
  },
  tab: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {},
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  listContent: {
    paddingBottom: 24,
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    gap: 16,
  },
  bookOrder: {
    fontSize: 12,
    fontWeight: '500',
    width: 24,
    fontVariant: ['tabular-nums'],
  },
  bookName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
});
