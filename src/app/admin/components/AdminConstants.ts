import {
  FolderKanban,
  Info,
  BriefcaseBusiness,
  PhoneCall,
  Quote,
  Users,
  Send,
  Monitor,
  Layout,
  Smile,
  Sparkles,
  Type,
  User,
  Tag,
  Music,
  Image as ImageIcon,
  Archive,
  Brain,
  type LucideIcon
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: '/admin/projects-group',
    label: 'Project (Karya)',
    icon: FolderKanban,
    color: 'text-purple-600',
    bg: 'hover:bg-purple-50',
    children: [
      { href: '/admin/projects', label: 'List Project', icon: FolderKanban, color: 'text-purple-600', bg: 'hover:bg-purple-50' },
      { href: '/admin/explorer', label: 'Explorer Manager', icon: Archive, color: 'text-indigo-600', bg: 'hover:bg-indigo-50' }
    ]
  },
  {
    href: '/admin/about-group',
    label: 'Tentang (About)',
    icon: Info,
    color: 'text-blue-600',
    bg: 'hover:bg-blue-50',
    children: [
      { href: '/admin/about?tab=professional', label: 'Info Utama', icon: User, color: 'text-emerald-600', bg: 'hover:bg-emerald-50' },
      { href: '/admin/experience', label: 'Pengalaman', icon: BriefcaseBusiness, color: 'text-emerald-600', bg: 'hover:bg-emerald-50' },
      { href: '/admin/testimonial', label: 'WhatsApp Notif', icon: Quote, color: 'text-pink-600', bg: 'hover:bg-pink-50' },
      { href: '/admin/about?tab=archive', label: 'Archive', icon: Archive, color: 'text-indigo-600', bg: 'hover:bg-indigo-50' },
      { href: '/admin/about?tab=softSkills', label: 'Skillset (Soft)', icon: Brain, color: 'text-amber-600', bg: 'hover:bg-amber-50' },
      { href: '/admin/about?tab=hardSkills', label: 'Skillset (Hard)', icon: Brain, color: 'text-violet-600', bg: 'hover:bg-violet-50' },
      { href: '/admin/about?tab=philosophy', label: 'Design Thinking', icon: Sparkles, color: 'text-orange-600', bg: 'hover:bg-orange-50' },
      {
        href: '/admin/os-config',
        label: 'Pengaturan OS',
        icon: Monitor,
        color: 'text-cyan-600',
        bg: 'hover:bg-cyan-50',
        children: [
          { href: '/admin/about?tab=wallpaper', label: 'Wallpaper & Tema', icon: ImageIcon, color: 'text-cyan-600', bg: 'hover:bg-cyan-50' },
          { href: '/admin/about?tab=desktop', label: 'Ikon Desktop', icon: Monitor, color: 'text-blue-600', bg: 'hover:bg-blue-50' },
          { href: '/admin/about?tab=runningText', label: 'Teks Berjalan', icon: Type, color: 'text-pink-600', bg: 'hover:bg-pink-50' },
          { href: '/admin/about?tab=dock', label: 'Sistem Dock', icon: Layout, color: 'text-indigo-600', bg: 'hover:bg-indigo-50' },
          { href: '/admin/about?tab=stickyNotes', label: 'Catatan Tempel', icon: Smile, color: 'text-yellow-600', bg: 'hover:bg-yellow-50' },
          { href: '/admin/about?tab=sounds', label: 'Efek Suara', icon: Music, color: 'text-amber-600', bg: 'hover:bg-amber-50' },
        ]
      },
      { href: '/admin/about?tab=labels', label: 'Labels & Tag', icon: Tag, color: 'text-gray-600', bg: 'hover:bg-gray-50' },
    ]
  },
  {
    href: '/admin/contact-group',
    label: 'Kontak (Contact)',
    icon: PhoneCall,
    color: 'text-amber-600',
    bg: 'hover:bg-amber-50',
    children: [
      { href: '/admin/contact', label: 'Pengaturan Kontak', icon: PhoneCall, color: 'text-amber-600', bg: 'hover:bg-amber-50' },
      { href: '/admin/leads', label: 'Pesan Masuk', icon: Users, color: 'text-indigo-600', bg: 'hover:bg-indigo-50' },
      { href: '/admin/telegram', label: 'Bot Telegram', icon: Send, color: 'text-sky-500', bg: 'hover:bg-sky-50' },
    ]
  }
];
