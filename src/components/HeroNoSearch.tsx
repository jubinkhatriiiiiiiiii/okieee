import {Image, View} from 'moti';
import React, {memo, useCallback} from 'react';
import {
  Text,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome6 from '@expo/vector-icons/FontAwesome';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {HomeStackParamList} from '../App';
import useContentStore from '../lib/zustand/contentStore';
import useHeroStore from '../lib/zustand/herostore';
import {Skeleton} from 'moti/skeleton';
import {useHeroMetadata} from '../lib/hooks/useHomePageData';

interface HeroProps {
  isDrawerOpen?: boolean;
  drawerRef?: React.RefObject<any>;
}

const Hero = memo(({isDrawerOpen, drawerRef}: HeroProps) => {
  const {provider} = useContentStore(state => state);
  const {hero} = useHeroStore(state => state);

  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  // Use React Query for hero metadata
  const {
    data: heroData,
    isLoading,
    error,
  } = useHeroMetadata(hero?.link || '', provider.value);

  const handlePlayPress = useCallback(() => {
    if (hero?.link) {
      navigation.navigate('Info', {
        link: hero.link,
        provider: provider.value,
        poster: heroData?.image || heroData?.poster || heroData?.background,
      });
    }
  }, [navigation, hero?.link, provider.value, heroData]);

  const handleImageError = useCallback(() => {
    // Handle image error silently - React Query will manage retries
    console.warn('Hero image failed to load');
  }, []);

  // Memoized image source
  const imageSource = React.useMemo(() => {
    const fallbackImage =
      'https://placehold.jp/24/363636/ffffff/500x500.png?text=Vega';

    // Prioritize hero image for background
    if (hero?.image) {
      return {uri: hero.image};
    }

    if (!heroData) {
      return {uri: fallbackImage};
    }

    return {
      uri:
        heroData.background ||
        heroData.image ||
        heroData.poster ||
        fallbackImage,
    };
  }, [heroData, hero?.image]);

  // Memoized genres
  const displayGenres = React.useMemo(() => {
    if (!heroData) {
      return [];
    }
    return (heroData.genre || heroData.tags || []).slice(0, 3);
  }, [heroData]);

  if (error) {
    console.error('Hero metadata error:', error);
  }

  return (
    <View className="relative h-[55vh]">
      {/* Hero Image */}
      <Skeleton show={isLoading} colorMode="dark">
        <Image
          source={imageSource}
          onError={handleImageError}
          className="h-full w-full"
          style={{resizeMode: 'cover'}}
        />
      </Skeleton>

      {/* Hero Content */}
      <View className="absolute bottom-12 w-full z-20 px-6">
        {/* Show hero content when we have a hero link */}
        {hero?.link && (
          <View className="gap-4 items-center">
            {/* Title/Logo */}
            {heroData?.logo ? (
              <Image
                source={{uri: heroData.logo}}
                style={{
                  width: 220,
                  height: 110,
                  resizeMode: 'contain',
                }}
                onError={() => console.warn('Logo failed to load')}
              />
            ) : (
              <Text
                className="text-white text-center font-bold leading-tight"
                style={{
                  fontSize: 28,
                  textShadowColor: 'rgba(0, 0, 0, 0.8)',
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 4,
                }}
                numberOfLines={2}
                adjustsFontSizeToFit>
                {heroData?.name || heroData?.title || hero.title || 'Featured Content'}
              </Text>
            )}

            {/* Genres */}
            {displayGenres.length > 0 && (
              <View className="flex-row items-center justify-center space-x-2">
                {displayGenres.map((genre: string, index: number) => (
                  <Text
                    key={index}
                    className="text-white font-semibold"
                    style={{
                      fontSize: 14,
                      textShadowColor: 'rgba(0, 0, 0, 0.6)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    }}>
                    • {genre}
                  </Text>
                ))}
              </View>
            )}

            {/* Play Button - Pixel Perfect */}
            <View className="flex-1 items-center justify-center">
              <TouchableOpacity
                className="bg-white/95 px-12 py-3 rounded-full flex-row items-center space-x-3 shadow-lg"
                onPress={handlePlayPress}
                activeOpacity={0.8}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 10,
                }}>
                <FontAwesome6 name="play" size={22} color="black" />
                <Text className="text-black font-bold text-lg">Play</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Loading state */}
        {isLoading && (
          <View className="items-center">
            <Skeleton show={true} height={50} width={150} colorMode="dark" />
          </View>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <View className="items-center">
            <Text
              className="text-white text-center font-bold"
              style={{
                fontSize: 20,
                textShadowColor: 'rgba(0, 0, 0, 0.8)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 4,
              }}>
              {hero?.title || 'Content Unavailable'}
            </Text>
            <Text
              className="text-gray-300 mt-2 text-center"
              style={{
                fontSize: 14,
                textShadowColor: 'rgba(0, 0, 0, 0.6)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}>
              Unable to load details
            </Text>
          </View>
        )}
      </View>

      {/* Gradients */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)', 'black']}
        locations={[0, 0.7, 1]}
        className="absolute h-full w-full"
      />
    </View>
  );
});

Hero.displayName = 'Hero';

export default Hero;
