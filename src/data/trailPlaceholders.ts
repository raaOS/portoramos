export interface TrailPlaceholder {
  src: string;
  alt: string;
  title: string;
  aspectRatio?: number;
}

export const TRAIL_PLACEHOLDER_IMAGES: TrailPlaceholder[] = [
  {
    src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80&sat=-15',
    alt: 'Jejak pegunungan saat golden hour',
    title: 'Golden Mountain Trail',
    aspectRatio: 1.3
  },
  {
    src: 'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?auto=format&fit=crop&w=800&q=80&sat=-15',
    alt: 'Jalan setapak di hutan pinus',
    title: 'Pine Forest Walk',
    aspectRatio: 1.0
  },
  {
    src: 'https://images.unsplash.com/photo-1499084732479-de2c02d45fc4?auto=format&fit=crop&w=800&q=80&sat=-15',
    alt: 'Jembatan kayu menuju pegunungan',
    title: 'Wooden Bridge Path',
    aspectRatio: 1.25
  },
  {
    src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80&sat=-15',
    alt: 'Trek hutan berkabut',
    title: 'Misty Forest Trek',
    aspectRatio: 1.0
  },
  {
    src: 'https://images.unsplash.com/photo-1476611338391-6f395a0ebc71?auto=format&fit=crop&w=800&q=80&sat=-15',
    alt: 'Lembah sungai hijau',
    title: 'River Valley Route',
    aspectRatio: 1.25
  },
  {
    src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80&sat=-15',
    alt: 'Tanah lapang dengan bukit',
    title: 'Open Field Trail',
    aspectRatio: 1.0
  }
];

export const TRAIL_SRC_LIST = TRAIL_PLACEHOLDER_IMAGES.map((item) => item.src);
