import { Modal, Pressable, View } from 'react-native';
import { Button, Flex, Text } from '~/components/ui';
import { X } from 'lucide-react-native';

type OnboardingCompletionModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function OnboardingCompletionModal({ visible, onClose }: OnboardingCompletionModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/60 px-6">
        <Flex className="w-full rounded-3xl bg-background-dark p-6" gap={4}>
          <Flex direction="row" justify="flex-end">
            <Pressable onPress={onClose} accessibilityLabel="Close onboarding completion message">
              <X size={20} color="#fff" />
            </Pressable>
          </Flex>
          <Flex gap={3}>
            <Text size="4xl" bold>
              Awesome 🎉
            </Text>
            <Text className="text-gray-200">
              We've personalized your events feed to match your vibe. Get ready to meet amazing
              people and try new things!
            </Text>
            <Button className="mt-2 h-14 rounded-xl bg-primary" onPress={onClose}>
              <Text bold size="lg">
                Show Me My Events
              </Text>
            </Button>
          </Flex>
        </Flex>
      </View>
    </Modal>
  );
}
