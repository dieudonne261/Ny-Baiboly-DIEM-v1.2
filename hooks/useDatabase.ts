import { useSQLiteContext } from 'expo-sqlite';

export interface Testament {
  id: number;
  test_name: string;
}

export interface Book {
  id: number;
  b_testid: number;
  b_name: string;
  b_order: number;
}

export interface Verse {
  id: number;
  a_bid: number;
  a_toko: string;
  a_and: string;
  a_text: string;
  a_break: number;
  a_order: number;
}

export interface SearchResult extends Verse {
  b_name: string;
}

export function useDatabase() {
  const db = useSQLiteContext();

  const getTestaments = (): Testament[] => {
    return db.getAllSync<Testament>('SELECT * FROM ci_diem_testamenta ORDER BY id');
  };

  const getBooks = (testamentId?: number): Book[] => {
    if (testamentId !== undefined) {
      return db.getAllSync<Book>(
        'SELECT * FROM ci_diem_boky WHERE b_testid = ? ORDER BY b_order',
        [testamentId]
      );
    }
    return db.getAllSync<Book>('SELECT * FROM ci_diem_boky ORDER BY b_order');
  };

  const getChapters = (bookId: number): number[] => {
    const rows = db.getAllSync<{ a_toko: string }>(
      'SELECT DISTINCT a_toko FROM ci_diem_andininy WHERE a_bid = ? ORDER BY CAST(a_toko AS INTEGER)',
      [bookId]
    );
    return rows.map((r) => parseInt(r.a_toko, 10));
  };

  const getVerses = (bookId: number, chapter: number): Verse[] => {
    return db.getAllSync<Verse>(
      'SELECT * FROM ci_diem_andininy WHERE a_bid = ? AND a_toko = ? ORDER BY a_order',
      [bookId, chapter.toString()]
    );
  };

  const searchVerses = (query: string, limit = 50): SearchResult[] => {
    if (!query.trim()) return [];
    return db.getAllSync<SearchResult>(
      `SELECT v.*, b.b_name
       FROM ci_diem_andininy v
       JOIN ci_diem_boky b ON v.a_bid = b.id
       WHERE v.a_text LIKE ?
       ORDER BY b.b_order, CAST(v.a_toko AS INTEGER), v.a_order
       LIMIT ?`,
      [`%${query.trim()}%`, limit]
    );
  };

  const getBookById = (bookId: number): Book | null => {
    return db.getFirstSync<Book>('SELECT * FROM ci_diem_boky WHERE id = ?', [bookId]) ?? null;
  };

  const getTestamentById = (testamentId: number): Testament | null => {
    return (
      db.getFirstSync<Testament>('SELECT * FROM ci_diem_testamenta WHERE id = ?', [testamentId]) ??
      null
    );
  };

  return {
    getTestaments,
    getBooks,
    getChapters,
    getVerses,
    searchVerses,
    getBookById,
    getTestamentById,
  };
}
