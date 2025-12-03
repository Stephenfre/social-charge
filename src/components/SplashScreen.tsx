import { View } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { Asset } from 'expo-asset';

const logoAsset = Asset.fromModule(require('../../assets/sc_logo.svg'));

export function SplashScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-[#0F1015]">
      <SvgUri uri={logoAsset.uri} width={200} height={200} />
    </View>
  );
}
