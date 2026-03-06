import { Image, View } from 'react-native';

export function SplashScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background-dark">
      <Image
        source={require('../../assets/splash.png')}
        style={{ width: 220, height: 220 }}
        resizeMode="contain"
      />
    </View>
  );
}
