import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CameraView, type BarcodeScanningResult } from 'expo-camera';
import { Buffer } from 'buffer';
import dayjs from 'dayjs';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '~/lib/supabase';
import { QUERY_KEYS } from '~/lib/keys';
import { useNavigationStack, useRouteStack } from '~/types/navigation.types';
import { Button, Flex, Text } from '~/components/ui';

type HostScannerScreenProps = {
  hostRunId?: string | null;
};

type QrPayload = {
  jti?: string;
  event_id?: string;
  eventId?: string;
};

const BARCODE_TYPES = ['qr', 'pdf417'] as const;

export function HostScannerScreen({ hostRunId = null }: HostScannerScreenProps) {
  const navigation = useNavigationStack<'ScanQrModal'>();
  const { params } = useRouteStack<'ScanQrModal'>();
  const queryClient = useQueryClient();

  const [scanning, setScanning] = useState(false);
  const [lastProcessedJti, setLastProcessedJti] = useState<string | null>(null);

  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processingRef = useRef(false);

  const idForRun = hostRunId ?? params?.runId ?? null;

  const closeScanner = () => navigation.goBack();

  useEffect(() => {
    return () => {
      if (cooldownRef.current) {
        clearTimeout(cooldownRef.current);
        cooldownRef.current = null;
      }
      processingRef.current = false;
    };
  }, []);

  const decodeJwtPayload = (segment: string): QrPayload => {
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = normalized.length % 4;
    const padded = normalized + (padLength ? '='.repeat(4 - padLength) : '');
    const decoded = Buffer.from(padded, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  };

  const handleBarCodeScanned = useCallback(
    async ({ data }: BarcodeScanningResult) => {
      if (processingRef.current) {
        return;
      }
      processingRef.current = true;

      try {
        const token = data?.trim();
        if (!token) {
          throw new Error('No token found in QR');
        }

        let jti: string | null = null;
        let eventIdFromPayload: string | null = null;
        try {
          const [, payloadB64] = token.split('.');
          if (payloadB64) {
            const payload = decodeJwtPayload(payloadB64);
            if (typeof payload?.jti === 'string') {
              jti = payload.jti;
            }
            if (typeof payload?.event_id === 'string') {
              eventIdFromPayload = payload.event_id;
            } else if (typeof payload?.eventId === 'string') {
              eventIdFromPayload = payload.eventId;
            }
          }
        } catch (err) {
          Alert.alert('Invalid QR', 'Could not read QR data. Please try again.');
          processingRef.current = false;
          return;
        }

        const eventIdForToken = eventIdFromPayload ?? idForRun ?? null;

        if (jti && lastProcessedJti === jti) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          Vibration.vibrate(100);
          processingRef.current = false;
          return;
        }

        if (!jti || !eventIdForToken) {
          Alert.alert('Invalid QR', 'Missing QR metadata. Ask the guest to refresh their code.');
          processingRef.current = false;
          return;
        }

        setScanning(true);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        const hostAccessToken = session?.access_token;
        if (!hostAccessToken) {
          throw new Error('Host not authenticated');
        }

        const res = await supabase.functions.invoke('consume-user-qr', {
          headers: { Authorization: `Bearer ${hostAccessToken}` },
          body: { jti, eventId: eventIdForToken },
        });

        if (res.error) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert('Check-in failed', res.error.message ?? 'Unable to check in player');
        } else {
          const scannedUserId = res.data?.checkedInUserId ?? res.data?.user_id ?? null;

          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Vibration.vibrate(100);
          Alert.alert('Checked in', 'Player successfully checked in');
          if (jti) {
            setLastProcessedJti(jti);
          }

          if (scannedUserId) {
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.runByUserId(scannedUserId) }),
              queryClient.refetchQueries({
                queryKey: QUERY_KEYS.runByUserId(scannedUserId),
                type: 'active',
              }),
            ]);
          }

          await Promise.all([
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.runById(idForRun) }),
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.waitlistByRun(idForRun) }),
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.isCheckedIn(idForRun) }),
          ]);

          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nextRuns });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.runs });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.runsWithPagination });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error scanning token';
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Vibration.vibrate(150);
        Alert.alert('Scan error', message);
      } finally {
        setScanning(false);
        cooldownRef.current = setTimeout(() => {
          processingRef.current = false;
        }, 1200);
      }
    },
    [idForRun, lastProcessedJti, queryClient]
  );

  const runWindow =
    params?.runStartTime && params?.runEndTime
      ? `${dayjs(params.runStartTime).format('h:mm A')} - ${dayjs(params.runEndTime).format(
          'h:mm A'
        )}`
      : null;

  return (
    <Flex flex justify="center" className="bg-background-dark px-4" align="center" gap={2}>
      <Flex align="center">
        <Text bold size="xl">
          Scan Player QR
        </Text>
        {params?.runTitle && <Text>{params.runTitle}</Text>}
        {params?.locationName && <Text>{params.locationName}</Text>}
        {runWindow && <Text>{runWindow}</Text>}
      </Flex>

      <Flex
        className="m-4 h-80 w-full overflow-hidden rounded-xl border bg-slate-300"
        justify="center">
        <CameraView
          onBarcodeScanned={scanning ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES }}
          style={styles.scanner}
        />
      </Flex>

      <Button
        size="xl"
        className="w-1/2"
        onPress={closeScanner}
        disabled={scanning}
        variant="outline">
        <Text bold size="xl">
          Close Camera
        </Text>
      </Button>
    </Flex>
  );
}

const styles = StyleSheet.create({
  scanner: { height: '100%', width: '100%', borderRadius: 12 },
});
