// Homepage Videos section (task 8.5, replaces the deleted /library page).
// Each tile is a lazy-loaded thumbnail that opens the real video on
// Instagram or YouTube -- no embedded players, no live feed, per the brief.
// url/thumbnail are deliberately left empty here: Rainers fills these in
// with the real links before this section goes live. A tile with no url
// does not render (see index.astro's videos.filter(v => v.url)).

export interface HomeVideo {
  title: string;
  url: string;       // Instagram or YouTube link to the real video. Empty = not rendered.
  thumbnail: string; // Thumbnail image path or URL. Empty = not rendered.
}

export const videos: HomeVideo[] = [
  { title: 'Swivel Jab', url: '', thumbnail: '' },
  { title: '90% Quit Boxing', url: '', thumbnail: '' },
  { title: 'Take a small step with your lead foot', url: '', thumbnail: '' },
  { title: 'Steps', url: '', thumbnail: '' },
  { title: '7 setups in boxing (with steps)', url: '', thumbnail: '' },
  { title: 'Step-Shuffles', url: '', thumbnail: '' },
  { title: '10,000 kicks', url: '', thumbnail: '' },
];
