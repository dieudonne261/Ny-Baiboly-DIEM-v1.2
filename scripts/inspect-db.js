const path = require('path');
const Database = require('better-sqlite3');
const db = new Database(path.join(__dirname, '../assets/diem.db'), { readonly: true });

const books = db.prepare("SELECT COUNT(*) as count FROM ci_diem_boky").get();
const testaments = db.prepare("SELECT * FROM ci_diem_testamenta").all();
const verses = db.prepare("SELECT COUNT(*) as count FROM ci_diem_andininy").get();
const chapters = db.prepare("SELECT a_bid, COUNT(DISTINCT a_toko) as ch_count FROM ci_diem_andininy GROUP BY a_bid LIMIT 10").all();
const allBooks = db.prepare("SELECT b.*, t.test_name FROM ci_diem_boky b JOIN ci_diem_testamenta t ON b.b_testid = t.id ORDER BY b.b_order").all();

console.log('Total books:', books.count);
console.log('Total verses:', verses.count);
console.log('Testaments:', JSON.stringify(testaments, null, 2));
console.log('First 10 books with chapter counts:', JSON.stringify(chapters, null, 2));
console.log('All books:', JSON.stringify(allBooks, null, 2));
db.close();
