import { ActivityIndicator, ImageBackground, View } from 'react-native';

type SplashScreenProps = {
  showSpinner?: boolean;
};

export function SplashScreen({ showSpinner = false }: SplashScreenProps) {
  return (
    <ImageBackground
      source={require('../../assets/splash.png')}
      resizeMode="contain"
      style={{
        flex: 1,
        backgroundColor: '#0F1012',
      }}>
      {showSpinner ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 72,
            alignItems: 'center',
          }}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      ) : null}
    </ImageBackground>
  );
}
