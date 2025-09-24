import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import useThemeStore from '../../lib/zustand/themeStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../../App';

type Props = NativeStackScreenProps<SettingsStackParamList, 'Help'>;

const Help = ({ navigation }: Props) => {
  const { primary } = useThemeStore(state => state);

  const AnimatedSection = ({
    delay,
    children,
  }: {
    delay: number;
    children: React.ReactNode;
  }) => (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      layout={Layout.springify()}>
      {children}
    </Animated.View>
  );

  return (
    <SafeAreaView className="flex-1 bg-black">
      <Animated.ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 20,
          paddingBottom: 24,
          paddingHorizontal: 20,
        }}
        entering={FadeInUp.springify()}
        layout={Layout.springify()}>

        {/* Header */}
        <AnimatedSection delay={100}>
          <View className="flex-row items-center mb-6">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mr-4 p-2">
              <Feather name="arrow-left" size={24} color={primary} />
            </TouchableOpacity>
            <MaterialIcons name="help-outline" size={28} color={primary} />
            <Text className="text-2xl font-bold text-white ml-3">Help & Support</Text>
          </View>
        </AnimatedSection>

        {/* Content Discovery Section */}
        <AnimatedSection delay={200}>
          <View className="bg-[#1A1A1A] rounded-xl p-6 mb-6">
            <View className="flex-row items-center mb-4">
              <MaterialIcons name="search" size={24} color={primary} />
              <Text className="text-xl font-bold text-white ml-3">Content Discovery</Text>
            </View>

            <Text className="text-gray-300 text-base leading-6 mb-4">
              Our app provides multiple ways to discover and access your favorite content. While the home page showcases featured content, the search feature offers comprehensive access across all available providers.
            </Text>

            <View className="bg-[#262626] rounded-lg p-4">
              <Text className="text-white font-semibold text-lg mb-2">💡 Pro Tip</Text>
              <Text className="text-gray-300 text-base leading-6">
                If you can't find specific content on the home page or encounter playback issues, try using the search feature. It searches across all integrated providers simultaneously, giving you the highest chance of finding exactly what you're looking for.
              </Text>
            </View>
          </View>
        </AnimatedSection>

        {/* Search Feature Benefits */}
        <AnimatedSection delay={300}>
          <View className="bg-[#1A1A1A] rounded-xl p-6 mb-6">
            <View className="flex-row items-center mb-4">
              <MaterialIcons name="verified" size={24} color={primary} />
              <Text className="text-xl font-bold text-white ml-3">Why Use Search?</Text>
            </View>

            <View className="space-y-3">
              <View className="flex-row items-start">
                <View className="bg-primary/20 rounded-full p-1 mr-3 mt-1">
                  <MaterialIcons name="check-circle" size={16} color={primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold text-base">Multi-Provider Search</Text>
                  <Text className="text-gray-400 text-sm">Searches across all available content providers simultaneously</Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <View className="bg-primary/20 rounded-full p-1 mr-3 mt-1">
                  <MaterialIcons name="check-circle" size={16} color={primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold text-base">Higher Success Rate</Text>
                  <Text className="text-gray-400 text-sm">Significantly increases your chances of finding desired content</Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <View className="bg-primary/20 rounded-full p-1 mr-3 mt-1">
                  <MaterialIcons name="check-circle" size={16} color={primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold text-base">Real-time Results</Text>
                  <Text className="text-gray-400 text-sm">Get instant results from multiple sources in one search</Text>
                </View>
              </View>
            </View>
          </View>
        </AnimatedSection>

        {/* How to Use Search */}
        <AnimatedSection delay={400}>
          <View className="bg-[#1A1A1A] rounded-xl p-6 mb-6">
            <View className="flex-row items-center mb-4">
              <MaterialIcons name="touch-app" size={24} color={primary} />
              <Text className="text-xl font-bold text-white ml-3">How to Use Search</Text>
            </View>

            <View className="space-y-4">
              <View className="flex-row items-start">
                <Text className="text-primary font-bold text-lg mr-3">1.</Text>
                <View className="flex-1">
                  <Text className="text-white font-semibold text-base">Tap the Search Tab</Text>
                  <Text className="text-gray-400 text-sm">Navigate to the search section in the bottom navigation</Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <Text className="text-primary font-bold text-lg mr-3">2.</Text>
                <View className="flex-1">
                  <Text className="text-white font-semibold text-base">Enter Content Name</Text>
                  <Text className="text-gray-400 text-sm">Type the name of the movie, series, or content you're looking for</Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <Text className="text-primary font-bold text-lg mr-3">3.</Text>
                <View className="flex-1">
                  <Text className="text-white font-semibold text-base">Browse Results</Text>
                  <Text className="text-gray-400 text-sm">Select from the comprehensive results across all providers</Text>
                </View>
              </View>
            </View>
          </View>
        </AnimatedSection>

        {/* Additional Support */}
        <AnimatedSection delay={500}>
          <View className="bg-[#1A1A1A] rounded-xl p-6">
            <View className="flex-row items-center mb-4">
              <MaterialIcons name="support" size={24} color={primary} />
              <Text className="text-xl font-bold text-white ml-3">Need More Help?</Text>
            </View>

            <Text className="text-gray-300 text-base leading-6 mb-4">
              If you're still experiencing issues or have questions about using the app, our support team is here to help.
            </Text>

            <TouchableOpacity
              className="bg-primary/20 rounded-lg p-4 flex-row items-center justify-center"
              onPress={() => navigation.navigate('ContactUs')}>
              <MaterialIcons name="email" size={20} color={primary} />
              <Text className="text-primary font-semibold text-base ml-2">Contact Support</Text>
            </TouchableOpacity>
          </View>
        </AnimatedSection>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

export default Help;
