import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  FlatList,
  Dimensions,
  Share,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeOut, 
  Layout, 
  SlideInDown 
} from 'react-native-reanimated';
import { useDatabase, Verse, Book } from '@/hooks/useDatabase';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { StorageService } from '@/hooks/useStorage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

export default function ReaderScreen() {
  const params = useLocalSearchParams();
  const bookId = parseInt(params.bookId as string, 10);
  const bookName = params.bookName as string;
  const initialChapter = parseInt(params.chapter as string, 10);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { getVerses, getChapters, getBooks } = useDatabase();
  const insets = useSafeAreaInsets();

  const [currentChapter, setCurrentChapter] = useState(initialChapter);
  const [currentBookId, setCurrentBookId] = useState(bookId);
  const [currentBookName, setCurrentBookName] = useState(bookName);

  const [verses, setVerses] = useState<Verse[]>([]);
  const [chapters, setChapters] = useState<number[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  const [isSelectorVisible, setIsSelectorVisible] = useState(false);
  const [selectorTab, setSelectorTab] = useState<'book' | 'chapter'>('chapter');
  const [bookmarkedVerseIds, setBookmarkedVerseIds] = useState<Set<number>>(new Set());
  const [selectedVerseId, setSelectedVerseId] = useState<number | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadData();
    setAllBooks(getBooks());
  }, [currentBookId, currentChapter]);

  const loadData = async () => {
    setIsLoading(true);
    const data = getVerses(currentBookId, currentChapter);
    setVerses(data);
    setChapters(getChapters(currentBookId));

    const size = await StorageService.getFontSize();
    setFontSize(size);

    await StorageService.saveLastPosition({
      bookId: currentBookId,
      bookName: currentBookName,
      chapter: currentChapter,
      timestamp: Date.now(),
    });

    await refreshBookmarks(data);
    setIsLoading(false);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const refreshBookmarks = async (verseList: Verse[]) => {
    const bookmarks = await StorageService.getBookmarks();
    const ids = new Set<number>(
      bookmarks
        .filter((b) => b.bookId === currentBookId && b.chapter === currentChapter && b.verseId !== undefined)
        .map((b) => b.verseId as number)
    );
    setBookmarkedVerseIds(ids);
  };

  const handleNextChapter = () => {
    if (currentChapter < chapters.length) {
      setCurrentChapter(currentChapter + 1);
    } else {
      const currentIndex = allBooks.findIndex((b) => b.id === currentBookId);
      if (currentIndex !== -1 && currentIndex < allBooks.length - 1) {
        const nextBook = allBooks[currentIndex + 1];
        setCurrentBookId(nextBook.id);
        setCurrentBookName(nextBook.b_name);
        setCurrentChapter(1);
      }
    }
  };

  const handlePrevChapter = () => {
    if (currentChapter > 1) {
      setCurrentChapter(currentChapter - 1);
    } else {
      const currentIndex = allBooks.findIndex((b) => b.id === currentBookId);
      if (currentIndex > 0) {
        const prevBook = allBooks[currentIndex - 1];
        setCurrentBookId(prevBook.id);
        setCurrentBookName(prevBook.b_name);
        const prevBookChapters = getChapters(prevBook.id);
        setCurrentChapter(prevBookChapters.length);
      }
    }
  };

  const toggleBookmark = async (verse: Verse) => {
    const isBookmarked = bookmarkedVerseIds.has(verse.id);
    if (isBookmarked) {
      const bookmarks = await StorageService.getBookmarks();
      const target = bookmarks.find(
        (b) => b.bookId === currentBookId && b.chapter === currentChapter && b.verseId === verse.id
      );
      if (target) {
        await StorageService.removeBookmark(target.id);
      }
    } else {
      await StorageService.addBookmark({
        bookId: currentBookId,
        bookName: currentBookName,
        chapter: currentChapter,
        verseId: verse.id,
        verseNumber: parseInt(verse.a_and, 10),
        verseText: verse.a_text,
      });
    }
    await refreshBookmarks(verses);
    setSelectedVerseId(null);
  };

  const shareVerse = async (verse: Verse) => {
    try {
      await Share.share({
        message: `${verse.a_text}\n\n— ${currentBookName} ${currentChapter}:${verse.a_and} (Ny Baiboly DIEM v1.2)`,
      });
    } catch (error) {
      console.error(error);
    }
    setSelectedVerseId(null);
  };

  const adjustFontSize = async (delta: number) => {
    const newSize = Math.max(12, Math.min(36, fontSize + delta));
    setFontSize(newSize);
    await StorageService.saveFontSize(newSize);
  };

  const selectBook = (book: Book) => {
    setCurrentBookId(book.id);
    setCurrentBookName(book.b_name);
    setCurrentChapter(1);
    setSelectorTab('chapter');
  };

  const selectChapter = (ch: number) => {
    setCurrentChapter(ch);
    setIsSelectorVisible(false);
  };

  const handleVerseTap = (verse: Verse) => {
    setSelectedVerseId(selectedVerseId === verse.id ? null : verse.id);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Custom Header */}
      <Animated.View 
        entering={FadeInDown.duration(400)}
        style={[styles.header, { borderBottomColor: colors.border }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bookSelector}
          onPress={() => {
            setSelectorTab('chapter');
            setIsSelectorVisible(true);
          }}
        >
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {currentBookName} {currentChapter}
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => adjustFontSize(-2)} style={styles.headerBtn}>
            <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '700' }}>A−</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => adjustFontSize(2)} style={styles.headerBtn}>
            <Text style={{ color: colors.textSecondary, fontSize: 17, fontWeight: '700' }}>A+</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Chapter heading */}
          <Animated.View 
            entering={FadeIn.delay(200)}
            style={styles.chapterHeader}
          >
            <Text style={[styles.chapterTitle, { color: colors.primary }]}>
              {currentBookName}
            </Text>
            <Text style={[styles.chapterNum, { color: colors.textMuted }]}>
              Toko {currentChapter}
            </Text>
          </Animated.View>

          {verses.map((v, index) => {
            const isSelected = selectedVerseId === v.id;
            const isBookmarked = bookmarkedVerseIds.has(v.id);
            return (
              <Animated.View
                key={v.id}
                entering={FadeInDown.delay(300 + index * 20).duration(400)}
                layout={Layout.duration(300)}
              >
                <TouchableOpacity
                  onPress={() => handleVerseTap(v)}
                  activeOpacity={0.75}
                  style={[
                    styles.verseRow,
                    isSelected && { backgroundColor: colors.highlight, borderRadius: 8 },
                  ]}
                >
                  <Text
                    style={[
                      styles.verseText,
                      { fontSize, color: colors.text, lineHeight: fontSize * 1.7 },
                    ]}
                  >
                    <Text style={[styles.verseNumber, { color: colors.primary, fontSize: fontSize * 0.75 }]}>
                      {v.a_and}{'  '}
                    </Text>
                    {v.a_text}
                  </Text>

                  {isSelected && (
                    <Animated.View 
                      entering={FadeInDown.duration(200)} 
                      exiting={FadeOut.duration(200)}
                      style={styles.verseActions}
                    >
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => toggleBookmark(v)}
                      >
                        <Ionicons
                          name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                          size={16}
                          color={isBookmarked ? colors.primary : colors.textSecondary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => shareVerse(v)}
                      >
                        <Ionicons name="share-outline" size={16} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </Animated.View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}

          {/* Navigation */}
          <Animated.View 
            entering={FadeIn.delay(800)}
            style={styles.navButtons}
          >
            <TouchableOpacity
              style={[styles.navBtn, { borderColor: colors.border }]}
              onPress={handlePrevChapter}
            >
              <Ionicons name="chevron-back" size={18} color={colors.primary} />
              <Text style={[styles.navBtnText, { color: colors.textSecondary }]}>Teo aloha</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navBtn, { borderColor: colors.border }]}
              onPress={handleNextChapter}
            >
              <Text style={[styles.navBtnText, { color: colors.textSecondary }]}>Manaraka</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      )}

      {/* Selector Modal */}
      <Modal
        visible={isSelectorVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSelectorVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            entering={SlideInDown.duration(300)}
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            {/* Handle */}
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />

            <View style={styles.modalHeader}>
              <View style={styles.modalTabs}>
                {(['book', 'chapter'] as const).map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setSelectorTab(tab)}
                    style={[
                      styles.modalTab,
                      selectorTab === tab && { borderBottomColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalTabText,
                        { color: selectorTab === tab ? colors.primary : colors.textSecondary },
                      ]}
                    >
                      {tab === 'book' ? 'Boky' : 'Toko'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity onPress={() => setIsSelectorVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectorTab === 'book' ? (
              <FlatList
                data={allBooks}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.selectorItem,
                      item.id === currentBookId && { backgroundColor: colors.highlight },
                    ]}
                    onPress={() => selectBook(item)}
                  >
                    <Text
                      style={[
                        styles.selectorItemText,
                        { color: item.id === currentBookId ? colors.primary : colors.text },
                        item.id === currentBookId && { fontWeight: '700' },
                      ]}
                    >
                      {item.b_name}
                    </Text>
                    {item.id === currentBookId && (
                      <Ionicons name="checkmark" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            ) : (
              <ScrollView contentContainerStyle={styles.chapterGrid}>
                {chapters.map((ch, index) => (
                  <Animated.View 
                    key={ch}
                    entering={FadeIn.delay(index * 5).duration(200)}
                  >
                    <TouchableOpacity
                      style={[
                        styles.chapterBubble,
                        { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                        ch === currentChapter && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                      onPress={() => selectChapter(ch)}
                    >
                      <Text
                        style={[
                          styles.chapterBubbleText,
                          { color: ch === currentChapter ? '#FFF' : colors.text },
                        ]}
                      >
                        {ch}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: { flexDirection: 'row' },
  bookSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 60,
    paddingTop: 8,
  },
  chapterHeader: {
    marginBottom: 28,
    marginTop: 20,
  },
  chapterTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  chapterNum: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  verseRow: {
    marginBottom: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  verseText: {
    textAlign: 'justify',
    fontWeight: '400',
  },
  verseNumber: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  verseActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingLeft: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 48,
    gap: 12,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  navBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    maxHeight: height * 0.7,
    borderRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
    opacity: 0.3,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTabs: {
    flexDirection: 'row',
    flex: 1,
    gap: 8,
  },
  modalTab: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginRight: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  modalTabText: {
    fontSize: 15,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  selectorItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
  chapterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 24,
    gap: 8,
  },
  chapterBubble: {
    width: (Dimensions.get('window').width - 80) / 5,
    height: (Dimensions.get('window').width - 80) / 5,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterBubbleText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
