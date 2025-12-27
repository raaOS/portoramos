/**
 * Fallback Content for About Page
 * Centralized content management for better maintainability
 */

import { ExperienceData } from '@/types/experience';
import { HardSkill } from '@/types/hardSkill';
import { HardSkillConcept } from '@/types/hardSkillConcept';
import { TRAIL_SRC_LIST } from './trailPlaceholders';

export const FALLBACK_WORK_EXPERIENCE: ExperienceData['workExperience'] = [
    {
        year: 'Nov 2019 - Saat ini',
        duration: '5 tahun 10 bulan',
        company: 'PT. Bitlabs Academy',
        position: 'Graphic Designer',
        description: [
            'Bertanggung jawab atas semua konten visual desain dalam perusahaan secara online dan offline',
            'membantu UI/UX di Bitlabs'
        ],
        imageUrl: 'https://res.cloudinary.com/dcb3dslfw/image/upload/v1757670693/22135476_1681729415202235_8260990640991011189_o_ytzn9r.jpg'
    },
    {
        year: 'Jan 2019 - Jan 2020',
        duration: '1 tahun 1 bulan',
        company: 'Sekolah Desain',
        position: 'Mentor Desain Grafis',
        description: [
            'Melakukan kegiatan pembelajaran/sharing session dengan mahasiswa sesuai jadwal yang ditetapkan perusahaan. Melakukan observasi, monitoring, memberikan masukan dan saran perbaikan terkait kinerja peserta dan memastikan paham tentang desain grafis.'
        ],
        imageUrl: 'https://res.cloudinary.com/dcb3dslfw/image/upload/v1757669168/ChatGPT_Image_Apr_30_2025_01_45_08_AM_1_mkd574.png'
    },
    {
        year: 'Mar 2017 - Nov 2019',
        duration: '2 tahun 9 bulan',
        company: 'PT. Duta Mode',
        position: 'Graphic Designer',
        description: [
            'Berperan dalam perancangan strategi untuk promosi perusahaan.',
            'Bertanggung jawab atas semua konten visual desain dalam perusahaan secara online dan offline'
        ],
        imageUrl: 'https://res.cloudinary.com/dcb3dslfw/image/upload/v1757681229/CELENGAN_ylksyp.jpg'
    },
    {
        year: 'Agt 2016 - Mar 2017',
        duration: '8 bulan',
        company: 'Sthal.Co',
        position: 'Graphic Designer & Admin',
        description: [
            'Bertanggung jawab sebagain Admin Online dalam memasarkan dan merespon chat dari pembeli',
            'Berhasil Mendesain product tshirt dan membantu dalam mencapai targate penjualan',
            'Bertanggung jawab atas semua konten visual desain dalam perusahaan secara online dan offlin',
            'Mengirim, Mengawasi, Mencatat Produk Sthal. Co'
        ],
        imageUrl: 'https://res.cloudinary.com/dcb3dslfw/image/upload/v1757670693/22135476_1681729415202235_8260990640991011189_o_ytzn9r.jpg'
    },
    {
        year: 'Okt 2012 - Agt 2015',
        duration: '2 tahun 11 bulan',
        company: 'PT Sari Coffee Indonesia',
        position: 'Barista Starbuck Coffee',
        description: [
            'Berhasil memiliki sertifikat coffee master dari PT.sari coffee indonesia dan memiliki pegetahuan mengenai dunia coffe yg di traning langsung dari starbucks',
            'Berhasil dalam mengenalkan info seputar dunia kopi ke customer',
            'Melayani transaksi customer'
        ],
        imageUrl: 'https://res.cloudinary.com/dcb3dslfw/image/upload/v1757669168/ChatGPT_Image_Apr_30_2025_01_45_08_AM_1_mkd574.png'
    },
    {
        year: 'Jan 2012 - Mar 2012',
        duration: '3 bulan',
        company: 'Wulan Boutique',
        position: 'Graphic Designer & Admin',
        description: [
            'Bertanggung jawab sebagain Admin Online dalam memasarkan dan merespon chat dari pembeli',
            'Bertanggung jawab atas semua konten visual desain dalam perusahaan secara online dan offlin',
            'Mengirim, Mengawasi, Mencatat Produk Wulan Butique'
        ],
        imageUrl: 'https://res.cloudinary.com/dcb3dslfw/image/upload/v1757681229/CELENGAN_ylksyp.jpg'
    }
];

export const FALLBACK_HARD_SKILLS: HardSkill[] = [
    {
        id: 'hard-ai',
        name: 'Adobe Illustrator',
        iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/illustrator/illustrator-plain.svg',
        level: 'Expert',
        order: 1,
        createdAt: '',
        updatedAt: '',
    },
    {
        id: 'hard-ps',
        name: 'Adobe Photoshop',
        iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/photoshop/photoshop-plain.svg',
        level: 'Expert',
        order: 2,
        createdAt: '',
        updatedAt: '',
    },
    {
        id: 'hard-figma',
        name: 'Figma',
        iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg',
        level: 'Advanced',
        order: 3,
        createdAt: '',
        updatedAt: '',
    },
    {
        id: 'hard-canva',
        name: 'Canva',
        iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/canva/canva-original.svg',
        level: 'Intermediate',
        order: 4,
        createdAt: '',
        updatedAt: '',
    },
];

export const FALLBACK_HARD_SKILL_CONCEPTS: HardSkillConcept[] = [
    {
        id: 'concept-typography',
        title: 'Tipografi',
        description: 'memahami jenis huruf, hierarki teks, dan readability',
        order: 1,
        createdAt: '',
        updatedAt: '',
    },
    {
        id: 'concept-color',
        title: 'Teori warna',
        description: 'color psychology, color harmony, kontras, dan palet warna',
        order: 2,
        createdAt: '',
        updatedAt: '',
    },
    {
        id: 'concept-layout',
        title: 'Layout & Grid System',
        description: 'mengatur komposisi visual agar rapi, seimbang, dan mudah dibaca',
        order: 3,
        createdAt: '',
        updatedAt: '',
    },
    {
        id: 'concept-branding',
        title: 'Branding & Identitas Visual',
        description: 'membuat logo, guideline brand, desain konsisten untuk bisnis',
        order: 4,
        createdAt: '',
        updatedAt: '',
    },
];

export const SOFT_SKILLS = {
    texts: [
        "Kreativitas & Inovasi",
        "Komunikasi Visual",
        "Problem Solving",
        "Adaptabilitas",
        "Attention to Detail",
        "Time Management",
        "Collaboration",
        "Continuous Learning"
    ],
    descriptions: [
        "Mampu menghasilkan ide-ide segar dan solusi desain yang unik.",
        "Menyampaikan pesan melalui elemen visual yang efektif dan menarik.",
        "Menganalisis kebutuhan klien dan menemukan solusi desain yang tepat.",
        "Menyesuaikan diri dengan perubahan teknologi dan tren industri.",
        "Memperhatikan detail kecil yang membuat desain terlihat profesional.",
        "Mengelola deadline dan prioritas dengan efisien.",
        "Bekerja sama dengan tim dan klien untuk mencapai tujuan bersama.",
        "Selalu update dengan skill dan teknologi terbaru di bidang desain."
    ]
};

export const FALLBACK_ABOUT_DATA = {
    hero: {
        title: 'ABOUT ME',
        backgroundTrail: []
    },
    professional: {
        motto: {
            badge: 'Motto kerja',
            quote: '"Desain adalah solusi visual, bukan sekadar estetika."'
        },
        bio: {
            content: 'Desainer grafis dengan lebih dari 14 tahun pengalaman di brand dan kampanye digital. Fokus pada visual bersih, tipografi kuat, dan storytelling yang relevan bisnis.',
            galleryImages: []
        }
    }
};
