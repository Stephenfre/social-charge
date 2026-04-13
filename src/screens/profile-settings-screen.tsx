import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Linking, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Sentry from '@sentry/react-native';
import { Box, Button, Flex, Pressable, Text } from '~/components/ui';
import { Icon } from '~/components/ui/icon';
import {
  Bug,
  Coins,
  FileText,
  Gem,
  Handshake,
  Lock,
  Plane,
  PhoneCall,
  ScrollText,
  ShieldAlert,
  Sparkles,
  User,
  Users,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { PolicyId } from '~/content/policies';
import { RootStackParamList } from '~/types/navigation.types';
import { supabase } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';
import { useRevenueCat } from '~/providers/RevenueCatProvider';

type SettingsSection = {
  title: string;
  items: {
    id: string | PolicyId;
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
      id: 'safety-harassment',
      label: 'Safety Center',
      description: 'Harassment reporting and member safety',
      icon: ShieldAlert,
      accentBg: '#FCE4EC',
      accentColor: '#C2185B',
    },
    {
      id: 'report-issue',
      label: 'Report a User / Issue',
      description: 'Quickly report a member, safety concern, or app issue',
      icon: Bug,
      accentBg: '#FFF7ED',
      accentColor: '#EA580C',
    },
    {
      id: 'contact-support',
      label: 'Contact Support',
      description: 'Reach the support team for account or app help',
      icon: Users,
      accentBg: '#E0F2FE',
      accentColor: '#0284C7',
    },
    {
      id: 'emergency-contact',
      label: 'Emergency / Safety Contact',
      description: 'Call emergency services or contact the safety team',
      icon: PhoneCall,
      accentBg: '#FEE2E2',
      accentColor: '#DC2626',
    },
    {
      id: 'travel-waiver',
      label: 'Travel Waiver',
      description: 'Trip risk and travel responsibility terms',
      icon: Plane,
      accentBg: '#F3E5F5',
      accentColor: '#8E24AA',
    },
    {
      id: 'event-participation',
      label: 'Event Agreement',
      description: 'Rules and obligations for attending events',
      icon: Handshake,
      accentBg: '#E0F2FE',
      accentColor: '#0284C7',
    },
    {
      id: 'code-of-conduct',
      label: 'Code of Conduct',
      description: 'Member behavior and community rules',
      icon: Users,
      accentBg: '#E8F5E9',
      accentColor: '#2E7D32',
    },
    {
      id: 'liability-waiver',
      label: 'Liability Waiver',
      description: 'Assumption of risk and release terms',
      icon: FileText,
      accentBg: '#FFF0EB',
      accentColor: '#F97316',
    },
    {
      id: 'refund-credit-policy',
      label: 'Refund & Credits',
      description: 'SB Credit refunds, expirations, and rollovers',
      icon: Coins,
      accentBg: '#FEF3C7',
      accentColor: '#CA8A04',
    },
    {
      id: 'privacy-policy',
      label: 'Privacy / Blocked Users',
      description: 'Review privacy details and blocked user guidance',
      icon: Lock,
      accentBg: '#E0E7FF',
      accentColor: '#4F46E5',
    },
    {
      id: 'terms-of-service',
      label: 'Terms of Service',
      description: 'Membership and platform terms',
      icon: ScrollText,
      accentBg: '#F3F4F6',
      accentColor: '#374151',
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
  const { session } = useAuth();
  const { isPro, presentPaywall, presentCustomerCenter, customerCenterEnabled } = useRevenueCat();
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const sections = useMemo<SettingsSection[]>(() => {
    const accountItems = [...ACCOUNT_BASE_ITEMS];

    if (isPro) {
      accountItems.unshift({
        id: 'manage-subscription',
        label: 'Manage Subscription',
        description: customerCenterEnabled
          ? 'Change or cancel your plan at any time'
          : 'Switch plans or renew your access',
        icon: Gem,
        accentBg: '#FFF0EB',
        accentColor: '#F97316',
      });
    }

    return [
      {
        title: 'Account',
        items: accountItems,
      },
      SUPPORT_SECTION,
    ];
  }, [customerCenterEnabled, isPro]);

  const handleManageSubscription = useCallback(async () => {
    if (customerCenterEnabled) {
      await presentCustomerCenter();
      return;
    }

    await presentPaywall();
  }, [customerCenterEnabled, presentCustomerCenter, presentPaywall]);

  const openUrl = useCallback(async (url: string, unavailableMessage: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert('Unavailable', unavailableMessage);
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      Sentry.captureException(error);
      Alert.alert('Unavailable', unavailableMessage);
    }
  }, []);

  const handleReportIssue = useCallback(() => {
    Alert.alert('Report a User / Issue', 'Choose the fastest way to reach our team.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report User',
        onPress: () => {
          const subject = encodeURIComponent('Social Charge user safety report');
          const body = encodeURIComponent(
            [
              'Please describe the member or safety issue:',
              '',
              'Who was involved:',
              '',
              'What happened:',
              '',
              'Where and when did it happen:',
            ].join('\n')
          );
          void openUrl(
            `mailto:safety@socialcharge.com?subject=${subject}&body=${body}`,
            'Mail is not available on this device. Email safety@socialcharge.com.'
          );
        },
      },
      {
        text: 'Report App Issue',
        onPress: () => {
          const subject = encodeURIComponent('Social Charge issue report');
          const body = encodeURIComponent(
            [
              'Please describe the issue you ran into:',
              '',
              'Steps to reproduce:',
              '',
              'Expected result:',
              '',
              'Actual result:',
            ].join('\n')
          );
          void openUrl(
            `mailto:support@socialcharge.app?subject=${subject}&body=${body}`,
            'Mail is not available on this device. Email support@socialcharge.app.'
          );
        },
      },
    ]);
  }, [openUrl]);

  const handleContactSupport = useCallback(() => {
    const subject = encodeURIComponent('Social Charge support request');
    const body = encodeURIComponent(
      [
        'How can we help?',
        '',
        'Account email:',
        '',
        'Issue or question:',
        '',
        'Additional details:',
      ].join('\n')
    );

    void openUrl(
      `mailto:support@socialcharge.app?subject=${subject}&body=${body}`,
      'Mail is not available on this device. Email support@socialcharge.app.'
    );
  }, [openUrl]);

  const handleEmergencyContact = useCallback(() => {
    Alert.alert(
      'Emergency / Safety Contact',
      'If you are in immediate danger, call 911. For urgent but non-emergency safety concerns, contact the Social Charge safety team.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Email Safety',
          onPress: () => {
            const subject = encodeURIComponent('Urgent safety concern');
            const body = encodeURIComponent(
              ['Please share what is happening and where you are located:', '', 'Details:'].join(
                '\n'
              )
            );
            void openUrl(
              `mailto:safety@socialcharge.com?subject=${subject}&body=${body}`,
              'Mail is not available on this device. Email safety@socialcharge.com.'
            );
          },
        },
        {
          text: 'Call 911',
          style: 'destructive',
          onPress: () =>
            void openUrl('tel:911', 'Phone calling is not available on this device.'),
        },
      ]
    );
  }, [openUrl]);

  const handleItemPress = useCallback(
    async (id: string) => {
      switch (id) {
        case 'manage-subscription':
          await handleManageSubscription();
          break;
        case 'report-issue':
          handleReportIssue();
          break;
        case 'contact-support':
          handleContactSupport();
          break;
        case 'emergency-contact':
          handleEmergencyContact();
          break;
        case 'profile':
          navigation.navigate('Update Profile');
          break;
        case 'onboarding':
          navigation.navigate('OnboardingStart', { editMode: true, returnToSettings: true });
          break;
        case 'new-users':
          navigation.navigate('New Users');
          break;
        case 'safety-harassment':
        case 'travel-waiver':
        case 'event-participation':
        case 'code-of-conduct':
        case 'liability-waiver':
        case 'refund-credit-policy':
        case 'privacy-policy':
        case 'terms-of-service':
          navigation.navigate('Policy Detail', { policyId: id });
          break;
        default:
          break;
      }
    },
    [
      handleContactSupport,
      handleEmergencyContact,
      handleManageSubscription,
      handleReportIssue,
      navigation,
    ]
  );

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const handleDeleteAccount = useCallback(async () => {
    const accessToken = session?.access_token;
    if (!accessToken) {
      Alert.alert('Delete account', 'You must be signed in to delete your account.');
      return;
    }

    try {
      setIsDeletingAccount(true);
      const { data, error } = await supabase.functions.invoke('delete-account', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (error) {
        throw error;
      }

      if (data?.status !== 'deleted') {
        throw new Error('Unable to delete your account.');
      }

      await supabase.auth.signOut();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong while deleting your account.';
      Alert.alert('Delete account failed', message);
    } finally {
      setIsDeletingAccount(false);
    }
  }, [session?.access_token]);

  const confirmDeleteAccount = useCallback(() => {
    if (isDeletingAccount) {
      return;
    }

    Alert.alert('Delete account', 'This permanently deletes your account and cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void handleDeleteAccount() },
    ]);
  }, [handleDeleteAccount, isDeletingAccount]);

  return (
    <Flex flex className="bg-background-dark">
      <ScrollView
        className="px-4 py-6"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}>
        <Flex justify="space-between" className="min-h-full">
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
          <Flex>
            <Button
              className="rounded-lg border-2 border-error-500 bg-background-dark"
              onPress={logout}>
              <Text className="text-error-500" bold>
                Logout
              </Text>
            </Button>
            <Button
              className="mt-3 rounded-lg bg-error-600"
              onPress={confirmDeleteAccount}
              disabled={isDeletingAccount}>
              <Text className="text-white" bold>
                {isDeletingAccount ? 'Deleting Account...' : 'Delete Account'}
              </Text>
            </Button>
          </Flex>
        </Flex>
      </ScrollView>
    </Flex>
  );
}
