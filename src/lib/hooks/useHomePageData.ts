import {useQuery} from '@tanstack/react-query';
import {getHomePageData, HomePageData} from '../getHomepagedata';
import {Content} from '../zustand/contentStore';
import {cacheStorage} from '../storage';
import { ProviderExtension } from '../storage/extensionStorage';

interface UseHomePageDataOptions {
  provider: Content['provider'];
  enabled?: boolean;
  // New option for multi-provider support
  useAllProviders?: boolean;
}

// Performance optimization: Use Map for O(1) lookups instead of Set
const createPostKey = (post: any): string => {
  return `${post.title || ''}-${post.link || ''}-${post.description || ''}`.toLowerCase();
};

// Optimized deduplication using Map for better performance
const deduplicatePosts = (posts: any[]): any[] => {
  const seen = new Map<string, any>();
  const result: any[] = [];

  for (const post of posts) {
    const key = createPostKey(post);
    if (!seen.has(key)) {
      seen.set(key, post);
      result.push(post);
    }
  }

  return result;
};

// Optimized content aggregation with better memory management
const aggregateProviderData = (results: any[]): HomePageData[] => {
  const categoryMap = new Map<string, { category: HomePageData; posts: any[] }>();
  const postKeys = new Set<string>();

  // First pass: collect and deduplicate posts by category
  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value.data.length > 0) {
      result.value.data.forEach((category: HomePageData) => {
        const categoryKey = category.filter || category.title || 'unknown';

        if (!categoryMap.has(categoryKey)) {
          categoryMap.set(categoryKey, {
            category: {
              ...category,
              title: category.title || 'Content',
              Posts: [],
            },
            posts: [],
          });
        }

        // Collect posts for deduplication
        if (category.Posts) {
          categoryMap.get(categoryKey)!.posts.push(...category.Posts);
        }
      });
    }
  });

  // Second pass: deduplicate and create final categories
  const allData: HomePageData[] = [];

  categoryMap.forEach(({ category, posts }) => {
    if (posts.length > 0) {
      const uniquePosts = deduplicatePosts(posts);
      if (uniquePosts.length > 0) {
        allData.push({
          ...category,
          Posts: uniquePosts.slice(0, 20), // Limit posts per category for performance
        });
      }
    }
  });

  return allData;
};

export const useHomePageData = ({
  provider,
  enabled = true,
  useAllProviders = false,
}: UseHomePageDataOptions) => {
  return useQuery<HomePageData[], Error>({
    queryKey: useAllProviders
      ? ['homePageData', 'all-providers']
      : ['homePageData', provider.value],
    queryFn: async ({signal}) => {
      if (useAllProviders) {
        // Fetch from random 2-3 providers for performance
        const useContentStore = (await import('../zustand/contentStore')).default;
        const contentStore = useContentStore.getState();
        const activeProviders = contentStore.getActiveProviders();

        if (activeProviders.length === 0) {
          return [];
        }

        // Performance optimization: Randomly select 2-3 providers
        const numProviders = Math.min(
          activeProviders.length,
          Math.random() < 0.5 ? 2 : 3 // 50% chance for 2, 50% for 3
        );

        // Shuffle and select providers
        const shuffledProviders = [...activeProviders].sort(() => Math.random() - 0.5);
        const selectedProviders = shuffledProviders.slice(0, numProviders);

        console.log(`📺 Fetching from ${selectedProviders.length} random providers:`,
          selectedProviders.map(p => p.display_name).join(', '));

        // Performance optimization: Limit concurrent requests and add timeout
        const BATCH_SIZE = 2; // Process 2 providers at a time
        const REQUEST_TIMEOUT = 15000; // 15 second timeout per provider

        const fetchWithTimeout = async (provider: ProviderExtension): Promise<any> => {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Provider timeout')), REQUEST_TIMEOUT)
          );

          try {
            const data = await Promise.race([
              getHomePageData(provider, signal),
              timeoutPromise
            ]);
            return { provider: provider.value, data };
          } catch (error) {
            console.warn(`Provider ${provider.display_name} failed or timed out:`, error);
            return { provider: provider.value, data: [] };
          }
        };

        // Process selected providers in batches
        const allResults = [];
        for (let i = 0; i < selectedProviders.length; i += BATCH_SIZE) {
          const batch = selectedProviders.slice(i, i + BATCH_SIZE);
          const batchPromises = batch.map(fetchWithTimeout);
          const batchResults = await Promise.allSettled(batchPromises);

          allResults.push(...batchResults);

          // Small delay between batches to prevent overwhelming
          if (i + BATCH_SIZE < selectedProviders.length) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }

        // Aggregate and optimize the results
        const aggregatedData = aggregateProviderData(allResults);

        // Performance optimization: Limit total categories to prevent UI lag
        return aggregatedData.slice(0, 6); // Max 6 categories for optimal performance

      } else {
        // Original single provider logic
        const data = await getHomePageData(provider, signal);
        return data;
      }
    },
    enabled: enabled && (useAllProviders || !!provider?.value),
    staleTime: 10 * 60 * 1000, // Increased to 10 minutes for better caching
    gcTime: 60 * 60 * 1000, // 1 hour cache retention
    retry: (failureCount, error) => {
      if (error.name === 'AbortError' || error.message === 'Provider timeout') {
        return false; // Don't retry timeouts or aborts
      }
      return failureCount < 2; // Reduced retry attempts for performance
    },
    retryDelay: attemptIndex => Math.min(2000 * 2 ** attemptIndex, 10000), // Faster retry with max 10s
    // Optimized initial data loading
    initialData: () => {
      if (useAllProviders) {
        const cache = cacheStorage.getString('homeData-all-providers');
        if (cache) {
          try {
            const parsed = JSON.parse(cache);
            return Array.isArray(parsed) ? parsed : undefined;
          } catch {
            return undefined;
          }
        }
      } else {
        const cache = cacheStorage.getString('homeData' + provider.value);
        if (cache) {
          try {
            const parsed = JSON.parse(cache);
            return Array.isArray(parsed) ? parsed : undefined;
          } catch {
            return undefined;
          }
        }
      }
      return undefined;
    },
    // Optimized cache management
    meta: {
      onSuccess: (data: HomePageData[]) => {
        if (data && data.length > 0) {
          try {
            if (useAllProviders) {
              cacheStorage.setString('homeData-all-providers', JSON.stringify(data));
            } else {
              cacheStorage.setString('homeData' + provider.value, JSON.stringify(data));
            }
          } catch (error) {
            console.warn('Failed to cache home data:', error);
          }
        }
      },
    },
  });
};

// Memoized hero selection with stable reference
export const getRandomHeroPost = (homeData: HomePageData[]) => {
  if (!homeData || homeData.length === 0) {
    return null;
  }

  // Collect all posts from all categories
  const allPosts: any[] = [];
  homeData.forEach(category => {
    if (category.Posts && category.Posts.length > 0) {
      allPosts.push(...category.Posts);
    }
  });

  if (allPosts.length === 0) {
    return null;
  }

  // Select a random post from all available posts
  const randomIndex = Math.floor(Math.random() * allPosts.length);
  return allPosts[randomIndex];
};

// New hook for hero metadata with React Query
export const useHeroMetadata = (heroLink: string, providerValue: string) => {
  return useQuery({
    queryKey: ['heroMetadata', heroLink, providerValue],
    queryFn: async () => {
      const {providerManager} = await import('../services/ProviderManager');
      const {default: axios} = await import('axios');

      const info = await providerManager.getMetaData({
        link: heroLink,
        provider: providerValue,
      });

      // Try to get enhanced metadata from Stremio if imdbId is available
      if (info.imdbId) {
        try {
          const response = await axios.get(
            `https://v3-cinemeta.strem.io/meta/${info.type}/${info.imdbId}.json`,
            {timeout: 5000},
          );
          return response.data?.meta || info;
        } catch {
          return info; // Fallback to original info if Stremio fails
        }
      }

      return info;
    },
    enabled: !!heroLink && !!providerValue,
    staleTime: 10 * 60 * 1000, // 10 minutes - hero metadata changes less frequently
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
    // Cache hero metadata separately
    meta: {
      onSuccess: (data: any) => {
        cacheStorage.setString(heroLink, JSON.stringify(data));
      },
    },
    // Use cached data as initial data
    initialData: () => {
      const cached = cacheStorage.getString(heroLink);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          return undefined;
        }
      }
      return undefined;
    },
  });
};
