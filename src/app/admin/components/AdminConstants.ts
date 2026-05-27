import {
  FolderKanban,
  Info,
  BriefcaseBusiness,
  PhoneCall,
  Quote,
  Users,
  MessageSquareText,
  Monitor,
  Layout,
  Type,
  User,
  Tag,
  Music,
  Image as ImageIcon,
  Archive,
  Brain,
  type LucideIcon,
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
      {
        href: '/admin/projects',
        label: 'List Project',
        icon: FolderKanban,
        color: 'text-purple-600',
        bg: 'hover:bg-purple-50',
      },
      {
        href: '/admin/projects/explorer',
        label: 'Explorer Manager',
        icon: Archive,
        color: 'text-indigo-600',
        bg: 'hover:bg-indigo-50',
      },
    ],
  },
  {
    href: '/admin/about-group',
    label: 'Tentang (About)',
    icon: Info,
    color: 'text-blue-600',
    bg: 'hover:bg-blue-50',
    children: [
      {
        href: '/admin/content/profile',
        label: 'Info Utama',
        icon: User,
        color: 'text-emerald-600',
        bg: 'hover:bg-emerald-50',
      },
      {
        href: '/admin/content/experience',
        label: 'Pengalaman',
        icon: BriefcaseBusiness,
        color: 'text-emerald-600',
        bg: 'hover:bg-emerald-50',
      },
      {
        href: '/admin/communications/notifications',
        label: 'WhatsApp Notif',
        icon: Quote,
        color: 'text-pink-600',
        bg: 'hover:bg-pink-50',
      },
      {
        href: '/admin/content/archive',
        label: 'Archive',
        icon: Archive,
        color: 'text-indigo-600',
        bg: 'hover:bg-indigo-50',
      },
      {
        href: '/admin/content/skills',
        label: 'Skillset Diri',
        icon: Brain,
        color: 'text-violet-600',
        bg: 'hover:bg-violet-50',
      },
      {
        href: '/admin/os-config',
        label: 'Pengaturan OS',
        icon: Monitor,
        color: 'text-cyan-600',
        bg: 'hover:bg-cyan-50',
        children: [
          {
            href: '/admin/system/appearance',
            label: 'Wallpaper & Tema',
            icon: ImageIcon,
            color: 'text-cyan-600',
            bg: 'hover:bg-cyan-50',
          },
          {
            href: '/admin/system/widgets',
            label: 'Catatan & Widget',
            icon: Type,
            color: 'text-pink-600',
            bg: 'hover:bg-pink-50',
          },
          {
            href: '/admin/system/dock',
            label: 'Sistem Dock',
            icon: Layout,
            color: 'text-indigo-600',
            bg: 'hover:bg-indigo-50',
          },
          {
            href: '/admin/system/sounds',
            label: 'Efek Suara',
            icon: Music,
            color: 'text-amber-600',
            bg: 'hover:bg-amber-50',
          },
        ],
      },
      {
        href: '/admin/content/labels',
        label: 'Labels & Tag',
        icon: Tag,
        color: 'text-gray-600',
        bg: 'hover:bg-gray-50',
      },
    ],
  },
  {
    href: '/admin/contact-group',
    label: 'Kontak (Contact)',
    icon: PhoneCall,
    color: 'text-amber-600',
    bg: 'hover:bg-amber-50',
    children: [
      {
        href: '/admin/communications/contacts',
        label: 'Pengaturan Kontak',
        icon: PhoneCall,
        color: 'text-amber-600',
        bg: 'hover:bg-amber-50',
      },
      {
        href: '/admin/communications/messages',
        label: 'Pesan Masuk',
        icon: Users,
        color: 'text-indigo-600',
        bg: 'hover:bg-indigo-50',
      },
      {
        href: '/admin/communications/feedback',
        label: 'Feedback Visitor',
        icon: MessageSquareText,
        color: 'text-emerald-600',
        bg: 'hover:bg-emerald-50',
      },
    ],
  },
];

