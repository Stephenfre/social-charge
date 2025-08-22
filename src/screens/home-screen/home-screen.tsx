import { useNavigation } from '@react-navigation/native';
import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  View,
} from 'react-native';
import { Text } from '~/components/ui/text';

export default function HomeScreen() {
  return (
    <SafeAreaView className="bg-white">
      <Text size="5xl" weight="700" className="p-4 text-black">
        Home
      </Text>
    </SafeAreaView>
  );
}
