import { GluestackUIProvider } from '~/components/ui/gluestack-ui-provider';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import './global.css';
import { MainTabNavigator } from '~/navigation/MainTabNavigator';

export default function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <GluestackUIProvider>
          <MainTabNavigator />
        </GluestackUIProvider>
      </NavigationContainer>
    </QueryClientProvider>
  );
}
