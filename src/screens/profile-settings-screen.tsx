import React from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Box, Button, Flex, Pressable, Text } from '~/components/ui';
import { Icon } from '~/components/ui/icon';
import {
  Bell,
  FileWarning,
  Gem,
  HelpCircle,
  Lock,
  Mail,
  Phone,
  ScrollText,
  Shield,
  User,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { RootStackParamList } from '~/types/navigation.types';
import { supabase } from '~/lib/supabase';

const settingsSections: {
  title: string;
  items: {
    id: string;
    label: string;
    description: string;
    icon: LucideIcon;
    accentBg: string;
    accentColor: string;
  }[];
}[] = [
  {
    title: 'Account',
    items: [
      {
        id: 'profile',
        label: 'Profile',
        description: 'Update your profile information',
        icon: User,
        accentBg: '#EFE7FF',
        accentColor: '#6C3FB6',
      },
      {
        id: 'contact',
        label: 'Contact Information',
        description: 'Manage your email and phone number',
        icon: Mail,
        accentBg: '#E3F2FD',
        accentColor: '#1D4ED8',
      },
      {
        id: 'password',
        label: 'Password',
        description: 'Change your password',
        icon: Lock,
        accentBg: '#E0F2F1',
        accentColor: '#00796B',
      },
      {
        id: 'membership',
        label: 'Membership',
        description: 'See perks and levels',
        icon: Gem,
        accentBg: '#FFF0EB',
        accentColor: '#F97316',
      },
    ],
  },
  {
    title: 'Preferences',
    items: [
      {
        id: 'notifications',
        label: 'Notifications',
        description: 'Customize your notification settings',
        icon: Bell,
        accentBg: '#E8F5E9',
        accentColor: '#388E3C',
      },
      {
        id: 'privacy',
        label: 'Privacy',
        description: 'Adjust your privacy settings',
        icon: Shield,
        accentBg: '#F1F8E9',
        accentColor: '#689F38',
      },
    ],
  },
  {
    title: 'Support',
    items: [
      {
        id: 'help',
        label: 'Help Center',
        description: 'Get help with the app',
        icon: HelpCircle,
        accentBg: '#FFF3E0',
        accentColor: '#FB8C00',
      },
      {
        id: 'contact',
        label: 'Contact Us',
        description: 'Contact us for support',
        icon: Phone,
        accentBg: '#FFF8E1',
        accentColor: '#F59E0B',
      },
      {
        id: 'terms',
        label: 'Terms & Conditions',
        description: 'Learn more about our terms',
        icon: ScrollText,
        accentBg: '#FCE4EC',
        accentColor: '#C2185B',
      },
      {
        id: 'privacy-policy',
        label: 'Privacy Policy',
        description: 'Read our privacy policy',
        icon: FileWarning,
        accentBg: '#F3E5F5',
        accentColor: '#8E24AA',
      },
    ],
  },
];

export function ProfileSettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleItemPress = (id: string) => {
    if (id === 'membership') {
      navigation.navigate('Membership');
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <View className="flex-1 bg-background-dark">
      <ScrollView className="px-4 py-6" contentContainerStyle={{ gap: 24, paddingBottom: 32 }}>
        {settingsSections.map((section) => (
          <Box key={section.title}>
            <Text bold size="xl" className="mb-3">
              {section.title}
            </Text>
            <Box className="rounded-3xl p-1">
              {section.items.map((item) => (
                <React.Fragment key={item.id}>
                  <Pressable
                    onPress={() => handleItemPress(item.id)}
                    className="flex-row items-center justify-between  py-4">
                    <Flex direction="row" align="center" className="flex-1" gap={3}>
                      <Box
                        className="h-12 w-12 items-center justify-center rounded-full"
                        style={{ backgroundColor: item.accentBg }}>
                        <Icon as={item.icon} size="lg" style={{ color: item.accentColor }} />
                      </Box>
                      <Flex gap={1} className="flex-1">
                        <Text bold size="md">
                          {item.label}
                        </Text>
                        <Text size="md">{item.description}</Text>
                      </Flex>
                    </Flex>
                  </Pressable>
                </React.Fragment>
              ))}
            </Box>
          </Box>
        ))}
        <Button onPress={logout}>
          <Text>Logout</Text>
        </Button>
      </ScrollView>
    </View>
  );
}
