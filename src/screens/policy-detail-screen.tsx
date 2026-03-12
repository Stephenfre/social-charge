import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flex, Pressable, Text } from '~/components/ui';
import { policies } from '~/content/policies';
import { useRouteStack } from '~/types/navigation.types';

const SEPARATOR = '⸻';

export function PolicyDetailScreen() {
  const navigation = useNavigation();
  const { params } = useRouteStack<'Policy Detail'>();
  const policy = policies[params.policyId];

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
            {policy.title}
          </Text>
          <Text>{policy.summary}</Text>
        </Flex>

        <Text className="text-center text-2xl">{SEPARATOR}</Text>

        {policy.sections.map((section) => (
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
