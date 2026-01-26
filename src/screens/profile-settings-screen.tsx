import React, { useCallback, useMemo } from 'react';
import { ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Sentry from '@sentry/react-native';
import { Box, Button, Flex, Pressable, Text } from '~/components/ui';
import { Icon } from '~/components/ui/icon';
import { FileText, Gem, ScrollText, Sparkles, User, Users } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { RootStackParamList } from '~/types/navigation.types';
import { supabase } from '~/lib/supabase';
import { useRevenueCat } from '~/providers/RevenueCatProvider';

type SettingsSection = {
  title: string;
  items: {
    id: string;
    label: string;
    description: string;
    icon: LucideIcon;
    accentBg: string;
    accentColor: string;
  }[];
};

const SUPPORT_SECTION: SettingsSection = {
  title: 'Support',
  items: [
    {
      id: 'terms',
      label: 'Terms & Conditions',
      description: 'Learn more about our terms',
      icon: ScrollText,
      accentBg: '#FCE4EC',
      accentColor: '#C2185B',
    },
    {
      id: 'privacy',
      label: 'Privacy Policy',
      description: 'Read our privacy policy',
      icon: FileText,
      accentBg: '#F3E5F5',
      accentColor: '#8E24AA',
    },
  ],
};

const ACCOUNT_BASE_ITEMS: SettingsSection['items'] = [
  {
    id: 'profile',
    label: 'Update Profile',
    description: 'Update your profile information',
    icon: User,
    accentBg: '#EFE7FF',
    accentColor: '#6C3FB6',
  },
  {
    id: 'new-users',
    label: 'New Users',
    description: 'See recent signups',
    icon: Users,
    accentBg: '#E8F5E9',
    accentColor: '#2E7D32',
  },
  {
    id: 'onboarding',
    label: 'Onboarding Preferences',
    description: 'Retake onboarding questions to refresh your data',
    icon: Sparkles,
    accentBg: '#E0F2FE',
    accentColor: '#0284C7',
  },
];

export function ProfileSettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  // const { isPro, presentPaywall, presentCustomerCenter, customerCenterEnabled } = useRevenueCat();

  const sections = useMemo<SettingsSection[]>(() => {
    const accountItems = [...ACCOUNT_BASE_ITEMS];

    // if (isPro) {
    //   accountItems.unshift({
    //     id: 'manage-subscription',
    //     label: 'Manage Subscription',
    //     description: customerCenterEnabled
    //       ? 'Change or cancel your plan at any time'
    //       : 'Switch plans or renew your access',
    //     icon: Gem,
    //     accentBg: '#FFF0EB',
    //     accentColor: '#F97316',
    //   });
    // }

    return [
      {
        title: 'Account',
        items: accountItems,
      },
      SUPPORT_SECTION,
    ];
  }, [,]);

  // const handleManageSubscription = useCallback(async () => {
  //   if (customerCenterEnabled) {
  //     await presentCustomerCenter();
  //     return;
  //   }

  //   await presentPaywall();
  // }, [customerCenterEnabled, presentCustomerCenter, presentPaywall]);

  const handleItemPress = useCallback(
    async (id: string) => {
      switch (id) {
        // case 'manage-subscription':
        //   await handleManageSubscription();
        //   break;
        case 'profile':
          navigation.navigate('Update Profile');
          break;
        case 'onboarding':
          navigation.navigate('OnboardingStart', { editMode: true, returnToSettings: true });
          break;
        case 'new-users':
          navigation.navigate('New Users');
          break;
        case 'terms':
          navigation.navigate('Terms');
          break;
        case 'privacy':
          navigation.navigate('Privacy');
          break;
        default:
          break;
      }
    },
    [navigation]
  );

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Flex flex className="bg-background-dark">
      <ScrollView className="px-4 py-6" contentContainerStyle={{ flex: 1, paddingBottom: 32 }}>
        <Flex flex justify="space-between">
          <Flex>
            {sections.map((section) => (
              <Box key={section.title}>
                <Text bold size="xl" className="">
                  {section.title}
                </Text>
                <Box className="rounded-3xl p-1">
                  {section.items.map((item) => (
                    <React.Fragment key={item.id}>
                      <Pressable
                        onPress={() => void handleItemPress(item.id)}
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
          </Flex>
          <Button
            className="rounded-lg border-2 border-error-500 bg-background-dark"
            onPress={logout}>
            <Text className="text-error-500" bold>
              Logout
            </Text>
          </Button>
        </Flex>
      </ScrollView>
    </Flex>
  );
}
