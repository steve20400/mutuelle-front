import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { notificationRepository } from '@/src/api/repositories/notificationRepository';
import { useAuthStore } from '@/src/store/authStore';

// expo-notifications push distantes non supportées dans Expo Go depuis SDK 53.
// On détecte l'environnement pour ne pas planter dans Expo Go.
const IS_EXPO_GO =
  Constants.executionEnvironment === 'storeClient' ||
  Constants.executionEnvironment === 'standalone';

if (!IS_EXPO_GO) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function registerForPushNotifications(): Promise<void> {
  if (IS_EXPO_GO) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Mutuelle',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    await notificationRepository.registerToken({ token: tokenData.data });
  } catch (err) {
    console.warn('Push token registration skipped:', err);
  }
}

interface Props {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: Props) {
  const { isAuthenticated } = useAuthStore();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const foregroundSub = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const responseSub = useRef<any>(null);

  useEffect(() => {
    if (isAuthenticated) {
      registerForPushNotifications();
    }

    if (!IS_EXPO_GO) {
      foregroundSub.current = Notifications.addNotificationReceivedListener(
        (notification) => {
          console.log('Notification recue:', notification.request.content.title);
        }
      );

      responseSub.current = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const data = response.notification.request.content.data;
          console.log('Notification cliquee, data:', data);
        }
      );
    }

    return () => {
      foregroundSub.current?.remove();
      responseSub.current?.remove();
    };
  }, [isAuthenticated]);

  return <>{children}</>;
}
