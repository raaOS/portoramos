'use client';

import { useState, ReactNode, useEffect, Suspense } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Info,
  BriefcaseBusiness,
  PhoneCall,
  Quote,
  Eye,
  LogOut,
  Users,
  Send,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Monitor,
  Layout,
  Smile,
  Zap,
  Dumbbell,
  Sparkles,
  Type,
  User,
  Tag,
  Music,
  Image as ImageIcon,
  Archive
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: ReactNode;
  titleIcon?: ReactNode;
  titleAccent?: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType<any>;
  color: string;
  bg: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    href: '/admin/projects-group',
    label: 'Project (Karya)',
    icon: FolderKanban,
    color: 'text-purple-600',
    bg: 'hover:bg-purple-50',
    children: [
      { href: '/admin/projects', label: 'List Project', icon: FolderKanban, color: 'text-purple-600', bg: 'hover:bg-purple-50' },
      { href: '/admin/sequences', label: 'Bidikan Image', icon: Zap, color: 'text-yellow-500', bg: 'hover:bg-yellow-50' },
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
      { href: '/admin/about?tab=softSkills', label: 'Soft Skills', icon: Smile, color: 'text-amber-600', bg: 'hover:bg-amber-50' },
      { href: '/admin/about?tab=hardSkills', label: 'Hard Skills', icon: Dumbbell, color: 'text-violet-600', bg: 'hover:bg-violet-50' },
      { href: '/admin/about?tab=philosophy', label: 'Filosofi', icon: Sparkles, color: 'text-orange-600', bg: 'hover:bg-orange-50' },
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

function AdminLayoutContent({
  children,
  title,
  subtitle: _subtitle,
  breadcrumbs: _breadcrumbs = [],
  actions,
  titleIcon,
  titleAccent = 'bg-blue-50 text-blue-700'
}: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /* 
     We initialize based on the current pathname if possible to avoid unnecessary effects.
     However, pathname might be null initially in some environments.
  */
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(() => {
    return {
      '/admin/projects-group': false,
      '/admin/about-group': true, // Default to About expanded
      '/admin/contact-group': false
    };
  });

  // Sync expanded state with active path
  useEffect(() => {
    const isProject = pathname?.startsWith('/admin/projects') || pathname?.startsWith('/admin/sequences');
    const isAbout = pathname?.startsWith('/admin/about') || pathname?.startsWith('/admin/experience') || pathname?.startsWith('/admin/testimonial');
    const isContact = pathname?.startsWith('/admin/contact') || pathname?.startsWith('/admin/leads') || pathname?.startsWith('/admin/telegram');
    const isOSConfig = pathname?.startsWith('/admin/about') && ['desktop', 'dock', 'stickyNotes', 'sounds', 'runningText'].includes(searchParams.get('tab') || '');

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpandedMenus(prev => {
      // Only update if something actually needs to expand (don't auto-collapse others)
      const nextProjects = isProject || prev['/admin/projects-group'];
      const nextAbout = isAbout || prev['/admin/about-group'];
      const nextContact = isContact || prev['/admin/contact-group'];
      const nextOS = isOSConfig || prev['/admin/os-config'];

      if (
        nextProjects !== prev['/admin/projects-group'] ||
        nextAbout !== prev['/admin/about-group'] ||
        nextContact !== prev['/admin/contact-group'] ||
        nextOS !== prev['/admin/os-config']
      ) {
        return {
          ...prev,
          '/admin/projects-group': nextProjects,
          '/admin/about-group': nextAbout,
          '/admin/contact-group': nextContact,
          '/admin/os-config': nextOS
        };
      }
      return prev;
    });
  }, [pathname, searchParams]);

  const toggleMenu = (href: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [href]: !prev[href]
    }));
  };

  const { logout } = useAdminAuth();

  const handleLogout = async () => {
    await logout();
  };

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';

    // Support query params checking for tabs
    if (href.includes('?')) {
      const [path, query] = href.split('?');
      const tab = query.split('=')[1];
      return pathname === path && searchParams.get('tab') === tab;
    }

    return pathname?.startsWith(href);
  };

  // Icon wrapper component to avoid type issues with Lucide icons
   
  const NavIcon = ({ icon: IconComponent, className }: { icon: any; className?: string }) => {
    return <IconComponent className={className || ''} aria-hidden="true" />;
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const active = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus[item.href];

    return (
      <div key={item.href} className="mb-0.5">
        <div
          className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${active && !hasChildren ? 'bg-blue-50 text-blue-700 shadow-sm' : `text-gray-600 ${item.bg} hover:text-gray-900`
            }`}
          style={{ paddingLeft: `${12 + (depth * 12)}px` }}
          onClick={() => {
            const isVirtualGroup = item.href.endsWith('-group') || item.href === '/admin/os-config';
            if (!isVirtualGroup) {
              router.push(item.href);
            }
            if (hasChildren) toggleMenu(item.href);
            setIsMobileMenuOpen(false);
          }}
        >
          <div className="flex items-center gap-3">
            <NavIcon 
              icon={item.icon} 
              className={`h-4.5 w-4.5 ${active ? item.color : 'text-gray-400 group-hover:text-gray-600'}`} 
            />
            <span>{item.label}</span>
          </div>
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMenu(item.href);
              }}
              className="p-1 flex items-center justify-center hover:bg-black/5 rounded-md transition-colors"
            >
              {isExpanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
            </button>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-0.5 space-y-0.5">
            {item.children!.map(child => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4">
        <span className="font-bold text-lg">Admin Panel</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-200 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="h-16 flex items-center px-6 border-b border-gray-200">
            <LayoutDashboard className="h-6 w-6 text-gray-800 mr-2" />
            <span className="font-bold text-xl text-gray-900 truncate">
              Ramos Admin
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            {navItems.map(item => renderNavItem(item))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200 space-y-1">
            <button
              onClick={() => router.push('/')}
              className="w-full flex items-center justify-start gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <Eye className="h-4 w-4" />
              View Site
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-start gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen pt-16 md:pt-0 bg-gray-50 flex flex-col">
        {/* Simple Page Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              {titleIcon && (
                <div className={`p-2 rounded-lg ${titleAccent} bg-opacity-10`}>
                  {titleIcon}
                </div>
              )}
              <h1 className="text-xl font-bold text-gray-900 leading-tight">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
              {actions && <div className="flex items-center gap-3">{actions}</div>}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function AdminLayout(props: AdminLayoutProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-500">Loading admin...</div>}>
      <AdminLayoutContent {...props} />
    </Suspense>
  );
}
