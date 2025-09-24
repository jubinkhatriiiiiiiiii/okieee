import {
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Text,
  View,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import Slider from '../components/Slider';
import React, {useEffect, useState, useRef, useCallback, useMemo} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SearchStackParamList} from '../App';
import useThemeStore from '../lib/zustand/themeStore';
import {providerManager} from '../lib/services/ProviderManager';
import useContentStore from '../lib/zustand/contentStore';
import {MaterialIcons} from '@expo/vector-icons';

type Props = NativeStackScreenProps<SearchStackParamList, 'SearchResults'>;

interface SearchPageData {
  title: string;
  Posts: any[];
  filter: string;
  providerValue: string;
  value: string;
  name: string;
}

interface LoadingState {
  name: string;
  value: string;
  isLoading: boolean;
  error?: boolean;
  retryCount?: number;
}

// Debounce hook for search optimization
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const PROVIDERS_PER_PAGE = 3; // Show 3 providers per page

const SearchResultsPaginated = React.memo(({route}: Props): React.ReactElement => {
  const {primary} = useThemeStore(state => state);
  const {installedProviders} = useContentStore(state => state);
  const [searchData, setSearchData] = useState<SearchPageData[]>([]);
  const [loading, setLoading] = useState<LoadingState[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const abortController = useRef<AbortController | null>(null);
  const searchStartTime = useRef<number>(0);

  // Debounce the search filter to prevent excessive API calls
  const debouncedFilter = useDebounce(route.params.filter, 200);

  // Memoize loading states more efficiently
  const trueLoading = useMemo(
    () =>
      installedProviders.map(item => ({
        name: item.display_name,
        value: item.value,
        isLoading: true,
        retryCount: 0,
      })),
    [installedProviders],
  );

  // Memoize update functions with better performance
  const updateSearchData = useCallback((newData: SearchPageData) => {
    setSearchData(prev => {
      // Prevent duplicate entries
      if (prev.some(item => item.providerValue === newData.providerValue)) {
        return prev.map(item =>
          item.providerValue === newData.providerValue ? newData : item
        );
      }
      return [...prev, newData].sort((a, b) => a.name.localeCompare(b.name));
    });
  }, []);

  const updateLoading = useCallback(
    (value: string, updates: Partial<LoadingState>) => {
      setLoading(prev =>
        prev.map(i => (i.value === value ? {...i, ...updates} : i)),
      );
    },
    [],
  );

  // Memoize loading completion check
  const isAllLoaded = useMemo(
    () => loading.every(i => !i.isLoading),
    [loading],
  );

  // Calculate total number of pages needed
  const totalPages = useMemo(() => {
    const providersWithResults = searchData.filter(item => {
      const loadingState = loading.find(l => l.value === item.value);
      const hasResults = item.Posts && item.Posts.length > 0;
      return loadingState?.isLoading || hasResults;
    });

    return Math.ceil(providersWithResults.length / PROVIDERS_PER_PAGE);
  }, [searchData, loading]);

  // Memoize current page data for rendering
  const currentPageData = useMemo(() => {
    // Only show providers that have results or are still loading
    const providersWithResults = searchData.filter(item => {
      const loadingState = loading.find(l => l.value === item.value);
      const hasResults = item.Posts && item.Posts.length > 0;
      return loadingState?.isLoading || hasResults;
    });

    // Sort providers by loading state first, then by whether they have results
    const sortedProviders = providersWithResults.sort((a, b) => {
      const aLoading = loading.find(l => l.value === a.value)?.isLoading || false;
      const bLoading = loading.find(l => l.value === b.value)?.isLoading || false;
      const aHasResults = a.Posts && a.Posts.length > 0;
      const bHasResults = b.Posts && b.Posts.length > 0;

      if (aLoading && !bLoading) return -1;
      if (!aLoading && bLoading) return 1;
      if (aHasResults && !bHasResults) return -1;
      if (!aHasResults && bHasResults) return 1;
      return a.name.localeCompare(b.name);
    });

    // Show only the current page of providers
    const startIndex = (currentPage - 1) * PROVIDERS_PER_PAGE;
    const endIndex = currentPage * PROVIDERS_PER_PAGE;
    return sortedProviders.slice(startIndex, endIndex);
  }, [searchData, loading, currentPage]);

  // Check if there are more pages
  const hasNextPage = useMemo(() => {
    const providersWithResults = searchData.filter(item => {
      const loadingState = loading.find(l => l.value === item.value);
      const hasResults = item.Posts && item.Posts.length > 0;
      return loadingState?.isLoading || hasResults;
    });

    return providersWithResults.length > currentPage * PROVIDERS_PER_PAGE;
  }, [searchData, loading, currentPage]);

  // Check if there are previous pages
  const hasPreviousPage = useMemo(() => currentPage > 1, [currentPage]);

  // Navigation handlers
  const goToNextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const goToPreviousPage = useCallback(() => {
    if (hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [hasPreviousPage]);

  // Performance monitoring
  const logPerformance = useCallback((message: string) => {
    const elapsed = Date.now() - searchStartTime.current;
    console.log(`[Search Performance] ${message} - ${elapsed}ms`);
  }, []);

  useEffect(() => {
    // Clean up previous controller if exists
    if (abortController.current) {
      abortController.current.abort();
    }

    // Create a new controller for this effect
    abortController.current = new AbortController();
    const signal = abortController.current.signal;

    // Reset states when component mounts or filter changes
    setSearchData([]);
    setLoading(trueLoading);
    setCurrentPage(1); // Reset to first page
    searchStartTime.current = Date.now();

    const getSearchResults = async () => {
      // Optimized performance settings
      const BATCH_SIZE = 2;
      const REQUEST_TIMEOUT = 10000;
      const MAX_RESULTS_PER_PROVIDER = 8;
      const BATCH_DELAY = 100;
      const MAX_RETRIES = 2;

      const fetchWithTimeout = async (provider: any): Promise<void> => {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Search timeout')), REQUEST_TIMEOUT)
        );

        const attemptFetch = async (attemptNumber: number = 1): Promise<void> => {
          try {
            const data = await Promise.race([
              providerManager.getSearchPosts({
                searchQuery: debouncedFilter,
                page: 1,
                providerValue: provider.value,
                signal: signal,
              }),
              timeoutPromise
            ]);

            if (signal.aborted) return;

            const limitedData = data ? data.slice(0, MAX_RESULTS_PER_PROVIDER) : [];

            if (limitedData && limitedData.length > 0) {
              const newData = {
                title: provider.display_name,
                Posts: limitedData,
                filter: debouncedFilter,
                providerValue: provider.value,
                value: provider.value,
                name: provider.display_name,
              };
              updateSearchData(newData);
              logPerformance(`✅ ${provider.display_name}: ${limitedData.length} results`);
            } else {
              logPerformance(`⚠️ ${provider.display_name}: No results`);
            }

            updateLoading(provider.value, {isLoading: false, error: false});
          } catch (error: any) {
            if (signal.aborted || error?.message === 'Search timeout') {
              logPerformance(`⏭️ ${provider.display_name}: Aborted/Timeout`);
              updateLoading(provider.value, {isLoading: false, error: true});
              return;
            }

            console.warn(
              `Search failed for ${provider.display_name} (attempt ${attemptNumber}):`,
              error?.message || error,
            );

            if (attemptNumber < MAX_RETRIES) {
              logPerformance(`🔄 ${provider.display_name}: Retrying (${attemptNumber}/${MAX_RETRIES})`);
              await new Promise(resolve => setTimeout(resolve, 1000 * attemptNumber));
              return attemptFetch(attemptNumber + 1);
            }

            updateLoading(provider.value, {isLoading: false, error: true});
            logPerformance(`❌ ${provider.display_name}: Failed after ${MAX_RETRIES} attempts`);
          }
        };

        return attemptFetch();
      };

      for (let i = 0; i < installedProviders.length; i += BATCH_SIZE) {
        const batch = installedProviders.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(fetchWithTimeout);

        await Promise.allSettled(batchPromises);

        if (i + BATCH_SIZE < installedProviders.length && !signal.aborted) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }
      }

      logPerformance('🏁 Search completed');
    };

    if (debouncedFilter.trim()) {
      getSearchResults();
    } else {
      setLoading(trueLoading.map(item => ({...item, isLoading: false})));
    }

    return () => {
      if (abortController.current) {
        abortController.current.abort();
        abortController.current = null;
      }
    };
  }, [
    debouncedFilter,
    trueLoading,
    installedProviders,
    updateSearchData,
    updateLoading,
    logPerformance,
  ]);

  // Memoize render item function
  const renderItem = useCallback(
    ({item, index}: {item: SearchPageData; index: number}) => {
      const loadingState = loading.find(i => i.value === item.value);
      const hasResults = item.Posts && item.Posts.length > 0;

      return (
        <Slider
          isLoading={loadingState?.isLoading || false}
          key={`${item.value}-${hasResults ? 'data' : 'empty'}`}
          title={item.name}
          posts={item.Posts || []}
          filter={debouncedFilter}
          providerValue={item.value}
          isSearch={true}
        />
      );
    },
    [loading, debouncedFilter],
  );

  // Memoize key extractor
  const keyExtractor = useCallback((item: SearchPageData) => item.value, []);

  // Memoize loading indicator
  const loadingIndicator = useMemo(() => {
    if (isAllLoaded) return null;

    const loadingCount = loading.filter(l => l.isLoading).length;
    const totalCount = loading.length;

    return (
      <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 80}}>
        <ActivityIndicator
          size="small"
          color={primary}
          animating={true}
        />
        <Text style={{color: '#9CA3AF', fontSize: 12, marginTop: 4, marginLeft: 8}}>
          Searching {loadingCount} of {totalCount} providers...
        </Text>
      </View>
    );
  }, [isAllLoaded, primary, loading]);

  // Memoize pagination controls
  const paginationControls = useMemo(() => {
    if (totalPages <= 1) return null;

    return (
      <View style={{
        marginHorizontal: 16,
        marginVertical: 8,
      }}>
        {/* Page Indicator */}
        <View style={{
          alignItems: 'center',
          marginBottom: 12,
          paddingVertical: 6,
          paddingHorizontal: 12,
          backgroundColor: '#1F1F1F',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#333333',
        }}>
          <Text style={{
            color: primary,
            fontSize: 14,
            fontWeight: '600',
          }}>
            Page {currentPage} of {totalPages}
          </Text>
          <Text style={{
            color: '#9CA3AF',
            fontSize: 11,
            marginTop: 1,
          }}>
            {currentPage * PROVIDERS_PER_PAGE - PROVIDERS_PER_PAGE + 1} - {Math.min(currentPage * PROVIDERS_PER_PAGE, searchData.length)} of {searchData.length} providers
          </Text>
        </View>

        {/* Navigation Buttons */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}>
          <TouchableOpacity
            onPress={goToPreviousPage}
            disabled={!hasPreviousPage}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: hasPreviousPage ? primary + '20' : '#2A2A2A',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: hasPreviousPage ? primary + '40' : '#404040',
            }}>
            <MaterialIcons
              name="chevron-left"
              size={18}
              color={hasPreviousPage ? primary : '#666'}
            />
            <Text style={{
              color: hasPreviousPage ? primary : '#666',
              fontSize: 13,
              fontWeight: '500',
              marginLeft: 4,
            }}>
              Previous
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goToNextPage}
            disabled={!hasNextPage}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: hasNextPage ? primary + '20' : '#2A2A2A',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: hasNextPage ? primary + '40' : '#404040',
            }}>
            <Text style={{
              color: hasNextPage ? primary : '#666',
              fontSize: 13,
              fontWeight: '500',
              marginRight: 4,
            }}>
              Next
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={18}
              color={hasNextPage ? primary : '#666'}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [totalPages, currentPage, hasPreviousPage, hasNextPage, goToPreviousPage, goToNextPage, primary, searchData.length]);

  return (
    <SafeAreaView style={{backgroundColor: 'black', flex: 1, width: '100%'}}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{marginTop: 56, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12}}>
          <Text style={{color: 'white', fontSize: 24, fontWeight: '600'}}>
            {isAllLoaded ? 'Searched for' : 'Searching for'}{' '}
            <Text style={{color: primary}}>"{debouncedFilter}"</Text>
          </Text>
          {loadingIndicator}
        </View>

        <View style={{paddingHorizontal: 16}}>
          {currentPageData.length > 0 ? (
            <FlatList
              data={currentPageData}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={true}
              maxToRenderPerBatch={2}
              windowSize={3}
              initialNumToRender={1}
              getItemLayout={(data, index) => ({
                length: 280,
                offset: 280 * index,
                index,
              })}
              updateCellsBatchingPeriod={50}
              contentInsetAdjustmentBehavior="automatic"
            />
          ) : (
            isAllLoaded && (
              <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80}}>
                <Text style={{color: 'white', fontSize: 18}}>No results found</Text>
                <Text style={{color: '#9CA3AF', fontSize: 14, marginTop: 8}}>
                  Try searching with different keywords
                </Text>
              </View>
            )
          )}

          {paginationControls}
        </View>
        <View style={{height: 64}} />
      </ScrollView>
    </SafeAreaView>
  );
});

export default SearchResultsPaginated;
