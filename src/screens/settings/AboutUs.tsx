import {
  View,
  Text,
  TouchableNativeFeedback,
  ScrollView,
  Linking,
} from 'react-native';
import React from 'react';
import {MaterialCommunityIcons, AntDesign} from '@expo/vector-icons';
import useThemeStore from '../../lib/zustand/themeStore';
import * as Application from 'expo-application';
import {socialLinks} from '../../lib/constants';

const AboutUs = () => {
  const {primary} = useThemeStore(state => state);

  return (
    <View className="flex-1 bg-black mt-8">
      <View className="px-4 py-3 border-b border-white/10">
        <Text className="text-2xl font-bold text-white">About Us</Text>
        <Text className="text-gray-400 mt-1 text-sm">
          Learn more about Unix Movies
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4 space-y-4 pb-24">
          {/* App Version */}
          <View className="bg-white/10 p-4 rounded-lg">
            <Text className="text-white text-base font-semibold mb-2">App Version</Text>
            <Text className="text-white/70">
              v{Application.nativeApplicationVersion}
            </Text>
          </View>

          {/* About Us Content */}
          <View className="bg-white/10 p-4 rounded-lg">
            <Text className="text-white text-base font-semibold mb-3">Our Story</Text>
            <Text className="text-gray-300 text-sm leading-6 mb-4">
              Unix Movies was born from a simple yet powerful vision: to create the ultimate entertainment companion for movie and series enthusiasts worldwide. We recognized that in today's fast-paced digital world, people want instant access to their favorite content without the hassle of multiple subscriptions and complicated interfaces.
            </Text>

            <Text className="text-gray-300 text-sm leading-6 mb-4">
              Our journey began when we noticed a gap in the streaming landscape - users were overwhelmed by countless apps, each requiring separate subscriptions and offering fragmented experiences. We set out to build a unified platform that brings together content from various sources, making it easier than ever to discover, watch, and enjoy movies and TV shows.
            </Text>

            <Text className="text-gray-300 text-sm leading-6 mb-4">
              What drives us is our passion for storytelling and technology. We believe that great content should be accessible to everyone, regardless of their location or budget constraints. That's why we've designed Vega Movies to be intuitive, fast, and reliable - putting the focus where it belongs: on the entertainment experience.
            </Text>

            <Text className="text-gray-300 text-sm leading-6">
              Every feature we add, every improvement we make, is guided by our commitment to enhancing your viewing experience. From seamless streaming to personalized recommendations, we're constantly working to make Vega Movies your go-to destination for all things entertainment.
            </Text>
          </View>

          {/* Mission */}
          <View className="bg-white/10 p-4 rounded-lg">
            <Text className="text-white text-base font-semibold mb-3">Our Mission</Text>
            <Text className="text-gray-300 text-sm leading-6">
              To democratize entertainment by providing a unified, user-friendly platform that connects people with the stories they love, while supporting content creators and fostering a global community of entertainment enthusiasts.
            </Text>
          </View>



          {/* Features */}
          <View className="bg-white/10 p-4 rounded-lg">
            <Text className="text-white text-base font-semibold mb-3">Why Choose Unix Movies?</Text>
            <View className="space-y-2">
              <View className="flex-row items-start">
                <MaterialCommunityIcons name="check-circle" size={20} color={primary} />
                <Text className="text-gray-300 text-sm ml-2">Unified content discovery from multiple sources</Text>
              </View>
              <View className="flex-row items-start">
                <MaterialCommunityIcons name="check-circle" size={20} color={primary} />
                <Text className="text-gray-300 text-sm ml-2">Optimized for low-end devices</Text>
              </View>
              <View className="flex-row items-start">
                <MaterialCommunityIcons name="check-circle" size={20} color={primary} />
                <Text className="text-gray-300 text-sm ml-2">Clean, intuitive user interface</Text>
              </View>
              <View className="flex-row items-start">
                <MaterialCommunityIcons name="check-circle" size={20} color={primary} />
                <Text className="text-gray-300 text-sm ml-2">Regular updates and improvements</Text>
              </View>
              <View className="flex-row items-start">
                <MaterialCommunityIcons name="check-circle" size={20} color={primary} />
                <Text className="text-gray-300 text-sm ml-2">Active community support</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default AboutUs;
