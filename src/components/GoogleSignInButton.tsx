import { useState } from 'react';
import { Text, Flex, Button } from '~/components/ui';
import { useAuth } from '~/providers/AuthProvider';

export function GoogleSignInButton() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPress = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const result = await signInWithGoogle();
      if (result.cancelled) {
        setError(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex>
      {/* <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Sign in with Google"
        className="bg-white">
        {loading ? (
          <ActivityIndicator color="#111827" />
        ) : (
          <>
            <FontAwesome name="google" size={18} color="#4285F4" />
            <Text className="text-base font-medium text-typography-dark">Continue with Google</Text>
          </>
        )}
      </Pressable> */}
      <Button className="h-14 w-full rounded-xl bg-white" onPress={onPress}>
        <Text size="lg" weight="600" className="text-typography-dark">
          Continue with Google
        </Text>
      </Button>

      {!!error && <Text className="text-sm text-error-500">{error}</Text>}
    </Flex>
  );
}
