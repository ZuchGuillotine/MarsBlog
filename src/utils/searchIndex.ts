import type { CollectionEntry } from 'astro:content';
import lunr from 'lunr';

export interface SearchDocument {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  type: 'article' | 'location';
  category?: string;
  tags?: string[];
  pubDate?: string;
}

export interface SearchResult {
  document: SearchDocument;
  score: number;
  matches: Record<string, string[]>;
}

export class SearchIndex {
  private index: lunr.Index;
  private documents: Map<string, SearchDocument>;

  constructor(documents: SearchDocument[]) {
    this.documents = new Map(documents.map(doc => [doc.id, doc]));
    
    this.index = lunr(function() {
      this.ref('id');
      this.field('title', { boost: 10 });
      this.field('description', { boost: 5 });
      this.field('content');
      this.field('category', { boost: 3 });
      this.field('tags', { boost: 2 });
      
      documents.forEach(doc => {
        this.add(doc);
      });
    });
  }

  search(query: string, maxResults: number = 10): SearchResult[] {
    if (!query.trim()) return [];
    
    const results = this.index.search(query);
    
    return results
      .slice(0, maxResults)
      .map(result => {
        const document = this.documents.get(result.ref);
        if (!document) return null;
        
        return {
          document,
          score: result.score,
          matches: result.matchData.metadata
        };
      })
      .filter((result): result is SearchResult => result !== null);
  }

  static async buildFromCollections(
    blogEntries: CollectionEntry<'blog'>[], 
    locationEntries: CollectionEntry<'locations'>[]
  ): Promise<SearchIndex> {
    const documents: SearchDocument[] = [];
    
    // Process blog articles
    for (const entry of blogEntries) {
      if (entry.data.draft) continue;
      
      documents.push({
        id: `blog-${entry.slug}`,
        title: entry.data.title,
        description: entry.data.description,
        content: entry.body,
        url: `/blog/${entry.slug}`,
        type: 'article',
        category: entry.data.category,
        tags: entry.data.tags,
        pubDate: entry.data.pubDate.toISOString()
      });
    }
    
    // Process locations
    for (const entry of locationEntries) {
      documents.push({
        id: `location-${entry.slug}`,
        title: entry.data.name,
        description: entry.data.description,
        content: entry.body,
        url: `/locations/${entry.slug}`,
        type: 'location',
        category: entry.data.region,
        tags: entry.data.features
      });
    }
    
    return new SearchIndex(documents);
  }
}

export function highlightSearchTerms(text: string, terms: string[]): string {
  if (!terms.length) return text;
  
  const regex = new RegExp(`\\b(${terms.join('|')})\\b`, 'gi');
  return text.replace(regex, '<mark class="bg-mars-orange/30 text-mars-orange">$1</mark>');
}

export function extractExcerpt(content: string, terms: string[], maxLength: number = 200): string {
  if (!terms.length) return content.slice(0, maxLength) + '...';
  
  const regex = new RegExp(`\\b(${terms.join('|')})\\b`, 'i');
  const match = content.match(regex);
  
  if (!match) return content.slice(0, maxLength) + '...';
  
  const matchIndex = match.index || 0;
  const start = Math.max(0, matchIndex - maxLength / 2);
  const end = Math.min(content.length, start + maxLength);
  
  let excerpt = content.slice(start, end);
  
  if (start > 0) excerpt = '...' + excerpt;
  if (end < content.length) excerpt = excerpt + '...';
  
  return excerpt;
}