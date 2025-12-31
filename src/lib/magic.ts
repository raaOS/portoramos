import { Project } from '@/types/projects';

/**
 * Generates viral metrics for a project
 */
export interface CommentReply {
    id?: string;
    text: string;
    name: string;
    time: string;
    createdAt?: string;
    likes: number;
    avatar?: string;
}

export interface Comment {
    id?: string;
    text: string;
    name: string;
    time?: string;
    createdAt?: string;
    likes: number;
    likedByMe?: boolean;
    replies: CommentReply[];
    avatar?: string;
}

export interface ViralMetrics {
    likes: number;
    shares: number;
}

interface Vibe {
    type: string;
    comments: string[];
    admin_replies: string[];
    user_replies: string[];
}

/**
 * Generates viral metrics for a project
 */
export function generateViralMetrics(): ViralMetrics {
    return {
        likes: Math.floor(Math.random() * 41) + 5, // 5-45
        shares: Math.floor(Math.random() * 6)      // 0-5
    };
}

/**
 * Vibe definitions for comments
 */
export const COMMENT_VIBES: Vibe[] = [
    {
        type: "praise_short",
        comments: [
            "Keren banget! 🔥",
            "Suka banget sama warnanya ✨",
            "Gokil sih ini 👏",
            "Simple tapi ngena banget.",
            "Visualnya manja di mata �",
            "Favorit sih ini!",
            "Kelas abangku �",
            "Asli keren parah ✨",
            "Defisini 'Art' sesungguhnya",
            "Estetik parah! 🌈"
        ],
        admin_replies: [
            "Makasih banyak! 🙏",
            "Glad you like it! ✨",
            "Thank you! �",
            "Thanks for the support! 🔥"
        ],
        user_replies: [] // Usually no replies for short praise
    },
    {
        type: "praise_detailed",
        comments: [
            "Detail teksturnya dapet banget, rapi! �",
            "Komposisi warnanya juara sih ini, adem liatnya.",
            "Transisinya halus banget bang, enak dimata.",
            "Konsepnya out of the box banget, salut! 🧠",
            "Mood-nya dapet banget, agak dark tapi elegan.",
            "Pemilihan font-nya pas banget sama visualnya."
        ],
        admin_replies: [
            "Thank you! Emang agak tricky di bagian itu hehe ✨",
            "Makasih! Butuh waktu lama buat nemu mood yg pas ",
            "Thanks! Glad you noticed the details �️",
        ],
        user_replies: [
            "Setuju, mood-nya dapet banget emang.",
            "Iya, warnanya itu lho yg bikin beda."
        ]
    },
    {
        type: "curious_tech",
        comments: [
            "Pake software apa bang? Halus bgt.",
            "Ini render berapa lama bang? Penasaran 😂",
            "Workflow-nya gimana bang bisa sebersih ini?",
            "Pake plugin tambahan gak bang buat efek itu?",
            "Color grading-nya pake apa bang? Cakepp"
        ],
        admin_replies: [
            "Pake AE + Photoshop aja kok bang 🙏",
            "Render lumayan lama, ditinggal tidur semalem haha �",
            "Grading manual di Premiere bang hehe"
        ],
        user_replies: [
            "Kayaknya pake AE deh ini.",
            "Biasanya sih Red Giant bang kalo look gini."
        ]
    },
    {
        type: "joke_casual",
        comments: [
            "Info loker bang, mau berguru �",
            "Mundur bang, gantengnya kelewatan (karyanya maksudnya) 🤣",
            "Ajarin dong puh sepuh �",
            "Spek PC NASA ya bang? 😂",
            "Ginjal aman bang buat rakit PC ginian? 🤣"
        ],
        admin_replies: [
            "Waduh saya masih pemula bang 🙏😂",
            "PC kentang kok bang, kipasnya aja yg kenceng ✈️",
            "Aman bang, cuma makan mie instan sebulan 😂"
        ],
        user_replies: [
            "Wkwk PC NASA valid �",
            "Gas puh ajarin kita"
        ]
    }
];

const TIMES = ["2 menit yang lalu", "10 menit yang lalu", "30 menit yang lalu", "1 jam yang lalu", "2 jam yang lalu", "5 jam yang lalu", "10 jam yang lalu", "1 hari yang lalu", "2 hari yang lalu"];
const NAMES = ["Bagas", "Dinda", "Rizky", "Siti", "Adit", "Fajri", "Tiara", "Gilang", "Putri", "Zaki", "Budi", "Ani", "Joko", "Rina", "Setiawan", "Maya", "Kevin", "Lutfi", "Wawan", "Doni", "Togar", "Yanto", "Samsul", "Lala", "Eka", "Fani", "Gilang", "Hana", "Indra"];

function getRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generates a full thread of Gen-Z comments for a project
 */
export function generateGenZComments(slug: string, count?: number): Comment[] {
    const projectComments: Comment[] = [];

    let commentCount = 2; // Default

    if (typeof count === 'number') {
        commentCount = count;
    } else {
        // Randomize comment count: 0, 1, or 2 (Weighted towards 1 or 2, rarely 0)
        const seed = Math.random();
        if (seed > 0.8) commentCount = 1;
        if (seed > 0.95) commentCount = 0; // Rare: No comments
    }

    let repliesMade = 0;
    const usedReplyTexts = new Set<string>();

    // Pick different vibes for variety
    // Don't just pick one vibe for all comments in a project, mix them up.

    for (let i = 0; i < commentCount; i++) {
        const vibe = getRandom(COMMENT_VIBES);
        const text = getRandom(vibe.comments);

        const hasReplies = Math.random() > 0.6; // 40% chance of having a reply
        const replies: CommentReply[] = [];

        if (hasReplies) {
            const isOwnerReply = Math.random() > 0.3; // 70% chance it's admin replying
            if (isOwnerReply && vibe.admin_replies.length > 0) {
                const replyText = getRandom(vibe.admin_replies);
                replies.push({
                    id: `r-${slug}-${i}-admin`,
                    text: replyText,
                    name: "Ramos", // Owner name
                    time: getRandom(TIMES),
                    createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
                    likes: Math.floor(Math.random() * 20),
                    avatar: `https://ui-avatars.com/api/?name=Ramos&background=000&color=fff`
                });
            } else if (!isOwnerReply && vibe.user_replies.length > 0) {
                const replyText = getRandom(vibe.user_replies);
                const replierName = getRandom(NAMES);
                replies.push({
                    id: `r-${slug}-${i}-user`,
                    text: replyText,
                    name: replierName,
                    time: getRandom(TIMES),
                    createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
                    likes: Math.floor(Math.random() * 20),
                    avatar: `https://ui-avatars.com/api/?name=${replierName}&background=random`
                });
            }
        }

        const name = getRandom(NAMES);
        projectComments.push({
            id: `c-${slug}-${i}-${Date.now()}`,
            text: text,
            name: name,
            createdAt: new Date(Date.now() - Math.random() * 172800000).toISOString(), // Within last 2 days
            likes: Math.floor(Math.random() * 100),
            replies: replies,
            avatar: `https://ui-avatars.com/api/?name=${name}&background=random`
        });
    }

    return projectComments;
}
