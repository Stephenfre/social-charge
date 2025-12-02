import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { Flex, Text, Pressable } from '~/components/ui';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '~/types/navigation';
import { ArrowLeft } from 'lucide-react-native';

const SEPARATOR = '⸻';

const sections: { title: string; body: string[] }[] = [
  {
    title: '1. Information We Collect',
    body: [
      'We collect account information (name, email, phone number, birth date, profile details), onboarding data (vibe preferences, day/time preferences, archetypes, group size), event data (RSVPs, check-ins, host settings, messages, reviews), content you submit (photos, messages, comments), payment and token history (processed securely via third parties), and support interactions.',
      'We also automatically collect device info, usage metrics, and location data (if permitted) for discovery, nearby venues, and safety features.',
      'We may receive data from payment processors, analytics tools, or verification providers.',
    ],
  },
  {
    title: '2. How We Use Your Information',
    body: [
      'We operate and improve the Service, personalize onboarding, recommend events, process RSVPs/tokens, support hosts, and display profiles.',
      'We protect safety by verifying identities, preventing fraud, and enforcing guidelines.',
      'We analyze usage to improve features, fix bugs, and communicate confirmations, reminders, token updates, or legal notices.',
      'We do NOT sell your personal data.',
    ],
  },
  {
    title: '3. QR Codes & Check-Ins',
    body: [
      'Events may use QR codes containing your user ID, event association, and temporary tokens. Scans validate RSVPs, track attendance, prevent fraud, and support safety. Do not share or duplicate your code.',
    ],
  },
  {
    title: '4. Tokens, Payments & Purchases',
    body: [
      'Payments are processed by PCI-compliant providers (Apple, Stripe, etc.). We store transaction IDs but not full card numbers. Token balances and purchases are stored securely on our servers.',
    ],
  },
  {
    title: '5. Sharing of Information',
    body: [
      'Hosts may see your name, profile photo, vibes, and check-in status; aggregated insights may be shared.',
      'Depending on settings, your profile can be visible to attendees; reviews are public to hosts/attendees.',
      'Service providers (cloud hosting, payments, analytics, messaging) may access data under strict privacy rules.',
      'We may disclose data to comply with law, protect safety, or prevent fraud. We never sell data to advertisers.',
    ],
  },
  {
    title: '6. Data Retention',
    body: [
      'We retain data while your account is active and as needed for legal, safety, and operational reasons. You may request deletion anytime.',
    ],
  },
  {
    title: '7. Data Security',
    body: [
      'We use encryption, access controls, security reviews, and best practices (including Supabase + edge functions) to protect data. No system is 100% secure, but we work to keep data safe.',
    ],
  },
  {
    title: '8. Your Rights',
    body: [
      'Depending on region, you can request access, correction, deletion, export, or restriction. Contact support@socialcharge.app.',
    ],
  },
  {
    title: '9. Children’s Privacy',
    body: ['The App is for users 18+. We do not knowingly collect data from minors.'],
  },
  {
    title: '10. Changes to This Policy',
    body: [
      'We may update this Privacy Policy. Significant changes will be communicated in the App. Continued use signifies acceptance.',
    ],
  },
  {
    title: '11. Contact Us',
    body: ['Questions? Email support@socialcharge.app.'],
  },
];

export function PrivacyPolicyScreen() {
  const navigation = useNavigation<NavigationProp<'Privacy'>>();
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
            Privacy Policy
          </Text>
          <Text>Last updated: January 1, 2025</Text>
          <Text>
            This Privacy Policy explains how Social Charge collects, uses, and protects your information when using the
            Service. By using the Service you agree to this Policy; otherwise, discontinue use.
          </Text>
        </Flex>

        <Text className="text-center text-2xl">{SEPARATOR}</Text>

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
            <Text className="text-center text-2xl">{SEPARATOR}</Text>
          </Flex>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
