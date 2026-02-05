import { StaticImageData } from "next/image";

export interface ChatMessage {
    id: number;
    text: string;
    isMe: boolean;
    time: string;
    status: 'sent' | 'read';
}

export interface ContactProfile {
    id: string;
    name: string;
    avatar: string;
    status: string;
    conversation: ChatMessage[];
}

export const mockChats: Record<string, ContactProfile> = {
    "Sari Rahmawati": {
        id: "sari",
        name: "Sari Rahmawati",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop", // Wanita Indo natural
        status: "Online",
        conversation: [
            { id: 1, text: "Halo Mas, desain kemasannya udah dilihat tim.", isMe: false, time: "09:41", status: 'read' },
            { id: 2, text: "Pada suka banget sama pilihan warnanya, seger.", isMe: false, time: "09:41", status: 'read' },
            { id: 3, text: "Syukur deh kalau cocok Mbak.", isMe: true, time: "09:42", status: 'read' },
            { id: 4, text: "Cuma logonya bisa digedein dikit lagi gak?", isMe: false, time: "09:45", status: 'read' },
            { id: 5, text: "Bisa banget. Nanti sore saya kirim revisinya ya.", isMe: true, time: "09:50", status: 'read' },
            { id: 6, text: "Mas, desain kemasannya udah dilihat tim. Suka!", isMe: false, time: "10:00", status: 'read' },
        ]
    },
    "Dodi Kurniawan": {
        id: "dodi",
        name: "Dodi Kurniawan",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150&auto=format&fit=crop", // Pria Indo
        status: "Terakhir dilihat 10:30",
        conversation: [
            { id: 1, text: "Woi bro, apa kabar?", isMe: false, time: "Kemarin", status: 'read' },
            { id: 2, text: "Baik bro. Tumben chat, kenapa nih?", isMe: true, time: "Kemarin", status: 'read' },
            { id: 3, text: "Baru liat update portfolio lu.", isMe: false, time: "Kemarin", status: 'read' },
            { id: 4, text: "Keren parah sekarang, makin jago aja lu.", isMe: false, time: "10:15", status: 'read' },
            { id: 5, text: "Haha bisa aja lu. Masih belajar ini juga.", isMe: true, time: "10:20", status: 'read' },
            { id: 6, text: "Wih, web lu sekarang keren amat bro.", isMe: false, time: "10:25", status: 'read' },
        ]
    },
    "Pak Bambang": {
        id: "bambang",
        name: "Pak Bambang",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop", // Bapak-bapak
        status: "Online",
        conversation: [
            { id: 1, text: "Selamat siang Mas Ramos.", isMe: false, time: "08:00", status: 'read' },
            { id: 2, text: "Siang Pak Bambang.", isMe: true, time: "08:15", status: 'read' },
            { id: 3, text: "Proposal penawaran yang mas kirim sudah saya baca.", isMe: false, time: "08:20", status: 'read' },
            { id: 4, text: "Secara konsep saya setuju. Kapan kira-kira bisa meeting?", isMe: false, time: "08:25", status: 'read' },
            { id: 5, text: "Besok siang saya kosong Pak.", isMe: true, time: "08:30", status: 'read' },
            { id: 6, text: "Siang Mas, proposal penawaran sudah saya baca.", isMe: false, time: "08:35", status: 'read' },
        ]
    },
    "Rini (HRD)": {
        id: "rini",
        name: "Rini (HRD)",
        avatar: "https://images.unsplash.com/photo-1624561172888-ac93c696e10c?q=80&w=150&auto=format&fit=crop", // Wanita Hijab/Professional
        status: "Akun Bisnis",
        conversation: [
            { id: 1, text: "Halo Mas, saya Rini dari PT Kreatif Maju.", isMe: false, time: "Senin", status: 'read' },
            { id: 2, text: "Kami lagi butuh freelance untuk redesign website company profile.", isMe: false, time: "Senin", status: 'read' },
            { id: 3, text: "Saya lihat portfolio mas cocok banget sama image perusahaan kami.", isMe: false, time: "09:00", status: 'read' },
            { id: 4, text: "Wah menarik Mbak Rini. Deadline-nya kapan ya?", isMe: true, time: "09:05", status: 'read' },
            { id: 5, text: "Bulan depan sih Mas. Bisa kita zoom sebentar minggu depan buat bahas briefnya?", isMe: false, time: "09:10", status: 'read' },
            { id: 6, text: "Halo Mas, bisa diskusi soal project redesign web?", isMe: false, time: "09:15", status: 'read' },
        ]
    },
    "Andi Fotografer": {
        id: "andi",
        name: "Andi Fotografer",
        avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=150&auto=format&fit=crop", // Cowok creative
        status: "Online",
        conversation: [
            { id: 1, text: "Mas, foto katalog kemarin udah saya edit semua.", isMe: false, time: "11:00", status: 'read' },
            { id: 2, text: "Link Google Drive udah di email ya.", isMe: false, time: "11:00", status: 'read' },
            { id: 3, text: "Oke siap Mas Andi. Nanti saya cek.", isMe: true, time: "11:05", status: 'read' },
            { id: 4, text: "Sip. Kabarin aja kalau ada tone warna yang kurang pas.", isMe: false, time: "11:10", status: 'read' },
            { id: 5, text: "Mas, foto katalog kemarin udah saya edit ya.", isMe: false, time: "11:12", status: 'read' },
        ]
    }
};
