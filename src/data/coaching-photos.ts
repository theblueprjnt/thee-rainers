// Coaching photo gallery — /src/pages/command.astro reads this list.
// Drop photos in /public/assets/coaching/ then add filenames below.
// Format: { src: '/assets/coaching/filename.jpg', alt: 'brief description' }
// Leave the array empty and the gallery renders nothing (graceful empty state).

export interface CoachingPhoto {
  src: string;
  webp?: string;
  alt: string;
}

// Seeded with existing repo photos so the gallery is not empty on launch.
// Replace or extend when Rainers drops dedicated coaching session photos.
export const coachingPhotos: CoachingPhoto[] = [
  {
    src: '/images/rainers-coaching-opt.jpg',
    webp: '/images/rainers-coaching-opt.webp',
    alt: 'Rainers coaching a fighter on movement',
  },
  {
    src: '/images/padwork-outdoor-opt.jpg',
    webp: '/images/padwork-outdoor-opt.webp',
    alt: 'Pad work session outdoors',
  },
  {
    src: '/images/corner-coach-opt.jpg',
    webp: '/images/corner-coach-opt.webp',
    alt: 'Corner coaching between rounds',
  },
  {
    src: '/images/sparring_withnetherlands.jpg',
    alt: 'Sparring session with fighter from Netherlands',
  },
];
