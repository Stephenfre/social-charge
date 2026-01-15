import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Buffer } from 'buffer';
import dayjs from 'dayjs';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '~/lib/keys';
import { useNavigationStack, useRouteStack } from '~/types/navigation.types';
import { Button, Flex, Text } from '~/components/ui';
import { useHostCheckIn } from '~/hooks';

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
  const [permission, requestPermission] = useCameraPermissions();

  const [scanning, setScanning] = useState(false);
  const [lastProcessedJti, setLastProcessedJti] = useState<string | null>(null);

  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processingRef = useRef(false);
  const lastScanAtRef = useRef(0);

  const eventIdFromRoute = hostRunId ?? params?.runId ?? null;
  const { processScan } = useHostCheckIn();

  const scheduleReset = useCallback(() => {
    if (cooldownRef.current) {
      clearTimeout(cooldownRef.current);
    }
    cooldownRef.current = setTimeout(() => {
      processingRef.current = false;
      setScanning(false);
    }, 1200);
  }, []);

  const closeScanner = () => navigation.goBack();

  useEffect(() => {
    return () => {
      if (cooldownRef.current) {
        clearTimeout(cooldownRef.current);
        cooldownRef.current = null;
      }
      processingRef.current = false;
      setScanning(false);
    };
  }, []);

  useEffect(() => {
    if (!permission?.granted && permission?.canAskAgain) {
      requestPermission();
    }
  }, [permission?.granted, permission?.canAskAgain, requestPermission]);

  const decodeJwtPayload = useCallback((segment: string): QrPayload => {
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = normalized.length % 4;
    const padded = normalized + (padLength ? '='.repeat(4 - padLength) : '');
    const decoded = Buffer.from(padded, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  }, []);

  const handleBarCodeScanned = useCallback(
    async ({ data }: BarcodeScanningResult) => {
      const now = Date.now();
      if (now - lastScanAtRef.current < 900) {
        return;
      }
      lastScanAtRef.current = now;

      if (processingRef.current) {
        return;
      }
      processingRef.current = true;
      setScanning(true);

      try {
        const token = data?.trim();
        if (!token) {
          throw new Error('No token found in QR');
        }

        let jti: string | null = null;
        let eventIdFromPayload: string | null = null;

        try {
          const parsed = JSON.parse(token);
          if (parsed && typeof parsed === 'object') {
            if (typeof parsed.jti === 'string') jti = parsed.jti;
            if (typeof parsed.eventId === 'string') eventIdFromPayload = parsed.eventId;
            if (typeof parsed.event_id === 'string') eventIdFromPayload = parsed.event_id;
          }
        } catch {
          try {
            const [, payloadB64] = token.split('.');
            if (payloadB64) {
              const payload = decodeJwtPayload(payloadB64);
              if (typeof payload?.jti === 'string') jti = payload.jti;
              if (typeof payload?.event_id === 'string') eventIdFromPayload = payload.event_id;
              else if (typeof payload?.eventId === 'string') eventIdFromPayload = payload.eventId;
            }
          } catch {
            Alert.alert('Invalid QR', 'Could not read QR data. Please try again.');
            return;
          }
        }

        const eventIdForToken = eventIdFromPayload ?? eventIdFromRoute ?? null;

        if (jti && lastProcessedJti === jti) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          Vibration.vibrate(100);
          // user already checked; pause briefly before next scan in finally
          return;
        }

        if (!jti || !eventIdForToken) {
          Alert.alert('Invalid QR', 'Missing QR metadata. Ask the guest to refresh their code.');
          // no usable data; pause handled in finally
          return;
        }

        const res = await processScan({ jti, eventId: eventIdForToken });
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

          if (eventIdFromRoute) {
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.runById(eventIdFromRoute) }),
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.waitlistByRun(eventIdFromRoute) }),
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.isCheckedIn(eventIdFromRoute) }),
            ]);
          }

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
        scheduleReset();
      }
    },
    [decodeJwtPayload, eventIdFromRoute, lastProcessedJti, processScan, queryClient, scheduleReset]
  );

  const runWindow =
    params?.runStartTime && params?.runEndTime
      ? `${dayjs(params.runStartTime).format('h:mm A')} - ${dayjs(params.runEndTime).format(
          'h:mm A'
        )}`
      : null;

  if (!permission) {
    return (
      <Flex flex justify="center" align="center" className="bg-background-dark px-4">
        <Text size="lg" className="text-center">
          Checking camera permissions…
        </Text>
      </Flex>
    );
  }

  if (!permission.granted) {
    return (
      <Flex flex justify="center" align="center" className="bg-background-dark px-4">
        <Text size="xl" bold className="text-center">
          Camera access is required to scan QR codes.
        </Text>
        <Button
          onPress={requestPermission}
          className="mt-4 w-1/2 rounded-xl bg-primary"
          size="xl">
          <Text bold className="text-white">
            Enable Camera
          </Text>
        </Button>
        <Button variant="outline" className="mt-3 w-1/2" onPress={closeScanner}>
          <Text>Close</Text>
        </Button>
      </Flex>
    );
  }

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
          onMountError={(error) => {
            console.error('Camera mount error', error);
            Alert.alert('Camera error', 'Unable to start the camera. Please try again.');
          }}
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
