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
    title: 'The Case for Attack Satellites',
    description:
      'Have you seen Star Wars? Pretty cool, right? This is not that. This is a real problem that is likely imminent, and the funnest solution happens to be satellites that shoot lasers. Still pretty cool.',
    href: '/blog/the-case-for-attack-satellites/',
    image: '/images/blog/kessler2.png',
    imageAlt: 'Satellites and orbital debris above Earth',
    topic: 'Orbital infrastructure',
  },
];
