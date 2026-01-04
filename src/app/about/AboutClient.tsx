'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import NextImage from 'next/image';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import GalleryMini from '@/components/gallery/GalleryMini';
import HardSkillsAccordion from '@/components/HardSkillsAccordion';
import SwayingGallery from '@/components/home/SwayingGallery';
import AnimatedCounter from '@/components/AnimatedCounter';
import HorizontalCounterAnimation from '@/components/HorizontalCounterAnimation';
import HorizontalTestimonial from '@/components/gallery/HorizontalTestimonial';
import { ExperienceData } from '@/types/experience';
import { Project } from '@/types/projects';
import { GalleryFeaturedData } from '@/types/gallery';

import { HardSkill } from '@/types/hardSkill';
import { HardSkillConcept } from '@/types/hardSkillConcept';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { useNavbarVisibility } from '@/contexts/NavbarVisibilityContext';
import { Reveal, StaggerContainer, StaggerItem } from '@/components/effects/Reveal';
import BlurTextLoop from '@/components/effects/BlurTextLoop';
import RunningTextSection from '@/components/RunningTextSection';
import AITranslator from '@/components/features/AITranslator';
import StickyImageStack, { MediaItem } from '@/components/gallery/StickyImageStack';
import { resolveCover } from '@/lib/images';

const TextMorph = dynamic(() => import('@/components/effects/TextMorph'), {
  ssr: false,
  loading: () => <div className="h-[120px] w-full bg-transparent rounded animate-pulse" /> // Match TextMorph height
});
const SimpleTrail = dynamic(() => import('@/components/effects/SimpleTrail'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 z-10" /> // Prevent CLS
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
    imageUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  },
  {
    year: 'Jan 2019 - Jan 2020',
    duration: '1 tahun 1 bulan',
    company: 'Sekolah Desain',
    position: 'Mentor Desain Grafis',
    description: [
      'Melakukan kegiatan pembelajaran/sharing session dengan mahasiswa sesuai jadwal yang ditetapkan perusahaan. Melakukan observasi, monitoring, memberikan masukan dan saran perbaikan terkait kinerja peserta dan memastikan paham tentang desain grafis.'
    ],
    imageUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
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
    imageUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
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
    imageUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
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
    imageUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
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
    imageUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
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
    softSkills?: {
      texts: string[];
      descriptions: string[];
    };
    labels?: {
      experienceTitle?: string;
      experienceSubtitle?: string;
      freelanceTitle?: string;
      workExperienceTitle?: string;
      portfolioPreviewTitle?: string;
    };
  };
  initialProjects?: Project[];
  lastUpdated?: Date | null;
}

// Component for scroll-based section transitions
// Component for scroll-based section transitions
const SectionWrapper = ({ children, id, className = "", style = {} }: { children: React.ReactNode, id: string, className?: string, style?: any }) => {
  return (
    <div
      id={id}
      style={{ ...style }}
      className={className}
    >
      {children}
    </div>
  );
};


export default function AboutClient({ initialData, initialProjects = [], lastUpdated }: AboutClientProps) {
  const [isClient, setIsClient] = useState(false);
  // Removed duplicate currentAboutData declaration here
  const [currentSoftSkillDescription, setCurrentSoftSkillDescription] = useState(
    initialData?.softSkills?.descriptions?.[0] || softSkills.descriptions[0]
  );
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const { scrollToSection } = useSmoothScroll();

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);
    const sections = ['hero', 'professional', 'skills', 'experience'];
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const { scrollYProgress } = useScroll();

  const scaleSpring = useSpring(scrollYProgress, {
    damping: 20
  });


  // Hero parallax
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -100]);

  // Sticky Stack Parallax & Opacity Effect
  const stackSectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: stackScrollProgress } = useScroll({
    target: stackSectionRef,
    offset: ['start start', 'end end']
  });

  // Cinematic "Reading" Effect: Text lights up as you scroll
  const headerOpacity = useTransform(stackScrollProgress, [0, 0.2], [1, 0.4]); // Dims slightly as you focus on content
  const p1Opacity = useTransform(stackScrollProgress, [0.1, 0.3], [0.2, 1]); // Lights up
  const p2Opacity = useTransform(stackScrollProgress, [0.4, 0.6], [0.2, 1]); // Lights up later


  // Fallback data jika initialData tidak ada
  const fallbackData = {
    hero: {
      title: 'ABOUT ME',
      title_id: 'TENTANG SAYA',
      backgroundTrail: []

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
        galleryImages: [] // No fallback images - only show project data
      }
    },
    softSkills: {
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
    },
    labels: {
      experienceTitle: "Experience",
      experienceSubtitle: "Perjalanan karir dan pengalaman profesional",
      freelanceTitle: "Freelance Experience",
      workExperienceTitle: "Work Experience",
      portfolioPreviewTitle: "Portfolio Preview"
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
    setCurrentSoftSkillDescription(
      currentAboutData.softSkills?.descriptions?.[0] || softSkills.descriptions[0]
    );
    setIsClient(true);
  }, [currentAboutData]);

  // Animasi hero mobile diatur lewat BlurTextLoop dengan delay berbeda per baris

  const hardSkillsList = resolvedConcepts
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((concept) => ({
      category: concept.title,
      category_id: concept.title_id,
      content: concept.description || '',
      content_id: concept.description_id || '',
    }));

  // Fetch projects for dynamic gallery from API
  const { data: projectsData } = useQuery<{ projects: Project[] }>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      if (!response.ok) return { projects: [] };
      return response.json();
    },
    initialData: { projects: initialProjects },
    staleTime: 5 * 60 * 1000
  });

  const { data: galleryFeatured } = useQuery<GalleryFeaturedData>({
    queryKey: ['gallery', 'featured'],
    queryFn: async () => {
      const res = await fetch('/api/gallery/featured');
      if (!res.ok) return { featuredProjectIds: [], lastUpdated: '' };
      return res.json();
    }
  });

  const stackItems = useMemo(() => {
    const allProjects = projectsData?.projects || [];
    const featuredIds = galleryFeatured?.featuredProjectIds || [];

    let projectsToShow: Project[] = [];

    if (featuredIds.length > 0) {
      const featured = featuredIds
        .map(id => allProjects.find(p => p.id === id))
        .filter(Boolean) as Project[];

      if (featured.length > 0) {
        projectsToShow = featured;
      }
    }

    if (projectsToShow.length === 0) {
      projectsToShow = allProjects
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);
    }

    // MAP WITH OPTIMIZATION
    return projectsToShow.map(p => {
      const galleryItem = resolveCover(p);
      return {
        id: p.id,
        type: (galleryItem.kind === 'video' ? 'video' : 'image') as 'video' | 'image', // Explicit cast
        src: galleryItem.src,
        poster: galleryItem.poster, // Added poster
        alt: p.title,
        project: p
      };
    });
  }, [galleryFeatured, projectsData]);


  // Create dynamic gallery items from recent projects
  const galleryImages = (projectsData?.projects || [])
    .filter(p => p.cover)
    .slice(0, 8)
    .map(p => {
      const galleryItem = resolveCover(p);
      return {
        src: galleryItem.src,
        isActive: true,
        slug: p.slug
      };
    });

  // Fallback to empty array if no projects loaded yet (no old static images)
  const finalGalleryImages = galleryImages;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
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
                  } `}
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

      {/* Scroll Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-black origin-left z-[100] mix-blend-difference"
        style={{ scaleX: scrollYProgress }}
      />


      {/* Section 1: ABOUT ME dengan Trail Effect */}
      <div id="hero" className="relative min-h-screen bg-[#0a0a0a]">

        <motion.div style={{ opacity: heroOpacity, scale: heroScale, y: heroY }} className="h-full">

          {/* Trail Effect - hanya di section 1 */}
          <div className="absolute inset-0 z-10">
            {isClient ? (
              <SimpleTrail backgroundTrail={currentAboutData.hero?.backgroundTrail} />
            ) : (
              <div className="absolute inset-0 z-10" />
            )}
          </div>

          {/* Hero Section */}
          <div className="min-h-screen flex items-center justify-center relative z-20 px-4 overflow-hidden pb-12 md:pb-24">
            <div className="text-center w-full h-full flex flex-col justify-center items-center -mt-16 md:-mt-32">

              {/* Mobile: paksa 2 baris PORTO + tail jika judul diawali PORTO, selain itu tetap satu baris */}
              {/* Mobile: paksa 2 baris PORTO + tail jika judul diawali PORTO, selain itu tetap satu baris */}
              {heroStartsWithPorto ? (
                <div className="block sm:hidden leading-[0.9] uppercase min-h-[64vw]">
                  <div className="flex flex-col items-start space-y-1">
                    <BlurTextLoop
                      text="PORTO"
                      className="text-[64vw] tracking-normal text-white font-display font-bold select-none h-[60vw]"
                      initialDelay={0.2}
                      animateBy="letters"
                      direction="bottom"
                    />
                    <BlurTextLoop
                      text={heroTailUpper}
                      className="text-[64vw] tracking-normal text-white font-display font-bold select-none h-[60vw]"
                      initialDelay={0.2}
                      animateBy="letters"
                      direction="bottom"
                    />
                  </div>
                </div>
              ) : (
                <div className="block sm:hidden min-h-[32vw]">
                  <BlurTextLoop
                    text={heroTitleRaw}
                    className="text-[64vw] leading-[0.9] tracking-normal text-white font-display font-bold uppercase select-none"
                    initialDelay={0.15}
                    animateBy="letters"
                    direction="bottom"
                  />
                </div>
              )}
              {/* Tablet/desktop: tetap satu baris */}
              <div className="hidden sm:block min-h-[15vw]">
                <BlurTextLoop
                  text={heroTitleRaw}
                  className="text-[36vw] md:text-[32vw] lg:text-[31vw] leading-[0.9] tracking-normal text-white font-display font-bold uppercase select-none"
                  initialDelay={0.15}
                  animateBy="letters"
                  direction="bottom"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>


      {/* Running Text Section */}
      <RunningTextSection />

      <SectionWrapper
        id="hidden-professional"
        className="hidden pb-16 pt-12 md:py-16 lg:py-20 flex items-center justify-center px-4 bg-white border-b border-gray-200"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16">

            <div className="space-y-6 md:space-y-8">
              {/* Motto Kerja */}
              <div>
                <Reveal>
                  <motion.div
                    className="inline-block bg-black text-white px-6 py-3 rounded-full text-sm font-medium mb-6"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    {currentAboutData.professional?.motto.badge}
                  </motion.div>
                </Reveal>
                <Reveal delay={0.3}>
                  <p className="text-3xl md:text-4xl lg:text-5xl font-sans font-bold italic text-gray-800 leading-tight">
                    {currentAboutData.professional?.motto.quote}
                  </p>
                </Reveal>
              </div>

              {/* Bio & Translator - Moved Here */}
              <Reveal delay={0.4}>
                <p className="text-sm leading-relaxed text-gray-700 font-sans">
                  {currentAboutData.professional?.bio.content}
                </p>
                <div className="mt-3">
                  <AITranslator text={currentAboutData.professional?.bio.content || ''} context="Professional Bio" />
                </div>
              </Reveal>
            </div>

            {/* Grid Kanan - Gallery Mini with Parallax */}
            {/* Grid Kanan - Gallery Mini with Parallax */}
            <div className="space-y-8 flex items-center justify-center overflow-hidden">
              {/* Gallery Mini */}
              <Reveal delay={0.5} className="w-full">
                <motion.div
                  className="w-full"
                  initial={{ x: 100, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  <h4 className="text-lg font-medium text-gray-600 mb-4">{currentAboutData.labels?.portfolioPreviewTitle || 'Portfolio Preview'}</h4>
                  <div className="relative group">
                    <GalleryMini images={finalGalleryImages} className="w-full max-w-none md:max-w-none" />
                  </div>
                </motion.div>
              </Reveal>
            </div>

          </div>
        </div>
      </SectionWrapper>

      {/* Sticky Gallery Stack Section with Side Text */}
      <div id="professional" ref={stackSectionRef} className="relative z-20 bg-[#0a0a0a] border-b border-gray-800">
        <div className="max-w-[1920px] mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-12">

            {/* Left Column: Sticky Text Info */}
            <div className="block xl:col-span-4 relative z-10 px-4 pt-12 pb-0 xl:p-0">
              <div
                className="relative xl:sticky xl:top-0 xl:h-screen flex flex-col justify-start xl:justify-center xl:px-10 2xl:px-16 text-white"
              >
                <Reveal>
                  <motion.div
                    className="w-16 h-1 bg-white mb-8"
                    initial={{ width: 0 }}
                    whileInView={{ width: 64 }}
                    transition={{ duration: 0.8 }}
                  />
                  <motion.h3
                    style={{ opacity: headerOpacity }}
                    className="text-3xl xl:text-4xl font-sans font-bold leading-tight mb-8 text-white xl:opacity-[var(--header-opacity)] opacity-100"
                  >
                    {currentAboutData.professional?.motto.quote}
                  </motion.h3>

                  <div className="space-y-6 text-white text-sm leading-relaxed tracking-wide">
                    <motion.p style={{ opacity: p1Opacity }} className="text-white xl:opacity-[var(--p1-opacity)] opacity-100">
                      {currentAboutData.professional?.bio.content}
                    </motion.p>
                  </div>

                  <div className="mt-8">
                    <AITranslator
                      text={currentAboutData.professional?.bio.content || ''}
                      context="Gallery Sidebar"
                    />
                  </div>
                </Reveal>
              </div>
            </div>

            {/* Right Column: The Gallery Stack */}
            <div className="xl:col-span-8 relative min-h-[50vh] xl:min-h-screen">
              <StickyImageStack items={stackItems} />
            </div>

          </div>
        </div>
      </div>

      <SectionWrapper
        id="skills"
        className="pt-12 pb-6 md:pt-16 md:pb-8 lg:pt-20 lg:pb-12 flex items-center justify-center lg:min-h-[60vh] bg-white border-b border-gray-200"
      >
        <div className="w-full max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 xl:gap-20 items-start">

            {/* Grid Kiri - Hard Skills */}
            <div className="space-y-6">
              <motion.div
                className="text-left w-full flex flex-col items-center md:items-start"
                initial={{ x: -100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <Reveal overflowVisible={true}>
                  <div className="inline-block bg-black px-6 py-2 rounded-full mb-6">
                    <h2 className="text-lg font-medium text-white font-sans italic">
                      Hard Skill
                    </h2>
                  </div>
                </Reveal>

                {/* Hard Skills Accordion - New Design */}
                <div className="w-full">
                  <Reveal delay={0.3}>
                    <HardSkillsAccordion />
                  </Reveal>
                </div>
              </motion.div>
            </div>

            {/* Grid Kanan - Soft Skills (Standard Width) */}
            <div className="space-y-8 mt-8 md:mt-10 lg:mt-0">
              <motion.div
                className="text-left w-full flex flex-col items-center md:items-start"
                initial={{ x: 100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <div className="flex justify-start w-full max-w-md">
                  <Reveal overflowVisible={true}>
                    <div className="inline-block bg-black px-6 py-2 rounded-full mb-8">
                      <h2 className="text-lg font-medium text-white font-sans italic">
                        Soft Skill
                      </h2>
                    </div>
                  </Reveal>
                </div>

                {/* Soft Skills Description */}
                <div className="mb-6 flex justify-start">
                  <motion.div
                    className="inline-block border border-gray-300 bg-white px-5 py-3 md:px-8 md:py-4 rounded-[30px] md:rounded-[50px] shadow-sm hover:shadow-md transition-shadow max-w-[90%] md:max-w-3xl"
                    whileHover={{ y: -5 }}
                  >
                    <div className="text-sm md:text-base text-gray-600 font-sans italic text-left">
                      {currentSoftSkillDescription}
                    </div>
                  </motion.div>
                </div>

                {/* TextMorph - has its own animation, no Reveal needed */}
                <div className="w-full overflow-hidden flex justify-start">
                  <div className="origin-left transform scale-[0.85] md:scale-100 w-[115%] md:w-full">
                    <TextMorph
                      texts={currentAboutData.softSkills?.texts || softSkills.texts}
                      descriptions={currentAboutData.softSkills?.descriptions || softSkills.descriptions}
                      className=""
                      morphTime={1}
                      cooldownTime={0.25}
                      onDescriptionChange={setCurrentSoftSkillDescription}
                    />
                  </div>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </SectionWrapper>


      <SectionWrapper
        id="experience"
        className="pt-8 pb-20 md:pt-12 md:pb-32 lg:pt-14 lg:pb-40 bg-white"
      >
        <div className="w-full max-w-7xl mx-auto px-4">
          <div className="text-left mb-12">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <Reveal>
                <h2 className="text-3xl md:text-4xl font-sans font-bold text-black mb-4">{currentAboutData.labels?.experienceTitle || 'Experience'}</h2>
              </Reveal>
              <Reveal delay={0.3}>
                <p className="text-sm md:text-base text-gray-600 font-sans">{currentAboutData.labels?.experienceSubtitle || 'Perjalanan karir dan pengalaman profesional'}</p>
              </Reveal>
            </motion.div>
          </div>

          {/* Experience Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

            {/* Grid Kiri - Statistics & Testimoni (No Reveal to prevent overlap) */}
            <div className="space-y-6">
              <div className="text-left">
                <div className="inline-block bg-black px-4 py-2 rounded-full mb-4">
                  <h3 className="text-lg font-medium text-white font-sans italic">
                    {currentAboutData.labels?.freelanceTitle || 'Freelance Experience'}
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
                      <h3 className="text-lg font-medium text-white font-sans italic">
                        {currentAboutData.labels?.workExperienceTitle || 'Work Experience'}
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
      </SectionWrapper>





      {/* Preview Modal */}
      {
        isPreviewOpen && previewImage && (
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
        )
      }
    </div >
  );
}
