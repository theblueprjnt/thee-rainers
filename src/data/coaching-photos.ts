// Coaching photo gallery — /src/pages/command.astro reads this list.
// Drop photos in /public/assets/coaching/ then add filenames below.
// Format: { src: '/assets/coaching/filename.jpg', alt: 'brief description' }
// Leave the array empty and the gallery renders nothing (graceful empty state).

export interface CoachingPhoto {
  src: string;
  alt: string;
}

// Seeded with existing repo photos so the gallery is not empty on launch.
// Replace or extend when Rainers drops dedicated coaching session photos.
export const coachingPhotos: CoachingPhoto[] = [
  {
    src: '/images/rainers-coaching.jpg',
    alt: 'Rainers coaching a fighter on movement',
  },
  {
    src: '/images/padwork-outdoor.jpg',
    alt: 'Pad work session outdoors',
  },
  {
    src: '/images/corner-coach.jpg',
    alt: 'Corner coaching between rounds',
  },
  {
    src: '/images/sparring_withnetherlands.jpg',
    alt: 'Sparring session with fighter from Netherlands',
  },
];
