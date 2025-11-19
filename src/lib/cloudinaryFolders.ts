/**
 * Cloudinary Folder Management - OPTIMAL STRUCTURE
 * 
 * Struktur folder optimal berdasarkan analisis lengkap frontend dan backend:
 * - home: HomePageEditor - Hero, featured projects, testimonials, stats, backgrounds
 * - about: AboutEditor - Trail images, gallery, profile, skills, backgrounds
 * - projects: ProjectsEditor - Covers, gallery, details, videos, thumbnails
 * - contact: Contact page - Icons, backgrounds
 * - explore: Explore page - Thumbnails, filters, backgrounds
 * - ui: UI elements - Navigation, footer, buttons, icons, logos
 * - seo: SEO assets - OG images, favicons, meta
 * - effects: EffectsEditor - Animations, transitions, particles, overlays
 * - shared: Shared assets - Placeholders, defaults, patterns, textures
 */

export type PageType = 'home' | 'about' | 'projects' | 'contact' | 'explore' | 'ui' | 'seo' | 'effects' | 'shared'

export type HomeSubfolder = 'hero' | 'featured' | 'stats' | 'testimonials' | 'backgrounds'
export type AboutSubfolder = 'trail' | 'gallery' | 'profile' | 'skills' | 'backgrounds'
export type ProjectsSubfolder = 'covers' | 'gallery' | 'details' | 'videos' | 'thumbnails'
export type ContactSubfolder = 'icons' | 'backgrounds'
export type ExploreSubfolder = 'thumbnails' | 'filters' | 'backgrounds'
export type UISubfolder = 'navigation' | 'footer' | 'buttons' | 'icons' | 'logos'
export type SEOSubfolder = 'og-images' | 'favicons' | 'meta'
export type EffectsSubfolder = 'animations' | 'transitions' | 'particles' | 'overlays'
export type SharedSubfolder = 'placeholders' | 'defaults' | 'patterns' | 'textures'

export type Subfolder = HomeSubfolder | AboutSubfolder | ProjectsSubfolder | ContactSubfolder | ExploreSubfolder | UISubfolder | SEOSubfolder | EffectsSubfolder | SharedSubfolder

/**
 * Mapping folder berdasarkan tipe halaman
 */
export const FOLDER_MAPPING: Record<PageType, string> = {
  home: 'portfolio/home',
  about: 'portfolio/about',
  projects: 'portfolio/projects',
  contact: 'portfolio/contact',
  explore: 'portfolio/explore',
  ui: 'portfolio/ui',
  seo: 'portfolio/seo',
  effects: 'portfolio/effects',
  shared: 'portfolio/shared'
}

/**
 * Mapping subfolder berdasarkan tipe halaman
 */
export const SUBFOLDER_MAPPING: Record<PageType, Subfolder[]> = {
  home: ['hero', 'featured', 'stats', 'testimonials', 'backgrounds'],
  about: ['trail', 'gallery', 'profile', 'skills', 'backgrounds'],
  projects: ['covers', 'gallery', 'details', 'videos', 'thumbnails'],
  contact: ['icons', 'backgrounds'],
  explore: ['thumbnails', 'filters', 'backgrounds'],
  ui: ['navigation', 'footer', 'buttons', 'icons', 'logos'],
  seo: ['og-images', 'favicons', 'meta'],
  effects: ['animations', 'transitions', 'particles', 'overlays'],
  shared: ['placeholders', 'defaults', 'patterns', 'textures']
}

/**
 * Mendapatkan path folder lengkap
 */
export function getCloudinaryPath(pageType: PageType, subfolder: Subfolder): string {
  const baseFolder = FOLDER_MAPPING[pageType]
  return `${baseFolder}/${subfolder}`
}

/**
 * Validasi apakah subfolder valid untuk pageType tertentu
 */
export function isValidSubfolder(pageType: PageType, subfolder: string): subfolder is Subfolder {
  return SUBFOLDER_MAPPING[pageType].includes(subfolder as Subfolder)
}

/**
 * Mendapatkan subfolder default berdasarkan pageType
 */
export function getDefaultSubfolder(pageType: PageType): Subfolder {
  const defaultSubfolders: Record<PageType, Subfolder> = {
    home: 'hero',
    about: 'trail',
    projects: 'covers',
    contact: 'icons',
    explore: 'thumbnails',
    ui: 'icons',
    seo: 'og-images',
    effects: 'animations',
    shared: 'defaults'
  }
  return defaultSubfolders[pageType]
}

/**
 * Mendapatkan semua folder yang akan di-scan untuk gallery
 */
export function getGalleryScanFolders(): string[] {
  return [
    'portfolio/home/hero',
    'portfolio/home/featured',
    'portfolio/about/trail',
    'portfolio/about/gallery',
    'portfolio/projects/covers',
    'portfolio/projects/gallery',
    'portfolio/projects/details',
    'portfolio/ui/icons',
    'portfolio/effects/animations',
    'portfolio/shared/defaults'
  ]
}

/**
 * Mendapatkan informasi folder untuk upload
 */
export function getUploadInfo(pageType: PageType, subfolder?: Subfolder) {
  const finalSubfolder = subfolder || getDefaultSubfolder(pageType)
  
  if (!isValidSubfolder(pageType, finalSubfolder)) {
    throw new Error(`Invalid subfolder '${finalSubfolder}' for page type '${pageType}'`)
  }
  
  return {
    folder: FOLDER_MAPPING[pageType],
    subfolder: finalSubfolder,
    fullPath: getCloudinaryPath(pageType, finalSubfolder)
  }
}
