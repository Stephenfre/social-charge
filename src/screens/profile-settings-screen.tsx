import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Sentry from '@sentry/react-native';
import { Box, Button, Flex, Pressable, Text } from '~/components/ui';
import { Icon } from '~/components/ui/icon';
import { FileText, ScrollText, Sparkles, Trash2, User, Users } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { RootStackParamList } from '~/types/navigation.types';
import { supabase } from '~/lib/supabase';

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
  const [deletingAccount, setDeletingAccount] = useState(false);
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

  const performSoftDelete = useCallback(async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      Alert.alert('Delete account', 'Could not find your account. Please log in again.');
      return;
    }

    setDeletingAccount(true);
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          first_name: null,
          last_name: null,
          email: null,
          phone_number: null,
          city: null,
          state: null,
          country: null,
          profile_picture: null,
          preferred_vibe_slug: null,
          onboarded: false,
          token_count: 0,
          membership: 'basic',
          role: 'user',
        })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        throw signOutError;
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          feature: 'account-soft-delete',
          screen: 'profile-settings',
        },
      });
      Alert.alert('Delete account', 'We could not delete your account right now. Please try again.');
    } finally {
      setDeletingAccount(false);
    }
  }, []);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete account',
      'This will remove your profile details and sign you out. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void performSoftDelete();
          },
        },
      ]
    );
  }, [performSoftDelete]);

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
          <Flex gap={3}>
            <Button
              className="rounded-lg border-2 border-error-500 bg-background-dark"
              onPress={logout}
              isDisabled={deletingAccount}>
              <Text className="text-error-500" bold>
                Logout
              </Text>
            </Button>
            <Button
              variant="outline"
              className="rounded-lg border-2 border-error-500"
              onPress={handleDeleteAccount}
              isDisabled={deletingAccount}>
              <Flex direction="row" align="center" className="gap-2">
                <Icon as={Trash2} size="sm" className="text-error-500" />
                <Text className="text-error-500" bold>
                  {deletingAccount ? 'Deleting Account...' : 'Delete Account'}
                </Text>
              </Flex>
            </Button>
          </Flex>
        </Flex>
      </ScrollView>
    </Flex>
  );
}
