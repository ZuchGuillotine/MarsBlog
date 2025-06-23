import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getCollection } from 'astro:content';
import { SearchIndex } from '../src/utils/searchIndex.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildSearchIndex() {
  console.log('Building search index...');
  
  try {
    // Get all collections
    const blogEntries = await getCollection('blog', ({ data }) => !data.draft);
    const locationEntries = await getCollection('locations');
    
    console.log(`Found ${blogEntries.length} blog entries and ${locationEntries.length} locations`);
    
    // Build search index
    const searchIndex = await SearchIndex.buildFromCollections(blogEntries, locationEntries);
    
    // Serialize the index and documents
    const indexData = {
      index: searchIndex.index.toJSON(),
      documents: Array.from(searchIndex.documents.entries())
    };
    
    // Ensure public directory exists
    const publicDir = join(__dirname, '../public');
    mkdirSync(publicDir, { recursive: true });
    
    // Write search index to public directory
    const outputPath = join(publicDir, 'search-index.json');
    writeFileSync(outputPath, JSON.stringify(indexData, null, 2));
    
    console.log(`Search index built successfully: ${outputPath}`);
    console.log(`Index size: ${Math.round(JSON.stringify(indexData).length / 1024)} KB`);
    
  } catch (error) {
    console.error('Error building search index:', error);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildSearchIndex();
}

export { buildSearchIndex };