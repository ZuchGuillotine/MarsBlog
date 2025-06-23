export interface ArticleFrontmatter {
  title: string;
  description: string;
  pubDate: Date;
  author: string;
  tags: string[];
  readingTime?: number;
  lastModified?: Date;
  category?: 'radiation' | 'transportation' | 'energy' | 'infrastructure' | 'water' | 'agriculture' | 'other';
  featured?: boolean;
}

export interface ArticleMeta {
  slug: string;
  frontmatter: ArticleFrontmatter;
  url: string;
}

export interface SearchResult {
  title: string;
  url: string;
  excerpt: string;
  type: 'article' | 'location' | 'page';
  score: number;
  category?: string;
}

export interface CollapsibleSection {
  id: string;
  title: string;
  content: string;
  subsections?: CollapsibleSection[];
  relatedLinks?: {
    title: string;
    url: string;
    type: 'internal' | 'external';
  }[];
}

export interface ContentCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  sections: CollapsibleSection[];
}

// Major terraforming content categories
export type TerraformingCategory = 
  | 'radiation-mitigation'
  | 'transportation' 
  | 'energy'
  | 'infrastructure'
  | 'water'
  | 'agriculture';

export interface TerraformingContent {
  categories: Record<TerraformingCategory, ContentCategory>;
}

export interface Citation {
  id: string;
  title: string;
  authors: string[];
  year: number;
  publication?: string;
  url?: string;
  doi?: string;
  type: 'journal' | 'conference' | 'report' | 'website' | 'book';
}