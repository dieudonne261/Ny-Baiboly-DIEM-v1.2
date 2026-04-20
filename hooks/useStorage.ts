import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'reading_history';
const BOOKMARKS_KEY = 'bookmarks';
const FONT_SIZE_KEY = 'font_size';

export interface ReadingPosition {
  bookId: number;
  bookName: string;
  chapter: number;
  timestamp: number;
}

export interface Bookmark {
  id: string;
  bookId: number;
  bookName: string;
  chapter: number;
  verseId?: number;
  verseNumber?: number;
  verseText?: string;
  timestamp: number;
}

export const StorageService = {
  // Reading History
  async saveLastPosition(position: ReadingPosition): Promise<void> {
    try {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(position));
    } catch (e) {
      console.error('Failed to save reading position', e);
    }
  },

  async getLastPosition(): Promise<ReadingPosition | null> {
    try {
      const data = await AsyncStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  // Bookmarks
  async getBookmarks(): Promise<Bookmark[]> {
    try {
      const data = await AsyncStorage.getItem(BOOKMARKS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  async addBookmark(bookmark: Omit<Bookmark, 'id' | 'timestamp'>): Promise<void> {
    try {
      const bookmarks = await StorageService.getBookmarks();
      const newBookmark: Bookmark = {
        ...bookmark,
        id: `${bookmark.bookId}-${bookmark.chapter}-${bookmark.verseId ?? 0}-${Date.now()}`,
        timestamp: Date.now(),
      };
      const exists = bookmarks.find(
        (b) =>
          b.bookId === bookmark.bookId &&
          b.chapter === bookmark.chapter &&
          b.verseId === bookmark.verseId
      );
      if (!exists) {
        await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify([newBookmark, ...bookmarks]));
      }
    } catch (e) {
      console.error('Failed to add bookmark', e);
    }
  },

  async removeBookmark(bookmarkId: string): Promise<void> {
    try {
      const bookmarks = await StorageService.getBookmarks();
      const filtered = bookmarks.filter((b) => b.id !== bookmarkId);
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error('Failed to remove bookmark', e);
    }
  },

  async isBookmarked(bookId: number, chapter: number, verseId?: number): Promise<boolean> {
    try {
      const bookmarks = await StorageService.getBookmarks();
      return bookmarks.some(
        (b) =>
          b.bookId === bookId &&
          b.chapter === chapter &&
          (verseId === undefined || b.verseId === verseId)
      );
    } catch (e) {
      return false;
    }
  },

  // Font Size
  async getFontSize(): Promise<number> {
    try {
      const data = await AsyncStorage.getItem(FONT_SIZE_KEY);
      return data ? parseInt(data, 10) : 17;
    } catch (e) {
      return 17;
    }
  },

  async saveFontSize(size: number): Promise<void> {
    try {
      await AsyncStorage.setItem(FONT_SIZE_KEY, size.toString());
    } catch (e) {
      console.error('Failed to save font size', e);
    }
  },
};
