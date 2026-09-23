import type { Comment } from '@/lib/magic';

export const NAMES = [
  'Bagas', 'Dinda', 'Rizky', 'Siti', 'Adit', 'Fajri', 'Tiara', 'Gilang', 'Putri', 'Zaki',
  'Budi', 'Ani', 'Joko', 'Rina', 'Setiawan', 'Maya', 'Hendra', 'Dewi', 'Agus', 'Mega',
  'Fajar', 'Fitri', 'Ahmad', 'Laras', 'Bayu', 'Wulan', 'Dedi', 'Indah', 'Rudi', 'Sari',
  'Andi', 'Nia', 'Toni', 'Putu', 'Made', 'Nyoman', 'Ketut', 'Gede', 'Wayan', 'Ilham',
  'Angga', 'Bella', 'Chandra', 'Dimas', 'Eka', 'Febri', 'Gita', 'Hana', 'Indra', 'Jihan',
  'Kurniawan', 'Lia', 'Maman', 'Novi', 'Okta', 'Pratama', 'Qori', 'Rangga', 'Shinta', 'Taufik',
  'Umar', 'Vina', 'Wahyu', 'Xena', 'Yanto', 'Zahra', 'Arief', 'Bambang', 'Catur', 'Dwi',
  'Edi', 'Farhan', 'Galih', 'Hari', 'Irfan', 'Jaka', 'Kevin', 'Lutfi', 'Mulyono', 'Nanda',
  'Oki', 'Panji', 'Rama', 'Sandy', 'Tegar', 'Ujang', 'Vicky', 'Wawan', 'Yuda', 'Zul',
  'Aldo', 'Bunga', 'Citra', 'Doni', 'Elsa', 'Faisal', 'Grace', 'Iwan', 'Joni',
  'Kartika', 'Luluk', 'Mahendra', 'Neneng', 'Olga', 'Putra', 'Rian', 'Siska', 'Tari', 'Uli',
  'Valen', 'Widi', 'Yogi', 'Zainal', 'Abdi', 'Bintang', 'Cipta', 'Danu', 'Endang', 'Feri',
  'Guntur', 'Husein', 'Imam', 'Julio', 'Kiki', 'Lukman', 'Mila', 'Nunu', 'Oky', 'Pipin',
  'Restu', 'Seno', 'Tio', 'Utoyo', 'Vero', 'Wira', 'Yunus', 'Zain', 'Samsul', 'Eka',
  'Fani', 'Hana', 'Lala', 'Taufan', 'Dewo', 'Arya', 'Sakti', 'Gusti', 'Agung', 'Cokorda'
];

interface AiReplyDraft { text?: unknown; name?: unknown; likes?: unknown; }
interface AiCommentDraft extends AiReplyDraft { replies?: unknown; }

const toOptionalString = (value: unknown) => typeof value === 'string' && value.trim() ? value : undefined;

export function parseAndFormatAiComments(text: string, slug: string): Comment[] {
  const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsedArray = JSON.parse(jsonText) as unknown;
  if (!Array.isArray(parsedArray)) throw new Error('AI output is not a JSON array');

  return parsedArray
    .map((item, i: number) => {
      const c = item as AiCommentDraft;
      const name = toOptionalString(c.name) || NAMES[Math.floor(Math.random() * NAMES.length)];
      const replyDrafts = Array.isArray(c.replies) ? c.replies : [];
      const replies = replyDrafts
        .map((replyItem, ri: number) => {
          const r = replyItem as AiReplyDraft;
          const replyText = toOptionalString(r.text);
          if (!replyText) return null;
          const replyName = toOptionalString(r.name) || 'Ramos';
          return {
            id: `r-${slug}-${i}-${ri}-ai`,
            text: replyText,
            name: replyName,
            time: 'Baru saja',
            createdAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
            likes: typeof r.likes === 'number' ? r.likes : Math.floor(Math.random() * 10),
            avatar:
              replyName === 'Ramos'
                ? `https://ui-avatars.com/api/?name=Ramos&background=000&color=fff`
                : `https://ui-avatars.com/api/?name=${replyName}&background=random`,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      const commentText = toOptionalString(c.text);
      if (!commentText) return null;

      return {
        id: `c-${slug}-${i}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        text: commentText,
        name: name,
        time: 'Beberapa menit yang lalu',
        createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        likes: typeof c.likes === 'number' ? c.likes : Math.floor(Math.random() * 50),
        replies: replies,
        avatar: `https://ui-avatars.com/api/?name=${name}&background=random`,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);
}
