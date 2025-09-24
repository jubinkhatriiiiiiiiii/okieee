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
import {socialLinks} from '../../lib/constants';

const ContactUs = () => {
  const {primary} = useThemeStore(state => state);

  return (
    <View className="flex-1 bg-black mt-8">
      <View className="px-4 py-3 border-b border-white/10">
        <Text className="text-2xl font-bold text-white">Contact Us</Text>
        <Text className="text-gray-400 mt-1 text-sm">
          Get in touch with us
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4 space-y-4 pb-24">
          {/* Contact Description */}
          <View className="bg-white/10 p-4 rounded-lg">
            <Text className="text-white text-base font-semibold mb-3">Get In Touch</Text>
            <Text className="text-gray-300 text-sm leading-6 mb-4">
              We'd love to hear from you! Connect with us on social media for updates, support, and community discussions.
            </Text>

            <Text className="text-gray-300 text-sm leading-6">
              Whether you have questions, feedback, or just want to say hello, we're here to help make your entertainment experience better.
            </Text>
          </View>

          {/* Social Media Links */}
          <View className="bg-white/10 p-4 rounded-lg">
            <Text className="text-white text-base font-semibold mb-3">Follow Us</Text>

            <View className="space-y-3">
              <TouchableNativeFeedback
                onPress={() => Linking.openURL(socialLinks.instagram)}
                background={TouchableNativeFeedback.Ripple('#ffffff20', false)}>
                <View className="flex-row items-center p-3 bg-white/5 rounded-lg">
                  <AntDesign name="instagram" size={24} color="#E4405F" />
                  <Text className="text-white ml-3 text-base">Instagram</Text>
                </View>
              </TouchableNativeFeedback>

              <TouchableNativeFeedback
                onPress={() => Linking.openURL(socialLinks.facebook)}
                background={TouchableNativeFeedback.Ripple('#ffffff20', false)}>
                <View className="flex-row items-center p-3 bg-white/5 rounded-lg">
                  <AntDesign name="facebook-square" size={24} color="#1877F2" />
                  <Text className="text-white ml-3 text-base">Facebook</Text>
                </View>
              </TouchableNativeFeedback>

              <TouchableNativeFeedback
                onPress={() => Linking.openURL(socialLinks.website)}
                background={TouchableNativeFeedback.Ripple('#ffffff20', false)}>
                <View className="flex-row items-center p-3 bg-white/5 rounded-lg">
                  <MaterialCommunityIcons name="web" size={24} color={primary} />
                  <Text className="text-white ml-3 text-base">Website</Text>
                </View>
              </TouchableNativeFeedback>
            </View>
          </View>

          {/* Support Info */}
          <View className="bg-white/10 p-4 rounded-lg">
            <Text className="text-white text-base font-semibold mb-3">Need Help?</Text>
            <Text className="text-gray-300 text-sm leading-6">
              For technical support or feature requests, feel free to reach out through any of our social media channels. We're always working to improve your experience!
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ContactUs;
