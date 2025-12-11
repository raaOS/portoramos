'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import NextImage from 'next/image';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import GalleryMini from '@/components/GalleryMini';
import DesignSkillIcons from '@/components/DesignSkillIcons';
import SwayingGallery from '@/components/SwayingGallery';
import AnimatedCounter from '@/components/AnimatedCounter';
import HorizontalCounterAnimation from '@/components/HorizontalCounterAnimation';
import HorizontalTestimonial from '@/components/HorizontalTestimonial';
import { ExperienceData } from '@/types/experience';

import { HardSkill } from '@/types/hardSkill';
import { HardSkillConcept } from '@/types/hardSkillConcept';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { useNavbarVisibility } from '@/contexts/NavbarVisibilityContext';
import { Reveal, StaggerContainer, StaggerItem } from '@/components/Reveal';
import BlurTextLoop from '@/components/BlurTextLoop';
import RunningTextSection from '@/components/RunningTextSection';
import AITranslator from '@/components/AITranslator';

const TextMorph = dynamic(() => import('@/components/TextMorph'), {
  ssr: false
});
const SimpleTrail = dynamic(() => import('@/components/SimpleTrail'), {
  ssr: false
});

// Soft Skills data untuk TextMorph
const softSkills = {
  texts: [
    "Kreativitas & Inovasi",
    "Desain Grafis Kreatif",
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
    "Mengemas pesan brand jadi visual yang berani, konsisten, dan mudah diingat.",
    "Menyampaikan pesan melalui elemen visual yang efektif dan menarik.",
    "Menganalisis kebutuhan klien dan menemukan solusi desain yang tepat.",
    "Menyesuaikan diri dengan perubahan teknologi dan tren industri.",
    "Memperhatikan detail kecil yang membuat desain terlihat profesional.",
    "Mengelola deadline dan prioritas dengan efisien.",
    "Bekerja sama dengan tim dan klien untuk mencapai tujuan bersama.",
    "Selalu update dengan skill dan teknologi terbaru di bidang desain."
  ]
};

const FALLBACK_WORK_EXPERIENCE: ExperienceData['workExperience'] = [
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

import { TrailItem } from '@/types/about';

// ... (imports)

interface AboutClientProps {
  initialData?: {
    hero?: {
      title: string | null;
      title_id?: string | null;
      backgroundTrail: (string | TrailItem)[]; // Updated
    };
    professional?: {
      motto: {
        badge: string;
        badge_id?: string;
        quote: string;
        quote_id?: string;
      };
      bio: {
        content: string;
        content_id?: string;
        galleryImages: (string | TrailItem)[]; // Updated
      };
    };
  };
  lastUpdated?: Date | null;
}

export default function AboutClient({ initialData, lastUpdated }: AboutClientProps) {
  const [isClient, setIsClient] = useState(false);
  const [currentSoftSkillDescription, setCurrentSoftSkillDescription] = useState(softSkills.descriptions[0]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const { scrollToSection } = useSmoothScroll();

  // Fallback data jika initialData tidak ada
  const fallbackData = {
    hero: {
      title: 'ABOUT ME',
      title_id: 'TENTANG SAYA',
      backgroundTrail: [
        '/images/trail/trail1.jpg',
        '/images/trail/trail2.jpg',
        '/images/trail/trail3.jpg',
        '/images/trail/trail4.jpg',
        '/images/trail/trail5.jpg'
      ]
    },
    professional: {
      motto: {
        badge: 'Work Motto',
        badge_id: 'Motto Kerja',
        quote: '"Design is a visual solution, not just aesthetics."',
        quote_id: '"Desain adalah solusi visual, bukan sekadar estetika."'
      },
      bio: {
        content: 'Graphic designer with over 14 years of experience in branding and digital campaigns. Focused on clean visuals, strong typography, and business-relevant storytelling.',
        content_id: 'Desainer grafis dengan lebih dari 14 tahun pengalaman di brand dan kampanye digital. Fokus pada visual bersih, tipografi kuat, dan storytelling yang relevan bisnis.',
        galleryImages: [
          '/images/trail/trail1.jpg',
          '/images/trail/trail2.jpg',
          '/images/trail/trail3.jpg',
          '/images/trail/trail4.jpg',
          '/images/trail/trail5.jpg',
          '/images/trail/trail6.jpg'
        ]
      }
    }
  };

  const [currentAboutData] = useState(initialData || fallbackData);

  const { hideNavbar, showNavbar } = useNavbarVisibility();
  const {
    data: experienceData,
    isError: experienceError,
    error: experienceErrorDetail,
  } = useQuery<ExperienceData>({
    queryKey: ['experience'],
    queryFn: async () => {
      const response = await fetch('/api/experience');
      if (!response.ok) {
        throw new Error('Gagal memuat pengalaman kerja');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
  const resolvedWorkExperience = (experienceData?.workExperience?.length
    ? experienceData.workExperience.filter((e) => e.isActive !== false)
    : FALLBACK_WORK_EXPERIENCE);

  // Pastikan selalu ada 6 item untuk grid 3x2 / 2x3; isi kekurangan dengan fallback
  const normalizedWorkExperience =
    resolvedWorkExperience.length >= 6
      ? resolvedWorkExperience
      : [...resolvedWorkExperience, ...FALLBACK_WORK_EXPERIENCE].slice(0, 6);

  const workExperienceForGallery = normalizedWorkExperience.slice(0, 6);

  const {
    data: hardSkillsData,
    isError: hardSkillsError,
  } = useQuery<{ skills: HardSkill[]; lastUpdated: string }>({
    queryKey: ['hard-skills'],
    queryFn: async () => {
      const response = await fetch('/api/hard-skills');
      if (!response.ok) {
        throw new Error('Gagal memuat hard skills');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const fallbackHardSkills: HardSkill[] = [
    {
      id: 'hard-ai',
      name: 'Adobe Illustrator',
      iconUrl: 'https://res.cloudinary.com/demo/image/upload/v1690000000/icons/ai.png',
      level: 'Expert',
      order: 1,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'hard-ps',
      name: 'Adobe Photoshop',
      iconUrl: 'https://res.cloudinary.com/demo/image/upload/v1690000000/icons/ps.png',
      level: 'Expert',
      order: 2,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'hard-figma',
      name: 'Figma',
      iconUrl: 'https://res.cloudinary.com/demo/image/upload/v1690000000/icons/figma.png',
      level: 'Advanced',
      order: 3,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'hard-canva',
      name: 'Canva',
      iconUrl: 'https://res.cloudinary.com/demo/image/upload/v1690000000/icons/canva.png',
      level: 'Intermediate',
      order: 4,
      createdAt: '',
      updatedAt: '',
    },
  ];

  const resolvedHardSkills =
    hardSkillsData?.skills?.length
      ? hardSkillsData.skills.filter((s) => s.isActive !== false)
      : fallbackHardSkills;

  const {
    data: hardSkillConceptsData,
    isError: hardSkillConceptsError,
  } = useQuery<{ concepts: HardSkillConcept[]; lastUpdated: string }>({
    queryKey: ['hard-skill-concepts'],
    queryFn: async () => {
      const response = await fetch('/api/hard-skills/concepts');
      if (!response.ok) {
        throw new Error('Gagal memuat konsep hard skills');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const fallbackConcepts: HardSkillConcept[] = [
    {
      id: 'concept-typography',
      title: 'Tipografi',
      title_id: 'Tipografi',
      description: 'memahami jenis huruf, hierarki teks, dan readability',
      description_id: 'memahami jenis huruf, hierarki teks, dan keterbacaan',
      order: 1,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'concept-color',
      title: 'Teori warna',
      title_id: 'Teori Warna',
      description: 'color psychology, color harmony, kontras, dan palet warna',
      description_id: 'psikologi warna, harmoni warna, kontras, dan palet warna',
      order: 2,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'concept-layout',
      title: 'Layout & Grid System',
      title_id: 'Tata Letak & Sistem Grid',
      description: 'mengatur komposisi visual agar rapi, seimbang, dan mudah dibaca',
      description_id: 'mengatur komposisi visual agar rapi, seimbang, dan mudah dibaca',
      order: 3,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'concept-branding',
      title: 'Branding & Identitas Visual',
      title_id: 'Branding & Identitas Visual',
      description: 'membuat logo, guideline brand, desain konsisten untuk bisnis',
      description_id: 'membuat logo, panduan merek, desain konsisten untuk bisnis',
      order: 4,
      createdAt: '',
      updatedAt: '',
    },
  ];

  const resolvedConcepts =
    hardSkillConceptsData?.concepts?.length
      ? hardSkillConceptsData.concepts.filter((c) => c.isActive !== false)
      : fallbackConcepts;

  const heroTitleRaw = (currentAboutData.hero?.title || 'PORTOFOLIO').toUpperCase();
  const heroStartsWithPorto = /^porto/i.test(heroTitleRaw);
  const heroTail = heroStartsWithPorto
    ? heroTitleRaw.replace(/^porto\s*/i, '').trim() || 'FOLIO'
    : heroTitleRaw;
  const heroTailUpper = heroTail.toUpperCase();

  const handleImageClick = (imageSrc: string) => {
    hideNavbar();
    setPreviewImage(imageSrc);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    showNavbar();
    setIsPreviewOpen(false);
    setPreviewImage(null);
  };

  // Initialize description when component mounts
  useEffect(() => {
    setCurrentSoftSkillDescription(softSkills.descriptions[0]);
    setIsClient(true);
  }, []);

  // Animasi hero mobile diatur lewat BlurTextLoop dengan delay berbeda per baris

  const hardSkills = resolvedConcepts
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((concept) => ({
      category: concept.title,
      category_id: concept.title_id,
      content: concept.description || '',
      content_id: concept.description_id || '',
    }));

  // Get gallery images from currentAboutData or empty array
  // Sample images for gallery mini
  const galleryImages = currentAboutData?.professional?.bio?.galleryImages || [
    '/images/trail/trail1.jpg',
    '/images/trail/trail2.jpg',
    '/images/trail/trail3.jpg',
    '/images/trail/trail4.jpg',
    '/images/trail/trail5.jpg',
    '/images/trail/trail6.jpg'
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Section Navigation dengan Nomor */}
      <motion.div
        className="fixed right-8 top-1/2 transform -translate-y-1/2 z-30 hidden lg:block"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1 }}
      >
        <div className="flex flex-col space-y-4">
          {[
            { id: 'hero', label: 'Hero', number: '01' },
            { id: 'professional', label: 'About', number: '02' },
            { id: 'skills', label: 'Skills', number: '03' },
            { id: 'experience', label: 'Experience', number: '04' }
          ].map((section) => {
            const isActive = activeSection === section.id;
            return (
              <motion.button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  scrollToSection(section.id, 100);
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 ${isActive
                  ? 'bg-black text-white'
                  : 'bg-white text-black border border-black hover:bg-gray-100'
                  }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title={`Go to ${section.label} section`}
              >
                {section.number}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Section 1: ABOUT ME dengan Trail Effect */}
      <div id="hero" className="relative min-h-[35vh] md:min-h-[50vh]">
        {/* Trail Effect - hanya di section 1 */}
        <div className="absolute inset-0 z-10">
          {isClient ? (
            <SimpleTrail backgroundTrail={currentAboutData.hero?.backgroundTrail} />
          ) : (
            <div className="absolute inset-0 z-10" />
          )}
        </div>

        {/* Hero Section */}
        <div className="min-h-[35vh] md:min-h-[50vh] flex items-center justify-center relative z-20 px-4 overflow-hidden">
          <div className="text-center w-full">
            <div className="w-full flex justify-center">
              {/* Mobile: paksa 2 baris PORTO + tail jika judul diawali PORTO, selain itu tetap satu baris */}
              {heroStartsWithPorto ? (
                <div className="block sm:hidden leading-[0.9] uppercase">
                  <div className="flex flex-col items-start space-y-1">
                    <BlurTextLoop
                      text="PORTO"
                      className="text-[32vw] tracking-normal text-black font-display font-bold select-none"
                      initialDelay={0.1}
                      animateBy="letters"
                      direction="top"
                    />
                    <BlurTextLoop
                      text={heroTailUpper}
                      className="text-[32vw] tracking-normal text-black font-display font-bold select-none"
                      initialDelay={1}
                      animateBy="letters"
                      direction="top"
                    />
                  </div>
                </div>
              ) : (
                <div className="block sm:hidden">
                  <BlurTextLoop
                    text={heroTitleRaw}
                    className="text-[32vw] leading-[0.9] tracking-normal text-black font-display font-bold uppercase select-none"
                    initialDelay={0.15}
                    animateBy="letters"
                    direction="top"
                  />
                </div>
              )}
              {/* Tablet/desktop: tetap satu baris */}
              <div className="hidden sm:block">
                <BlurTextLoop
                  text={heroTitleRaw}
                  className="text-[18vw] md:text-[15vw] lg:text-[12rem] leading-[0.9] tracking-normal text-black font-display font-bold uppercase select-none"
                  initialDelay={0.15}
                  animateBy="letters"
                  direction="top"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Running Text Section */}
      <RunningTextSection />

      {/* Section 2: Deskripsi Profesional dengan 2 Grid */}
      <div
        id="professional"
        className="pb-16 pt-12 md:py-16 lg:py-20 bg-white flex items-center justify-center px-4 border-b border-gray-200"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16">

            <div className="space-y-6 md:space-y-8">
              {/* Motto Kerja */}
              <div>
                <Reveal>
                  <div className="inline-block bg-gray-100 px-6 py-3 rounded-full text-sm font-medium mb-6">
                    {currentAboutData.professional?.motto.badge}
                  </div>
                </Reveal>
                <Reveal delay={0.3}>
                  <p className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold italic text-gray-700 leading-tight">
                    {currentAboutData.professional?.motto.quote}
                  </p>
                </Reveal>
              </div>

            </div>

            {/* Grid Kanan - Deskripsi Profesional */}
            <div className="space-y-8">
              <Reveal delay={0.4}>
                <p className="text-base md:text-lg leading-relaxed text-gray-700 font-serif">
                  {currentAboutData.professional?.bio.content}
                </p>
                <div className="mt-3">
                  <AITranslator text={currentAboutData.professional?.bio.content || ''} context="Professional Bio" />
                </div>
              </Reveal>

              {/* Gallery Mini */}
              <Reveal delay={0.5}>
                <div>
                  <h4 className="text-lg font-medium text-gray-600 mb-4">Portfolio Preview</h4>
                  <GalleryMini images={galleryImages} />
                </div>
              </Reveal>
            </div>

          </div>
        </div>
      </div>

      {/* Section 3: Hard Skills dan Soft Skills dengan 2 Grid */}
      <div
        id="skills"
        className="bg-white pt-20 pb-6 md:pt-20 md:pb-8 lg:pt-24 lg:pb-12 flex items-center justify-center lg:min-h-[70vh] border-b border-gray-200"
      >
        <div className="w-full max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16 xl:gap-20">

            {/* Grid Kiri - Hard Skills (Diperkecil) */}
            <div className="lg:col-span-1 space-y-6">
              <div className="text-left">
                <Reveal>
                  <div className="inline-block bg-black px-6 py-2 rounded-full mb-6">
                    <h2 className="text-xl font-medium text-white font-serif italic">
                      Hard Skill
                    </h2>
                  </div>
                </Reveal>

                {/* Design Software Icons */}
                <div className="mb-6">
                  <Reveal delay={0.3}>
                    <div className="flex items-start mb-3">
                      <span className="w-1.5 h-1.5 bg-black rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      <div className="flex-1">
                        <strong className="text-sm">Software Desain:</strong>
                      </div>
                    </div>
                  </Reveal>
                  <div className="w-full overflow-visible">
                    {hardSkillsError && (
                      <p className="text-xs text-amber-600 mb-2">
                        Menampilkan ikon default (gagal memuat dari server).
                      </p>
                    )}
                    <Reveal delay={0.4}>
                      <DesignSkillIcons skills={resolvedHardSkills} />
                    </Reveal>
                  </div>
                </div>

                {/* Hard Skills List */}
                <StaggerContainer className="space-y-3" staggerDelay={0.1}>
                  {hardSkillConceptsError && (
                    <p className="text-xs text-amber-600">
                      Menampilkan poin default (gagal memuat konsep dari server).
                    </p>
                  )}
                  {hardSkills.map((skill, index) => (
                    <StaggerItem key={index}>
                      <div className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-black rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        <div className="flex-1">
                          <strong className="text-sm">{skill.category}:</strong>
                          <span className="ml-1 text-gray-700 text-xs">{skill.content}</span>
                        </div>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </div>
            </div>

            {/* Grid Kanan - Soft Skills (Diperbesar) */}
            <div className="md:col-span-2 lg:col-span-2 space-y-8 mt-8 md:mt-10 lg:mt-0">
              <div className="text-left">
                <div className="flex justify-start">
                  <Reveal>
                    <div className="inline-block bg-black px-6 py-2 md:px-8 md:py-3 rounded-full mb-8">
                      <h2 className="text-xl md:text-2xl font-medium text-white font-serif italic">
                        Soft Skill
                      </h2>
                    </div>
                  </Reveal>
                </div>

                {/* Soft Skills Description */}
                <div className="mb-6 flex justify-start">
                  <div className="inline-block border border-gray-300 bg-white px-5 py-3 md:px-8 md:py-4 rounded-[30px] md:rounded-[50px] max-w-[90%] md:max-w-3xl">
                    <div className="text-sm md:text-base text-gray-600 font-serif italic text-left" style={{ fontFamily: 'Merriweather, serif' }}>
                      {currentSoftSkillDescription}
                    </div>
                  </div>
                </div>

                {/* TextMorph - has its own animation, no Reveal needed */}
                <div className="w-full overflow-hidden flex justify-start">
                  <div className="origin-left transform scale-[0.85] md:scale-100 w-[115%] md:w-full">
                    <TextMorph
                      texts={softSkills.texts}
                      descriptions={softSkills.descriptions}
                      className=""
                      morphTime={1}
                      cooldownTime={0.25}
                      onDescriptionChange={setCurrentSoftSkillDescription}
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Section 4: Experience */}
      <div
        id="experience"
        className="bg-white pt-8 pb-40 md:pt-12 md:pb-44 lg:pt-14 lg:pb-48"
      >
        <div className="w-full max-w-7xl mx-auto px-4">
          <div className="text-left mb-12">
            <Reveal>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-black mb-4">Experience</h2>
            </Reveal>
            <Reveal delay={0.3}>
              <p className="text-gray-600 font-serif">Perjalanan karir dan pengalaman profesional</p>
            </Reveal>
          </div>

          {/* Experience Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

            {/* Grid Kiri - Statistics & Testimoni (No Reveal to prevent overlap) */}
            <div className="space-y-6">
              <div className="text-left">
                <div className="inline-block bg-black px-4 py-2 rounded-full mb-4">
                  <h3 className="text-lg font-medium text-white font-serif italic">
                    Freelance Experience
                  </h3>
                </div>

                {/* Horizontal Counter Animation */}
                <div className="mb-6">
                  <HorizontalCounterAnimation />
                </div>

                {/* Testimoni Horizontal */}
                <div className="mt-6">
                  <HorizontalTestimonial />
                </div>
              </div>
            </div>

            {/* Grid Kanan - Work Experience (Swaying Gallery) */}
            <div className="space-y-6 mt-14 md:mt-16 lg:mt-0">
              <div>
                <div className="text-left mb-4">
                  <Reveal>
                    <div className="inline-block bg-black px-4 py-2 rounded-full">
                      <h3 className="text-lg font-medium text-white font-serif italic">
                        Work Experience
                      </h3>
                    </div>
                  </Reveal>
                </div>

                {/* Swaying Gallery - 6 photos with swing effect */}
                <div className="space-y-3">
                  {experienceError && (
                    <p className="text-sm text-amber-600">
                      Menampilkan data pengalaman bawaan karena: {experienceErrorDetail instanceof Error ? experienceErrorDetail.message : 'data tidak tersedia'}.
                    </p>
                  )}
                  <Reveal delay={0.3}>
                    <SwayingGallery
                      images={workExperienceForGallery.map((experience, index) => ({
                        src: experience.imageUrl,
                        alt: `Work Experience ${index + 1}`,
                        title: experience.year,
                        duration: experience.duration,
                        description: `${experience.company} - ${experience.position}`,
                        // Tampilkan maksimal 3 poin jobdesk agar lebih informatif
                        jobDetails: experience.description?.slice(0, 3) ?? []
                      }))}
                      className="w-full h-auto min-h-[820px] md:min-h-0 md:h-auto"
                    />
                  </Reveal>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>



      {/* Preview Modal */}
      {isPreviewOpen && previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={closePreview}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closePreview}
              className="absolute -top-10 right-0 text-white text-2xl hover:text-gray-300 transition-colors"
            >
              ✕
            </button>
            <div className="relative w-full h-full">
              <NextImage
                src={previewImage}
                alt="Preview"
                width={800}
                height={600}
                className="object-contain max-w-full max-h-full rounded-lg"
                unoptimized
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
