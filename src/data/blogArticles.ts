export interface BlogArticleSummary {
  title: string;
  description: string;
  href: string;
  image: string;
  imageAlt: string;
  topic: string;
}

export const blogArticles: BlogArticleSummary[] = [
  {
    title: 'The Price of a Close Approach',
    description:
      'A Russian military satellite spent three weeks maneuvering next to a commercial radar satellite tied to Ukraine. What that costs the space industry before anything breaks, and the evidence nobody can yet produce.',
    href: '/blog/the-price-of-a-close-approach/',
    image: '/images/blog/close-approach-hero.png',
    imageAlt: 'Two satellites on nearly identical orbits above the night side of Earth',
    topic: 'Orbital security',
  },
  {
    title: 'The Case for Attack Satellites',
    description:
      'Have you seen Star Wars? Pretty cool, right? This is not that. This is a real problem that is likely imminent, and the funnest solution happens to be satellites that shoot lasers. Still pretty cool.',
    href: '/blog/the-case-for-attack-satellites/',
    image: '/images/blog/kessler2.png',
    imageAlt: 'Satellites and orbital debris above Earth',
    topic: 'Orbital infrastructure',
  },
];
