import {
  SafeAreaView,
  ScrollView,
  RefreshControl,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import Slider from '../../components/Slider';
import React, {useCallback, useMemo, useState, useEffect, useRef} from 'react';
import HeroOptimized from '../../components/HeroNoSearch';
import {mainStorage} from '../../lib/storage';
import useContentStore from '../../lib/zustand/contentStore';
import useHeroStore from '../../lib/zustand/herostore';
import {
  useHomePageData,
  getRandomHeroPost,
} from '../../lib/hooks/useHomePageData';
import useThemeStore from '../../lib/zustand/themeStore';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {HomeStackParamList} from '../../App';
import ContinueWatching from '../../components/ContinueWatching';
import {providerManager} from '../../lib/services/ProviderManager';
import Tutorial from '../../components/Touturial';
import {QueryErrorBoundary} from '../../components/ErrorBoundary';
import {StatusBar} from 'expo-status-bar';
import LinearGradient from 'react-native-linear-gradient';
import {MaterialIcons} from '@expo/vector-icons';
import type {Post} from '../../lib/providers/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

// Optimized Section Header - Minimal design
const SectionHeader = ({
  title,
  icon,
  color,
}: {
  title: string;
  icon: string;
  color: string;
}) => (
  <View style={{
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  }}>
    <MaterialIcons name={icon as any} size={20} color={color} />
    <Text style={{
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
      letterSpacing: 0.3,
    }}>
      {title}
    </Text>
  </View>
);

const Home = React.memo(({}: Props) => {
  const {primary} = useThemeStore(state => state);
  const [backgroundColor, setBackgroundColor] = useState('transparent');
  const scrollY = useRef(new Animated.Value(0)).current;

  const {installedProviders} = useContentStore(state => state);
  const {setHero} = useHeroStore(state => state);

  // Memoize static values
  const fallbackProvider = useMemo(() => ({
    value: '',
    display_name: '',
    type: 'global' as const,
    installed: false,
    disabled: false,
    version: '0.0.1',
    icon: '',
    installedAt: 0,
    lastUpdated: 0,
  }), []);

  // React Query for home page data
  const {
    data: homeData = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useHomePageData({
    provider: installedProviders[0] || fallbackProvider,
    enabled: !!(installedProviders?.length),
    useAllProviders: true,
  });

  // Memoized scroll handler - optimized
  const handleScroll = useCallback((event: any) => {
    const newBackgroundColor =
      event.nativeEvent.contentOffset.y > 0 ? '#121212' : 'transparent';
    setBackgroundColor(newBackgroundColor);
  }, []);

  // Stable hero post calculation
  const heroPost = useMemo(() => {
    if (!homeData || homeData.length === 0) {
      return null;
    }
    return getRandomHeroPost(homeData);
  }, [homeData]);

  // Hero update effect
  const updateHero = useCallback((heroPost: any) => {
    if (heroPost) {
      console.log('🎯 Setting hero post:', heroPost.title || heroPost.name, heroPost.link);
      setHero(heroPost);
    } else {
      console.log('❌ No hero post available');
      setHero({link: '', image: '', title: ''});
    }
  }, [setHero]);

  useEffect(() => {
    updateHero(heroPost);
  }, [heroPost, updateHero]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    try {
      await refetch();
    } catch (refreshError) {
      console.error('Error refreshing home data:', refreshError);
    }
  }, [refetch]);

  // Optimized content sliders - memoized
  const contentSliders = useMemo(() => {
    if (isLoading) {
      return [
        <Slider
          isLoading={true}
          key="loading-mixed"
          title="Loading..."
          posts={[]}
          filter="mixed"
        />
      ];
    }

    return homeData.map((item, index) => (
      <Slider
        isLoading={false}
        key={`content-${item.filter || 'unknown'}-${index}`}
        title={item.title}
        posts={item.Posts}
        filter={item.filter}
      />
    ));
  }, [homeData, isLoading]);

  // Optimized error component
  const errorComponent = useMemo(() => {
    if (!error && (isLoading || homeData.length > 0)) {
      return null;
    }

    return (
      <View style={{
        margin: 16,
        padding: 20,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        alignItems: 'center',
      }}>
        <MaterialIcons name="error-outline" size={32} color="#fca5a5" />
        <Text style={{
          color: '#fca5a5',
          fontSize: 14,
          fontWeight: '500',
          marginTop: 8,
          textAlign: 'center'
        }}>
          {error?.message || 'Failed to load content'}
        </Text>
        <Text style={{
          color: '#9ca3af',
          fontSize: 12,
          marginTop: 4,
          textAlign: 'center'
        }}>
          Pull to refresh
        </Text>
      </View>
    );
  }, [error, isLoading, homeData.length]);

  // Early return for no providers
  if (!installedProviders || installedProviders.length === 0) {
    return <Tutorial />;
  }

  return (
    <QueryErrorBoundary>
      <SafeAreaView style={{backgroundColor: '#121212', flex: 1}}>
        <StatusBar
          style="light"
          animated={true}
          translucent={true}
          backgroundColor={backgroundColor}
        />

        <ScrollView
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          style={{backgroundColor: '#121212'}}
          refreshControl={
            <RefreshControl
              colors={[primary]}
              tintColor={primary}
              progressBackgroundColor="#121212"
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              progressViewOffset={80}
            />
          }>
          {/* Optimized Hero Section */}
          <View style={{position: 'relative'}}>
            <HeroOptimized />
            <LinearGradient
              colors={['transparent', 'rgba(18, 18, 18, 0.6)', 'rgba(18, 18, 18, 0.95)']}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 100,
                zIndex: 5,
              }}
              pointerEvents="none"
            />
          </View>

          {/* Continue Watching Section */}
          <SectionHeader
            title="Continue Watching"
            icon="play-circle-filled"
            color="#10b981"
          />

          <View style={{marginTop: -4, position: 'relative', zIndex: 20}}>
            <ContinueWatching />
          </View>

          {/* Content Section */}
          <SectionHeader
            title="Browse"
            icon="explore"
            color={primary}
          />

          <View style={{
            marginTop: -8,
            position: 'relative',
            zIndex: 20,
            backgroundColor: '#121212',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 8,
          }}>
            {/* Content Sliders */}
            {contentSliders}

            {/* Error State */}
            {errorComponent}
          </View>

          {/* Bottom Spacing */}
          <View style={{height: 60}} />
        </ScrollView>

        {/* Optimized Floating Refresh Indicator */}
        {isRefetching && (
          <View style={{
            position: 'absolute',
            top: 60,
            right: 16,
            backgroundColor: 'rgba(18, 18, 18, 0.9)',
            borderRadius: 16,
            paddingHorizontal: 12,
            paddingVertical: 6,
            zIndex: 100,
            borderWidth: 1,
            borderColor: primary + '40',
          }}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
              <MaterialIcons name="refresh" size={12} color={primary} />
              <Text style={{
                color: primary,
                fontSize: 11,
                fontWeight: '500'
              }}>
                Refreshing...
              </Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </QueryErrorBoundary>
  );
});

Home.displayName = 'Home';

export default Home;