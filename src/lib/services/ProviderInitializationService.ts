import {extensionManager} from './ExtensionManager';
import {extensionStorage} from '../storage/extensionStorage';
import useContentStore from '../zustand/contentStore';

/**
 * Service to handle automatic provider installation and initialization
 */
export class ProviderInitializationService {
  private static instance: ProviderInitializationService;
  private initialized = false;

  static getInstance(): ProviderInitializationService {
    if (!ProviderInitializationService.instance) {
      ProviderInitializationService.instance = new ProviderInitializationService();
    }
    return ProviderInitializationService.instance;
  }

  /**
   * Initialize all providers automatically
   */
  async initializeAllProviders(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.log('Initializing provider system...');

      // Initialize extension manager
      await extensionManager.initialize();

      // Fetch latest manifest
      const availableProviders = await extensionManager.fetchManifest(true);

      console.log(`Found ${availableProviders.length} available providers`);

      // Get currently installed providers
      const installedProviders = extensionStorage.getInstalledProviders();

      // Install all providers that aren't already installed
      const providersToInstall = availableProviders.filter(
        provider => !installedProviders.some(installed => installed.value === provider.value)
      );

      if (providersToInstall.length > 0) {
        console.log(`Installing ${providersToInstall.length} new providers...`);

        // Install providers in parallel with a limit to avoid overwhelming the system
        const installPromises = providersToInstall.map(async (provider) => {
          try {
            await extensionManager.installProvider(provider);
            console.log(`Successfully installed: ${provider.display_name}`);
          } catch (error) {
            console.error(`Failed to install ${provider.display_name}:`, error);
          }
        });

        // Install in batches of 3 to avoid overwhelming the system
        const batchSize = 3;
        for (let i = 0; i < installPromises.length; i += batchSize) {
          const batch = installPromises.slice(i, i + batchSize);
          await Promise.allSettled(batch);
          // Small delay between batches
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Update content store with all installed providers
      const allInstalledProviders = extensionStorage.getInstalledProviders();
      useContentStore.getState().setInstalledProviders(allInstalledProviders);

      console.log(`Provider initialization complete. ${allInstalledProviders.length} providers ready.`);

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize providers:', error);
      throw error;
    }
  }

  /**
   * Check if providers are initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Reset initialization state (useful for testing)
   */
  reset(): void {
    this.initialized = false;
  }
}

export const providerInitializationService = ProviderInitializationService.getInstance();
