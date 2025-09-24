import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {MMKVLoader} from 'react-native-mmkv-storage';
import {extensionStorage, ProviderExtension} from '../storage/extensionStorage';

const storage = new MMKVLoader().initialize();

export interface Content {
  // Multi-provider system - no single provider selection
  installedProviders: ProviderExtension[];
  availableProviders: ProviderExtension[];
  setInstalledProviders: (providers: ProviderExtension[]) => void;
  setAvailableProviders: (providers: ProviderExtension[]) => void;

  // Legacy provider field for backward compatibility (will be removed)
  provider: ProviderExtension;
  setProvider: (type: ProviderExtension) => void;
  activeExtensionProvider: ProviderExtension | null;
  setActiveExtensionProvider: (provider: ProviderExtension | null) => void;

  // Multi-provider helpers
  getAllProviderValues: () => string[];
  getActiveProviders: () => ProviderExtension[];
}

const useContentStore = create<Content>()(
  persist(
    (set, get) => ({
      installedProviders: extensionStorage
        .getInstalledProviders()
        .sort((a, b) => a.display_name.localeCompare(b.display_name)),
      availableProviders: [],

      // Legacy provider field - keeping for backward compatibility
      provider: {
        value: '',
        display_name: '',
        type: 'global',
        installed: false,
        disabled: false,
        version: '0.0.1',
        icon: '',
        installedAt: 0,
        lastUpdated: 0,
      },
      activeExtensionProvider: null,

      setProvider: (provider: ProviderExtension) => set({provider}),

      setInstalledProviders: (providers: ProviderExtension[]) =>
        set({
          installedProviders: providers.sort((a, b) =>
            a.display_name.localeCompare(b.display_name),
          ),
        }),

      setAvailableProviders: (providers: ProviderExtension[]) =>
        set({availableProviders: providers}),

      setActiveExtensionProvider: (provider: ProviderExtension | null) =>
        set({activeExtensionProvider: provider}),

      // Multi-provider helpers
      getAllProviderValues: () => {
        const { installedProviders } = get();
        return installedProviders.map(p => p.value);
      },

      getActiveProviders: () => {
        const { installedProviders } = get();
        // For now, all installed providers are considered active
        // This can be extended later to support disabling specific providers
        return installedProviders;
      },
    }),
    {
      name: 'content-storage',
      storage: createJSONStorage(() => storage as any),
      partialize: state => ({
        provider: state.provider,
        activeExtensionProvider: state.activeExtensionProvider,
      }),
    },
  ),
);

export default useContentStore;
