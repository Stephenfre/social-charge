import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import { Button, Text } from '~/components/ui';
import { isAppleSignInAvailable } from '~/auth/apple';
import { useAuth } from '~/providers/AuthProvider';

export function AppleOauth() {
  const { signInWithApple } = useAuth();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAvailability = async () => {
      try {
        const available = await isAppleSignInAvailable();
        if (isMounted) {
          setIsAvailable(available);
        }
      } finally {
        if (isMounted) {
          setIsCheckingAvailability(false);
        }
      }
    };

    void checkAvailability();

    return () => {
      isMounted = false;
    };
  }, []);

  const onPress = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const result = await signInWithApple();
      if (result.cancelled) return;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Apple Sign In failed.';
      Alert.alert('Apple Sign In', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingAvailability || !isAvailable) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        style={styles.button}
        onPress={onPress}
      /> */}
      {Platform.OS === 'ios' ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={12}
          style={{ height: 48, width: '100%', opacity: isSubmitting ? 0.6 : 1 }}
          onPress={onPress}
        />
      ) : (
        <Button
          className="h-14 w-full rounded-xl bg-black"
          size="xl"
          onPress={onPress}
          disabled={isSubmitting}>
          <Text size="lg" weight="600" className="text-white">
            Continue with Apple
          </Text>
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  button: {
    width: '100%',
    height: 52,
  },
});
