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
import { Button, ButtonText } from '~/components/ui';
import { Text } from '~/components/ui/text';
import { supabase } from '~/lib/supabase';

export default function HomeScreen() {
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
  };
  return (
    <SafeAreaView>
      <Button onPress={logout}>
        <ButtonText>Logout</ButtonText>
      </Button>
    </SafeAreaView>
  );
}
