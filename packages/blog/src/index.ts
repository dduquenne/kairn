// Types
export * from './types';

// Markdown processing
export {
  markdownToHtml,
  extractHeadings,
  calculateReadingTime,
  extractExcerpt,
  type MarkdownOptions,
} from './markdown';

// Utilities
export {
  formatPrismaPostToBlogPost,
  postToSummary,
  generateSlug,
  isValidSlug,
  calculatePostSimilarity,
  findRelatedPosts,
  filterByCategory,
  filterByTag,
  searchPosts,
  extractCategories,
  extractTags,
  groupByCategory,
  sortByDate,
  paginatePosts,
  getFeaturedPosts,
} from './utils';

// FAQ extraction
export { extractFAQFromMarkdown } from './faq';

// Slug generation (advanced, with category support)
export {
  cleanStringToSlug,
  extractSeoTermsFromTitle,
  generateSlugFromTitleAndCategory,
  generateSlugFromTitle,
  validateSlug,
} from './slug';
