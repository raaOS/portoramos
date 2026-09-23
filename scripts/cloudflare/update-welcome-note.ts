/**
 * Update welcome sticky note text di D1 (content/sticky-notes).
 *
 * Usage:
 *   npx tsx scripts/cloudflare/update-welcome-note.ts          # dry-run
 *   npx tsx scripts/cloudflare/update-welcome-note.ts --apply  # tulis ke D1
 */
import * as dotenv from 'dotenv';
import path from 'path';
import { getD1Value, setD1Value } from '../../src/lib/cloudflareD1';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const NEW_TEXT = `Halo! Selamat datang di Ramos OS v2.0 🖥️✨
Hi! Welcome to my desktop portfolio.

Yuk coba / Try these:
• Buka "My Projects" — grid & 3D view
• Klik "WhatsApp" — baca testimoni
• Drag window-nya ke mana aja
• Ctrl+K = Spotlight cari apa saja
• Space = Quick Look preview
• Musik ada di menu bar atas

Have fun exploring!`;

interface NoteLike {
  id?: string;
  text?: string;
  [key: string]: unknown;
}

async function main() {
  const apply = process.argv.includes('--apply');

  // Dua bentuk storage mungkin: key literal "content/sticky-notes"
  // atau nested di dalam row "content" → .sticky-notes
  let notes = await getD1Value<NoteLike[]>('content/sticky-notes');
  let source = 'content/sticky-notes (direct)';

  if (!notes) {
    const content = await getD1Value<{ 'sticky-notes'?: NoteLike[]; stickyNotes?: NoteLike[] }>(
      'content'
    );
    notes = content?.['sticky-notes'] ?? content?.stickyNotes ?? null;
    source = 'content (nested)';
  }

  if (!Array.isArray(notes) || notes.length === 0) {
    console.error('Tidak menemukan array sticky notes di D1.');
    process.exit(1);
  }

  console.log(`Sumber: ${source}`);
  console.log(`Jumlah note: ${notes.length}`);

  const welcome = notes.find((n) => (n.id || '').startsWith('welcome'));
  if (!welcome) {
    console.error('Note welcome tidak ditemukan. Id yang ada:', notes.map((n) => n.id));
    process.exit(1);
  }

  console.log('\n--- SEBELUM ---');
  console.log('id:', welcome.id);
  console.log('text:', String(welcome.text || '').slice(0, 200));

  if (!apply) {
    console.log('\n[dry-run] Teks baru (belum ditulis):');
    console.log(NEW_TEXT);
    console.log('\nJalankan dengan --apply untuk menulis ke D1.');
    return;
  }

  welcome.text = NEW_TEXT;
  welcome.date = new Date().toISOString();

  if (source.includes('direct')) {
    await setD1Value('content/sticky-notes', notes);
  } else {
    const content = await getD1Value<Record<string, unknown>>('content');
    const root = content && typeof content === 'object' ? content : {};
    root['sticky-notes'] = notes;
    await setD1Value('content', root);
  }

  console.log('\n--- SESUDAH (tersimpan) ---');
  console.log('text:', NEW_TEXT.slice(0, 80) + '...');
  console.log('\nSelesai. Catatan: cache ContentService TTL 30 detik.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
