import { Flex, Text } from '~/components/ui';

type OnboardingProgressProps = {
  currentStep: number;
  totalSteps?: number;
  label?: string;
};

export function OnboardingProgress({
  currentStep,
  totalSteps = 4,
  label,
}: OnboardingProgressProps) {
  const percent = Math.min(100, Math.max(0, (currentStep / totalSteps) * 100));

  return (
    <Flex gap={2} className="w-full">
      <Flex direction="row" justify="space-between" align="center">
        <Text className="text-gray-300"></Text>
        <Text className="text-gray-300">{label ?? `${currentStep} of ${totalSteps}`}</Text>
        <Text className="text-gray-400"></Text>
      </Flex>
      <Flex className="h-2 w-full rounded-full bg-white/10">
        <Flex className="h-full rounded-full bg-secondary" style={{ width: `${percent}%` }} />
      </Flex>
    </Flex>
  );
}
