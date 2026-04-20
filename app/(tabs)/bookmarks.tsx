import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import Animated, { FadeInDown, FadeOutLeft, Layout } from 'react-native-reanimated';
import { StorageService, Bookmark } from '@/hooks/useStorage';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BookmarksScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const insets = useSafeAreaInsets();

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      loadBookmarks();
    }, [])
  );

  const loadBookmarks = async () => {
    const data = await StorageService.getBookmarks();
    setBookmarks(data);
  };

  const removeBookmark = (id: string) => {
    Alert.alert(
      'Hamafa?',
      'Hamafa ity marque-page ity?',
      [
        { text: 'Tsia', style: 'cancel' },
        {
          text: 'Hamafa',
          style: 'destructive',
          onPress: async () => {
            await StorageService.removeBookmark(id);
            loadBookmarks();
          },
        },
      ]
    );
  };

  const navigateToBookmark = (b: Bookmark) => {
    router.push({
      pathname: '/reader',
      params: { bookId: b.bookId, bookName: b.bookName, chapter: b.chapter },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Marque-pages</Text>
        {bookmarks.length > 0 && (
          <Text style={[styles.count, { color: colors.textMuted }]}>{bookmarks.length}</Text>
        )}
      </Animated.View>

      {bookmarks.length === 0 ? (
        <Animated.View entering={FadeInDown.delay(200)} style={styles.centered}>
          <Ionicons name="bookmark-outline" size={40} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>Tsy misy marque-page</Text>
          <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
            Tsindrio andininy mba hitahirizana.
          </Text>
        </Animated.View>
      ) : (
        <FlatList
          data={bookmarks}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <Animated.View 
              entering={FadeInDown.delay(index * 40).duration(400)}
              exiting={FadeOutLeft.duration(300)}
              layout={Layout.duration(300)}
            >
              <TouchableOpacity
                style={[styles.bookmarkRow, { borderBottomColor: colors.border }]}
                onPress={() => navigateToBookmark(item)}
                activeOpacity={0.6}
              >
                <View style={styles.rowLeft}>
                  <Text style={[styles.ref, { color: colors.primary }]}>
                    {item.bookName} {item.chapter}
                    {item.verseNumber ? `:${item.verseNumber}` : ''}
                  </Text>
                  {item.verseText && (
                    <Text style={[styles.snippet, { color: colors.textSecondary }]} numberOfLines={2}>
                      {item.verseText}
                    </Text>
                  )}
                  <Text style={[styles.date, { color: colors.textMuted }]}>
                    {new Date(item.timestamp).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeBookmark(item.id)}
                  style={styles.deleteBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </TouchableOpacity>
            </Animated.View>
          )}
          contentContainerStyle={styles.listContent}
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
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  count: {
    fontSize: 14,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  bookmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  rowLeft: {
    flex: 1,
    gap: 3,
  },
  ref: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  snippet: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  date: {
    fontSize: 11,
    fontWeight: '500',
  },
  deleteBtn: {
    padding: 4,
  },
});
