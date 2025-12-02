import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { Flex, Text, Pressable } from '~/components/ui';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '~/types/navigation';
import { ArrowLeft } from 'lucide-react-native';

const SECTION_SEPARATOR = '⸻';

const sections: { title: string; body: string[] }[] = [
  {
    title: '1. Overview',
    body: [
      'Social Charge is a platform that helps people discover, join, and host social events. Features include event discovery, RSVP and check-ins, token purchases and redemptions, host and attendee reviews, messaging and notifications, and user profiles with personalized onboarding.',
      'Social Charge does not own or operate events. Event hosts are solely responsible for their events.',
    ],
  },
  {
    title: '2. Eligibility',
    body: [
      'To use Social Charge, you must be at least 18 years old, provide accurate account information, and not be prohibited from using the service under local laws.',
      'We may suspend or terminate accounts for any violation of these Terms.',
    ],
  },
  {
    title: '3. Accounts',
    body: [
      'You are responsible for maintaining the confidentiality of your account, all activity that occurs under your account, and updating inaccurate personal information.',
      'We reserve the right to refuse or cancel accounts at any time.',
    ],
  },
  {
    title: '4. Event Participation',
    body: [
      'By RSVP’ing or attending an event, you assume all risks, agree to behave respectfully, follow host or venue rules, and are responsible for your safety and belongings.',
      'Social Charge is not liable for injuries, disputes, damages, or issues arising from events or attendee interactions.',
    ],
  },
  {
    title: '5. Tokens & Payments',
    body: [
      'Some events require tokens to RSVP or participate. Tokens may be purchased in-app, earned through promotions, spent when joining an event, or refunded depending on event policy. All token purchases are final unless required by law.',
      'Refund eligibility is determined by app rules, event cancellation, host policy, and timing of your cancellation. Tokens have no cash value, cannot be withdrawn, and are only usable inside the App.',
    ],
  },
  {
    title: '6. Memberships',
    body: [
      'Paid plans may include additional monthly tokens, access to premium features, or priority access. Memberships automatically renew unless canceled before renewal.',
    ],
  },
  {
    title: '7. User Content',
    body: [
      'You may post reviews, messages, and photos. By posting, you grant Social Charge a nonexclusive license to use, display, and distribute this content to operate the platform.',
      'You may not post illegal content, harassment, hate speech, threats, spam, misleading content, obscene material, or IP-protected content you do not own. We may remove or moderate content at our discretion.',
    ],
  },
  {
    title: '8. Host Responsibilities',
    body: [
      'Hosts are solely responsible for their events’ safety, rules, and execution; must provide accurate information; must not host illegal or unsafe activities; and must not defraud or mislead users. Social Charge is not responsible for incidents occurring at hosted events.',
    ],
  },
  {
    title: '9. QR Code Check-Ins',
    body: [
      'Some events use QR codes for entry and attendance tracking. You agree not to share or duplicate your QR code, not to attempt fraudulent check-ins, and acknowledge hosts/admins may scan your code to verify RSVP. Misuse may result in suspension.',
    ],
  },
  {
    title: '10. Reviews & Ratings',
    body: [
      'Reviews must be honest and respectful. Fake or abusive reviews may be removed. Users may respond to or report reviews.',
    ],
  },
  {
    title: '11. Prohibited Conduct',
    body: [
      'You may not use Social Charge to engage in illegal conduct, harm other users, harass or stalk, hack/scrape/reverse engineer the App, create fraudulent accounts, or interfere with events.',
    ],
  },
  {
    title: '12. Termination',
    body: [
      'We may suspend or terminate accounts for violations, harmful behavior, or misuse of tokens, QR codes, or events. You may stop using the App at any time.',
    ],
  },
  {
    title: '13. Disclaimer of Warranties',
    body: [
      'The App is provided “as is” without warranties. We do not guarantee event quality or safety, platform availability, accuracy of event details, or an error-free experience.',
    ],
  },
  {
    title: '14. Limitation of Liability',
    body: [
      'To the fullest extent permitted by law, Social Charge is not liable for injuries, damages, misconduct of hosts/attendees, technical issues, or unauthorized account access.',
    ],
  },
  {
    title: '15. Changes to Terms',
    body: ['We may update these Terms at any time. Continued use of the App indicates acceptance of updated Terms.'],
  },
  {
    title: '16. Contact',
    body: ['Questions? Email support@socialcharge.app.'],
  },
];

export function TermsAndConditionsScreen() {
  const navigation = useNavigation<NavigationProp<'Terms'>>();
  return (
    <SafeAreaView className="flex-1 bg-background-dark">
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          className="mb-4 h-10 w-10 items-center justify-center rounded-full border border-white/20">
          <ArrowLeft size={18} color="#FFFFFF" />
        </Pressable>
        <Flex gap={2}>
          <Text size="4xl" bold>
            Terms & Conditions
          </Text>
          <Text>Last updated: January 1, 2025</Text>
          <Text>
            Welcome to Social Charge (“the App”). By creating an account or using any part of the App, you agree to the
            following Terms &amp; Conditions (“Terms”). If you do not agree to these Terms, do not use the App.
          </Text>
        </Flex>

        <Text className="text-center text-2xl">{SECTION_SEPARATOR}</Text>

        {sections.map((section) => (
          <Flex key={section.title} gap={2}>
            <Text size="xl" bold>
              {section.title}
            </Text>
            {section.body.map((paragraph, index) => (
              <Text key={`${section.title}-${index}`} className="text-gray-200">
                {paragraph}
              </Text>
            ))}
            <Text className="text-center text-2xl">{SECTION_SEPARATOR}</Text>
          </Flex>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
