import { Project } from '@/types/projects';

/**
 * Generates viral metrics for a project
 */
export interface CommentReply {
    id?: string;
    text: string;
    author: string;
    time: string;
    createdAt?: string;
    likes: number;
}

export interface Comment {
    id?: string;
    text: string;
    author: string;
    time: string;
    createdAt?: string;
    likes: number;
    likedByMe?: boolean;
    replies: CommentReply[];
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
        likes: Math.floor(Math.random() * 401) + 100, // 100-500
        shares: Math.floor(Math.random() * 81) + 20   // 20-100
    };
}

/**
 * Vibe definitions for comments
 */
export const COMMENT_VIBES: Vibe[] = [
    {
        type: "praise_suhu",
        comments: [
            "Tutor suhu 🙏 Kelas banget karyanya abangku 🔥",
            "Ajarin dong puh (sepuh), ngeri banget visualnya 🙏✨",
            "Menyala abangku! 🔥 Detailnya gila bgt no debat",
            "Tutorialnya ditunggu suhu, butuh pencerahan ✨⚙️",
            "Otw daftar jadi murid suhu 🙏🔥"
        ],
        admin_replies: [
            "Aman bang, menyala terus! 🚀",
            "Masih belajar ini masku, gass terus! 🙏",
            "Waduh panggil sepuh pula, masih pemula bang 🙏😂",
            "Siap bang, nanti coba dibuatkan tutorialnya ya! ✨"
        ],
        user_replies: [
            "Gas puh, ajarin kita semua 🙏",
            "Fix no debat, ini guru kita semua 🔥",
            "Info loker dong mumpung ada suhu di sini 🚩"
        ]
    },
    {
        type: "praise_king",
        comments: [
            "Mantap king! Mahkotanya otw JNE Cakung ya 👑🚩",
            "Ini mahkotanya lagi transit di Hub Cakung bang 😂👑🚩",
            "JNE Cakung sedang memproses mahkota emas anda 🚩🚩🚩",
            "Gak ada obat emang ide-idenya, menyala abangku! 🔥👑"
        ],
        admin_replies: [
            "Waduh jauh juga ya Cakung, ditunggu king! 😂🔥",
            "Hub Cakung emang boss level pengiriman bang 😂🙏",
            "Wahahaha kena tahan kurir itu mahkotanya 👑"
        ],
        user_replies: [
            "Hub Cakung emang ngeri bang, sabar ya 😂",
            "Kurirnya pasti terpana liat mahkotanya ✨",
            "Minimal kasih lawn lah bang jangan jago sendiri 😂"
        ]
    },
    {
        type: "gen_z_casual",
        comments: [
            "Gak ada obat! Vibesnya gokil bgt parah ✨😎",
            "Warna-warnanya dapet bgt, estetik parah! ✨🌈",
            "Gak capek ya jadi keren terus? 😂✨",
            "Visualnya pecah bgt abangku! Menyala 🔥✨",
            "Vaporwave vibes-nya dapet bgt, chill bgt liatnya 💜✨",
            "Gak pernah gagal kalau abang satu ini yang pegang ✨🔥"
        ],
        admin_replies: [
            "Thank you! Lowkey eksperimen aja ini hehe ✨",
            "Bisa aja, kebetulan lagi mood aja kemarin 🙏",
            "Gass terus jangan kasih kendor! 🔥🚩",
            "Glad you like it bro! ✨🚀"
        ],
        user_replies: [
            "Iya woee, vibenya dapet bgt parah 🌈",
            "Gak bahaya ta? Ngeri kali bah ✨🚩",
            "Doi emang gak pernah gagal sctipt-nya 🔥"
        ]
    },
    {
        type: "tech_question",
        comments: [
            "Info spek PC dong bang, pasti spek dewa ini 🙏💻",
            "Pakai software apa bang? Halus bgt motionnya ✨⚙️",
            "Renderingnya berapa lama nih puh? 🚀",
            "Info workshop dong, minat belajar serius nih 🙏"
        ],
        admin_replies: [
            "Rata kanan bang! Pakai Photoshop fitur Timeline Animasi & Audio hehe 🙏",
            "Masih pakai laptop kentang kok bang beneran 😂",
            "Rendering seharian bang, sampai mau meledak PC-nya 😂🚀"
        ],
        user_replies: [
            "PC dewa mah bebas ya bang 🙏",
            "Laptop kentang aja begini, apalagi PC dewa 🔥",
            "Gak masuk akal kerennya, fix cheat ini mah! 😂🔥"
        ]
    }
];

const TIMES = ["2 menit yang lalu", "10 menit yang lalu", "30 menit yang lalu", "1 jam yang lalu", "2 jam yang lalu", "5 jam yang lalu", "10 jam yang lalu", "1 hari yang lalu", "2 hari yang lalu"];
const NAMES = ["Bagas", "Dinda", "Rizky", "Siti", "Adit", "Fajri", "Tiara", "Gilang", "Putri", "Zaki", "Budi", "Ani", "Joko", "Rina", "Setiawan", "Maya", "Kevin", "Lutfi", "Wawan", "Doni", "Togar", "Yanto", "Samsul", "Lala"];

function getRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generates a full thread of Gen-Z comments for a project
 */
export function generateGenZComments(slug: string): Comment[] {
    const projectComments: Comment[] = [];
    const commentCount = 10;
    const targetTotalReplies = 20;

    let repliesMade = 0;
    const usedReplyTexts = new Set<string>();

    for (let i = 0; i < commentCount; i++) {
        const vibe = getRandom(COMMENT_VIBES);
        const commentText = getRandom(vibe.comments);
        const replies: CommentReply[] = [];

        // Admin reply for first comment
        if (i === 0) {
            const replyText = getRandom(vibe.admin_replies);
            replies.push({
                id: `r-${slug}-${i}-admin`,
                text: replyText,
                author: "Admin",
                time: getRandom(TIMES),
                likes: Math.floor(Math.random() * 20)
            });
            usedReplyTexts.add(replyText);
            repliesMade++;
        }

        // Random additional replies
        if (repliesMade < targetTotalReplies) {
            let subReplyCount = Math.floor(Math.random() * 3);
            if (i === 0 && subReplyCount < 1) subReplyCount = 1;

            for (let j = 0; j < subReplyCount; j++) {
                if (repliesMade >= targetTotalReplies) break;

                const isUserReply = Math.random() > 0.3;
                const source = isUserReply ? vibe.user_replies : vibe.admin_replies;
                let replyText = getRandom(source);

                let attempts = 0;
                while (usedReplyTexts.has(replyText) && attempts < 10) {
                    replyText = getRandom(source);
                    attempts++;
                }

                if (!usedReplyTexts.has(replyText)) {
                    replies.push({
                        id: `r-${slug}-${i}-${j}-${Date.now()}`,
                        text: replyText,
                        author: isUserReply ? getRandom(NAMES) : "Admin",
                        time: getRandom(TIMES),
                        likes: Math.floor(Math.random() * 20)
                    });
                    usedReplyTexts.add(replyText);
                    repliesMade++;
                }
            }
        }

        projectComments.push({
            id: `c-${slug}-${i}-${Date.now()}`,
            text: commentText,
            author: getRandom(NAMES),
            time: getRandom(TIMES),
            likes: Math.floor(Math.random() * 100),
            replies: replies
        });
    }

    return projectComments;
}
