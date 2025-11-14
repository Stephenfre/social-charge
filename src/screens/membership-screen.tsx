import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Dimensions,
  StyleSheet,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Box, Button, Flex, Text } from '~/components/ui';
import { Icon } from '~/components/ui/icon';
import {
  BadgePercent,
  CakeSlice,
  Coffee,
  Gift,
  Ticket,
  type LucideIcon,
} from 'lucide-react-native';
import { useAuth } from '~/providers/AuthProvider';

/* ----------------------------- TYPES ----------------------------- */
type Benefit = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accentBg: string;
  accentColor: string;
};

type Tier = {
  id: 'basic' | 'plus' | 'gold';
  title: string;
  tag: string;
  cardColor: string;
  gradientColors: readonly [string, string, ...string[]];
  textColor: string;
  shadowColor: string;
  benefits: Benefit[];
};

/* ----------------------- TIER DATA (per-card) -------------------- */
const membershipTiers: Tier[] = [
  {
    id: 'basic',
    title: 'Basic',
    tag: 'STAR',
    cardColor: '#FFFFFF',
    gradientColors: ['#FFFFFF', '#F5F5F5', '#FFFFFF'] as const,
    textColor: '#000',
    shadowColor: '#A3A3A3',
    benefits: [
      {
        id: 'roll',
        title: 'Free cinnamon roll',
        description: 'Get one cinnamon roll free on orders above $12',
        icon: CakeSlice,
        accentBg: '#FEE3D2',
        accentColor: '#E84A1D',
      },
      {
        id: 'delivery',
        title: '25% delivery fee',
        description: 'Pay 25% less on delivery fees',
        icon: Ticket,
        accentBg: '#FFEBDC',
        accentColor: '#EB6924',
      },
      {
        id: 'points',
        title: 'Weekend 1.5x points',
        description: 'Earn 1.5x points on weekend purchases',
        icon: BadgePercent,
        accentBg: '#FFEFE0',
        accentColor: '#E47A1C',
      },
    ],
  },
  {
    id: 'plus',
    title: 'Plus',
    tag: 'PLUS',
    cardColor: '#D9D9DE',
    gradientColors: ['#9E9EA5', '#E3E3EA', '#9E9EA5'] as const,
    textColor: '#fff',
    shadowColor: '#9CA3AF',
    benefits: [
      {
        id: 'drink',
        title: 'Monthly drink on us',
        description: 'Enjoy any handcrafted drink once a month',
        icon: Coffee,
        accentBg: '#FEE4D1',
        accentColor: '#D4491B',
      },
      {
        id: 'delivery_half',
        title: '50% delivery fee',
        description: 'Only pay half of delivery fees online',
        icon: Ticket,
        accentBg: '#FFEBDC',
        accentColor: '#EB6924',
      },
      {
        id: 'bday',
        title: 'Birthday perks',
        description: 'Special gift during your birthday week',
        icon: Gift,
        accentBg: '#FFE7E0',
        accentColor: '#EE5A4F',
      },
    ],
  },
  {
    id: 'gold',
    title: 'Gold',
    tag: 'GLD',
    cardColor: '#f59e0b',
    gradientColors: ['#8C6400', '#D8B94C', '#8C6400'] as const,
    textColor: '#fff',
    shadowColor: '#F59E0B',
    benefits: [
      {
        id: 'roll_plus',
        title: '2× pastry perks',
        description: '2 free pastries on orders above $15',
        icon: CakeSlice,
        accentBg: '#FEE3D2',
        accentColor: '#B63A14',
      },
      {
        id: 'delivery_free',
        title: 'Free delivery',
        description: 'Zero delivery fee on all online orders',
        icon: Ticket,
        accentBg: '#FFEBDC',
        accentColor: '#9E4F1C',
      },
      {
        id: 'points_2x',
        title: '2× points all weekend',
        description: 'Earn double points every weekend',
        icon: BadgePercent,
        accentBg: '#FFEFE0',
        accentColor: '#9C5F0F',
      },
    ],
  },
];

/* ----------------------------- LAYOUT ---------------------------- */
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.round(SCREEN_WIDTH * 0.8);
const CARD_HEIGHT = 260;
const CARD_SPACING = 20;
const INTERVAL = CARD_WIDTH + CARD_SPACING;
// center active card with neighbors peeking
const SIDE_INSET = (SCREEN_WIDTH - CARD_WIDTH) / 2;

/* ------------------------------ SCREEN --------------------------- */
export function MembershipScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [activeIndex, setActiveIndex] = useState(0);

  // Animated scroll value to smoothly scale the card in view
  const scrollX = useRef(new Animated.Value(0)).current;

  // Helpful on some Android devices in addition to snapToInterval
  const snapToOffsets = useMemo(() => membershipTiers.map((_, i) => i * INTERVAL), []);

  const handleSnapEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / INTERVAL);
    setActiveIndex(Math.max(0, Math.min(idx, membershipTiers.length - 1)));
  };

  const activeTier = membershipTiers[activeIndex];

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0C10' }}>
      {/* Cards (Animated.ScrollView) */}
      <View style={{ flex: 1, paddingTop: 24 }}>
        <Animated.ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          // keep neighbors visible and align the first card centered
          contentContainerStyle={{ paddingHorizontal: SIDE_INSET }}
          // snap like pages between cards
          snapToInterval={INTERVAL}
          snapToAlignment="start"
          decelerationRate="fast"
          snapToOffsets={snapToOffsets}
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleSnapEnd}
          onScrollEndDrag={handleSnapEnd}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: true,
          })}>
          {membershipTiers.map((item, index) => {
            // Because we padded LEFT with SIDE_INSET, centers align to 0, INTERVAL, 2*INTERVAL...
            const inputRange = [(index - 1) * INTERVAL, index * INTERVAL, (index + 1) * INTERVAL];

            const scale = scrollX.interpolate({
              inputRange,
              outputRange: [0.9, 1.05, 0.9],
              extrapolate: 'clamp',
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.85, 1, 0.85],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={item.id}
                style={{
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                  marginRight: index === membershipTiers.length - 1 ? 0 : CARD_SPACING,
                  transform: [{ scale }],
                  opacity,
                }}>
                <GlowCard
                  width={CARD_WIDTH}
                  height={CARD_HEIGHT}
                  gradientColors={item.gradientColors}
                  glowColor={item.shadowColor}>
                  <Flex flex justify="space-between">
                    <Flex>
                      <Text className="text-3xl font-extrabold" style={{ color: item.textColor }}>
                        {item.title}
                      </Text>
                      <Flex
                        className="mb-4 mt-2 h-1 rounded-full"
                        style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
                      />
                    </Flex>

                    <Flex>
                      <Text
                        size="2xl"
                        className="mt-2"
                        weight="600"
                        style={{ color: item.textColor }}>
                        {user?.first_name} {user?.last_name}
                      </Text>

                      <Text size="md" bold style={{ color: item.textColor }}>
                        Membership Since: November 2025
                      </Text>
                    </Flex>
                  </Flex>
                </GlowCard>
              </Animated.View>
            );
          })}
        </Animated.ScrollView>
      </View>

      {/* Bottom sheet shows ACTIVE CARD benefits */}
      <BottomSheet
        index={0}
        ref={undefined} // optional; you can keep a ref if you plan to control it
        // Percentages ensure correct height relative to its parent (full-screen root)
        snapPoints={['60%']}
        enableOverDrag={false}
        enablePanDownToClose={false}
        topInset={insets.top}
        // bottomInset={insets.bottom}
        handleIndicatorStyle={{ backgroundColor: 'transparent' }}
        backgroundStyle={{ backgroundColor: '#18191f', borderRadius: 32 }}>
        <BottomSheetView style={{ paddingHorizontal: 24 }}>
          <Text className="mb-4 text-2xl font-bold">Benefits — {activeTier.title}</Text>
          <Flex gap={8}>
            {activeTier.benefits.map((benefit) => (
              <Flex key={benefit.id} direction="row" align="center" gap={4}>
                <Box
                  className="h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: benefit.accentBg }}>
                  <Icon as={benefit.icon} size="lg" style={{ color: benefit.accentColor }} />
                </Box>
                <Flex className="flex-1" gap={1}>
                  <Text size="lg" bold>
                    {benefit.title}
                  </Text>
                  <Text size="md">{benefit.description}</Text>
                </Flex>
              </Flex>
            ))}
          </Flex>
          <Flex gap={6} className="mb-4 mt-24">
            <Button size="xl">
              <Text size="lg" bold>
                Become A Member
              </Text>
            </Button>
            <Button size="xl" variant="outline" className="bg-transparent">
              <Text size="lg" bold>
                Cancel Membership
              </Text>
            </Button>
          </Flex>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

/* ------------------------------ GlowCard ------------------------- */
function GlowCard({
  children,
  width,
  height,
  gradientColors,
  glowColor,
}: {
  children: React.ReactNode;
  width: number;
  height: number;
  gradientColors: readonly [string, string, ...string[]];
  glowColor: string;
}) {
  return (
    <View style={[styles.cardOuter, { width, height }]}>
      {/* behind-glow */}
      <View pointerEvents="none" style={styles.glowStack}>
        <View style={[styles.glowIOS, { shadowColor: glowColor, backgroundColor: glowColor }]} />
      </View>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientWrapper, { width, height }]}>
        <Box style={[styles.cardBase]}>{children}</Box>
      </LinearGradient>
    </View>
  );
}

/* -------------------------------- STYLES -------------------------- */
const styles = StyleSheet.create({
  cardOuter: { position: 'relative', overflow: 'visible', paddingTop: 16 },
  glowStack: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  glowIOS: { position: 'absolute', borderRadius: 36, shadowOpacity: 0.15, shadowRadius: 15 },
  gradientWrapper: { borderRadius: 36, padding: 3, overflow: 'hidden' },
  cardBase: { zIndex: 1, flex: 1, borderRadius: 30, padding: 24 },
});
