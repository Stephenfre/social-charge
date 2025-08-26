import { SafeAreaView } from 'react-native';
import { Button, ButtonText } from '~/components/ui';
import { supabase } from '~/lib/supabase';

export default function HomeScreen() {
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    console.log(error);
  };
  return (
    <SafeAreaView>
      <Button onPress={logout}>
        <ButtonText>Logout</ButtonText>
      </Button>
    </SafeAreaView>
  );
}
