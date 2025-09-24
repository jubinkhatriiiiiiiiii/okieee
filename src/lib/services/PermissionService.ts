import {Platform, Alert} from 'react-native';
import {PermissionsAndroid} from 'react-native';
import notifee from '@notifee/react-native';
import {settingsStorage} from '../storage';

export class PermissionService {
  private static readonly PERMISSIONS_REQUESTED_KEY = 'permissions_requested';

  /**
   * Check if permissions have already been requested
   */
  static hasRequestedPermissions(): boolean {
    return settingsStorage.getBool(this.PERMISSIONS_REQUESTED_KEY, false);
  }

  /**
   * Mark permissions as requested
   */
  static markPermissionsRequested(): void {
    settingsStorage.setBool(this.PERMISSIONS_REQUESTED_KEY, true);
  }

  /**
   * Request notification permissions
   */
  static async requestNotificationPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        // For iOS, we need to use the iOS notification settings
        const settings = await notifee.requestPermission();
        return settings.authorizationStatus >= 1; // 1 = authorized, 2 = provisional
      } else {
        // For Android, request notification permission
        const settings = await notifee.requestPermission();
        return settings.authorizationStatus >= 1; // 1 = authorized, 2 = provisional
      }
    } catch (error) {
      console.warn('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Request storage permissions
   */
  static async requestStoragePermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version > 29) {
          // Android 11+ doesn't require storage permissions for app-specific directories
          return true;
        }

        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'Vega Movies needs access to your storage to download and save movies and series for offline viewing.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Storage Permission Required',
            'Please enable storage permission to download movies and series for offline viewing.',
            [
              {text: 'Cancel', style: 'cancel'},
              {text: 'Settings', onPress: () => this.requestStoragePermissions()},
            ]
          );
        }

        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // iOS handles storage permissions differently
        return true;
      }
    } catch (error) {
      console.warn('Error requesting storage permissions:', error);
      return false;
    }
  }

  /**
   * Request all permissions needed for the app
   */
  static async requestAllPermissions(): Promise<{
    notifications: boolean;
    storage: boolean;
  }> {
    if (this.hasRequestedPermissions()) {
      // Return cached permission status
      return {
        notifications: settingsStorage.getBool('notifications_granted', false),
        storage: settingsStorage.getBool('storage_granted', false),
      };
    }

    // Request permissions sequentially
    const notificationResult = await this.requestNotificationPermissions();
    const storageResult = await this.requestStoragePermissions();

    // Cache the results
    settingsStorage.setBool('notifications_granted', notificationResult);
    settingsStorage.setBool('storage_granted', storageResult);

    // Mark as requested
    this.markPermissionsRequested();

    return {
      notifications: notificationResult,
      storage: storageResult,
    };
  }

  /**
   * Show a welcome dialog explaining why permissions are needed
   */
  static showWelcomeDialog(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Welcome to unix Movies! 🎬',
        'To provide you with the best experience, we need a few permissions:\n\n' +
        '📱 Notifications: To notify you about download progress and new content\n' +
        '💾 Storage: To download and save movies for offline viewing\n\n' +
        'You can change these permissions anytime in your device settings.',
        [
          {
            text: 'Continue',
            onPress: () => resolve(true),
          },
          {
            text: 'Skip for Now',
            onPress: () => {
              this.markPermissionsRequested();
              resolve(false);
            },
            style: 'cancel',
          },
        ]
      );
    });
  }

  /**
   * Initialize permissions on first app launch
   */
  static async initializePermissions(): Promise<void> {
    try {
      if (this.hasRequestedPermissions()) {
        return;
      }

      // Show welcome dialog first
      const shouldContinue = await this.showWelcomeDialog();

      if (shouldContinue) {
        // Request all permissions
        const results = await this.requestAllPermissions();

        // Show results to user
        if (!results.notifications || !results.storage) {
          const missingPermissions = [];
          if (!results.notifications) missingPermissions.push('Notifications');
          if (!results.storage) missingPermissions.push('Storage');

          Alert.alert(
            'Some Permissions Denied',
            `The following permissions were denied: ${missingPermissions.join(', ')}\n\n` +
            'You can enable them later in your device settings for the full experience.',
            [{text: 'OK'}]
          );
        }
      }
    } catch (error) {
      console.warn('Error initializing permissions:', error);
    }
  }
}
