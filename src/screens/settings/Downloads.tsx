import {View, Text, Image, Platform, TouchableOpacity, ActivityIndicator, Alert} from 'react-native';
import {PermissionService} from '../../lib/services/PermissionService';
import * as FileSystem from 'expo-file-system';
import {downloadFolder} from '../../lib/constants';
import * as VideoThumbnails from 'expo-video-thumbnails';
import React, {useState, useEffect} from 'react';
import {settingsStorage, downloadsStorage} from '../../lib/storage';
import useThemeStore from '../../lib/zustand/themeStore';
import * as RNFS from '@dr.pogodin/react-native-fs';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import RNReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {FlashList} from '@shopify/flash-list';
import LinearGradient from 'react-native-linear-gradient';
import {SafeAreaView} from 'react-native-safe-area-context';

// Define supported video extensions
const VIDEO_EXTENSIONS = [
  '.mp4',
  '.mov',
  '.avi',
  '.mkv',
  '.wmv',
  '.flv',
  '.webm',
  '.m4v',
];

const isVideoFile = (filename: string): boolean => {
  const extension = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return VIDEO_EXTENSIONS.includes(extension);
};

// Add this interface after the existing imports
interface MediaGroup {
  title: string;
  episodes: FileSystem.FileInfo[];
  thumbnail?: string;
  isMovie: boolean;
}

const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[\s.-]+/g, ' ') // normalize spaces, dots, and hyphens
    .replace(/[^\w\s]/g, '') // remove special characters
    .trim();
};

const getBaseName = (fileName: string): string => {
  let baseName = fileName
    .replace(/\.(mp4|mkv|avi|mov)$/i, '') // remove extension
    .replace(/(?:480p|720p|1080p|2160p|HEVC|x264|BluRay|WEB-DL|HDRip).*$/i, '') // remove quality tags
    .replace(/\[.*?\]/g, '') // remove bracketed text
    .replace(/\(.*?\)/g, '') // remove parenthesized text
    .replace(/(?:episode|ep)[\s-]*\d+/gi, '') // remove episode indicators
    .replace(/s\d{1,2}e\d{1,2}/gi, '') // remove SxxExx format
    .replace(/season[\s-]*\d+/gi, '') // remove season indicators
    .replace(/\s*-\s*\d+/, '') // remove trailing numbers
    .replace(/\s*\d+\s*$/, '') // remove ending numbers
    .trim();

  // Remove any remaining numbers at the end that might be episode numbers
  baseName = baseName.replace(/[\s.-]*\d+$/, '');

  return baseName;
};

const getEpisodeInfo = (
  fileName: string,
): {season: number; episode: number} => {
  // Try to match SxxExx format first
  let match = fileName.match(/s(\d{1,2})e(\d{1,2})/i);
  if (match) {
    return {season: parseInt(match[1], 10), episode: parseInt(match[2], 10)};
  }

  // Try to match "Season X Episode Y" format
  match = fileName.match(/season[\s.-]*(\d{1,2}).*?episode[\s.-]*(\d{1,2})/i);
  if (match) {
    return {season: parseInt(match[1], 10), episode: parseInt(match[2], 10)};
  }

  // Try to match episode number only
  match =
    fileName.match(/(?:episode|ep)[\s.-]*(\d{1,2})/i) ||
    fileName.match(/[\s.-](\d{1,2})(?:\s*$|\s*\.)/);

  if (match) {
    return {season: 1, episode: parseInt(match[1], 10)};
  }

  // Default case
  return {season: 1, episode: 0};
};

const Downloads = () => {
  const [files, setFiles] = useState<FileSystem.FileInfo[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const {primary} = useThemeStore(state => state);

  const [groupSelected, setGroupSelected] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Load files from the download folder on initial render
  useEffect(() => {
    const getFiles = async () => {
      setLoading(true);
      const granted = await PermissionService.requestStoragePermissions();
      if (granted) {
        try {
          const properPath =
            Platform.OS === 'android'
              ? `file://${downloadFolder}`
              : downloadFolder;

          const allFiles = await FileSystem.readDirectoryAsync(properPath);

          // Filter video files
          const videoFiles = allFiles.filter(file => isVideoFile(file));

          const filesInfo = await Promise.all(
            videoFiles.map(async file => {
              const filePath =
                Platform.OS === 'android'
                  ? `file://${downloadFolder}/${file}`
                  : `${downloadFolder}/${file}`;

              const fileInfo = await FileSystem.getInfoAsync(filePath);
              return fileInfo;
            }),
          );

          // Save files info to storage
          downloadsStorage.saveFilesInfo(filesInfo);
          setFiles(filesInfo);
          setLoading(false);
        } catch (error) {
          console.error('Error reading files:', error);
          setLoading(false);
        }
      }
    };
    getFiles();
  }, []);

  async function getThumbnail(file: FileSystem.FileInfo) {
    try {
      // Verify it's a video file before attempting to generate thumbnail
      const fileName = file.uri.split('/').pop();
      if (!fileName || !isVideoFile(fileName)) {
        return null;
      }

      const {uri} = await VideoThumbnails.getThumbnailAsync(file.uri, {
        time: 100000,
      });
      return uri;
    } catch (error) {
      console.log('error in getThumbnail:', error);
      return null;
    }
  }

  // Generate thumbnails for each file
  useEffect(() => {
    const getThumbnails = async () => {
      try {
        const thumbnailPromises = files.map(async file => {
          const thumbnail = await getThumbnail(file);
          if (thumbnail) {
            return {[file.uri]: thumbnail};
          }
          return null;
        });

        const thumbnailResults = await Promise.all(thumbnailPromises);
        const newThumbnails = thumbnailResults.reduce((acc, curr) => {
          return curr ? {...acc, ...curr} : acc;
        }, {});

        // Save thumbnails to storage and fix the type error by ensuring non-null
        if (newThumbnails) {
          downloadsStorage.saveThumbnails(newThumbnails);
        }
        setThumbnails(newThumbnails || {});
      } catch (error) {
        console.error('Error generating thumbnails:', error);
      }
    };

    if (files.length > 0) {
      getThumbnails();
    }
  }, [files]);

  // Load files and thumbnails from storage on initial render
  useEffect(() => {
    const cachedFiles = downloadsStorage.getFilesInfo();
    if (cachedFiles) {
      setFiles(cachedFiles);
    }

    const cachedThumbnails = downloadsStorage.getThumbnails();
    if (cachedThumbnails) {
      setThumbnails(cachedThumbnails);
    }
  }, []);

  const deleteFiles = async () => {
    try {
      // Process each file
      await Promise.all(
        groupSelected.map(async fileUri => {
          try {
            // Remove the 'file://' prefix for Android
            const path =
              Platform.OS === 'android'
                ? fileUri.replace('file://', '')
                : fileUri;

            const fileInfo = await FileSystem.getInfoAsync(fileUri);
            if (fileInfo.exists) {
              await RNFS.unlink(path);
            }
          } catch (error) {
            console.error(`Error deleting file ${fileUri}:`, error);
            throw error; // Re-throw to be caught by the outer try-catch
          }
        }),
      );

      // Update state after successful deletion
      const newFiles = files.filter(file => !groupSelected.includes(file.uri));
      setFiles(newFiles);
      setGroupSelected([]);
      setIsSelecting(false);

      // Optional: Show success message
    } catch (error) {
      console.error('Error deleting files:', error);
    }
  };

  // Add this function to group files by series name
  const groupMediaFiles = (): MediaGroup[] => {
    const groups: Record<string, MediaGroup> = {};

    // First pass: Group by normalized base name
    files.forEach(file => {
      const fileName = file.uri.split('/').pop() || '';
      const baseName = getBaseName(fileName);
      const normalizedBaseName = normalizeString(baseName);

      if (!groups[normalizedBaseName]) {
        groups[normalizedBaseName] = {
          title: baseName,
          episodes: [],
          thumbnail: thumbnails[file.uri],
          isMovie: true,
        };
      }
      groups[normalizedBaseName].episodes.push(file);
    });

    // Second pass: Determine if each group is a movie or series
    Object.values(groups).forEach(group => {
      const hasEpisodeIndicators = group.episodes.some(file => {
        const fileName = file.uri.split('/').pop() || '';
        return getEpisodeInfo(fileName).episode > 0;
      });

      group.isMovie = !(group.episodes.length > 1 || hasEpisodeIndicators);

      // Sort episodes by season and episode number if it's a series
      if (!group.isMovie) {
        group.episodes.sort((a, b) => {
          const aName = a.uri.split('/').pop() || '';
          const bName = b.uri.split('/').pop() || '';
          const aInfo = getEpisodeInfo(aName);
          const bInfo = getEpisodeInfo(bName);

          if (aInfo.season !== bInfo.season) {
            return aInfo.season - bInfo.season;
          }
          return aInfo.episode - bInfo.episode;
        });
      }
    });

    return Object.values(groups);
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <View className="flex-1">
      <View className="flex-row justify-between items-center mb-4 px-4 pt-4">
        <View className="h-8 w-32 bg-white/10 rounded-lg" />
        <View className="flex-row gap-4">
          <View className="h-8 w-8 bg-white/10 rounded-full" />
          <View className="h-8 w-8 bg-white/10 rounded-full" />
        </View>
      </View>
      <View className="flex-row flex-wrap px-2">
        {[...Array(6)].map((_, i) => (
          <View key={i} className="w-1/3 p-1">
            <View className="aspect-[2/3] bg-white/10 rounded-lg" />
          </View>
        ))}
      </View>
    </View>
  );

  // Improved empty state
  const EmptyState = () => (
    <View className="flex-1 justify-center items-center px-8">
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
        className="w-24 h-24 rounded-full items-center justify-center mb-6">
        <MaterialCommunityIcons
          name="download-outline"
          size={40}
          color="rgba(255,255,255,0.6)"
        />
      </LinearGradient>
      <Text className="text-white text-xl font-semibold mb-2">
        No Downloads Yet
      </Text>
      <Text className="text-gray-400 text-center text-sm leading-5">
        Your downloaded movies and series will appear here. Start watching to build your offline collection!
      </Text>
    </View>
  );

  // Error state
  const ErrorState = () => (
    <View className="flex-1 justify-center items-center px-8">
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={48}
        color="#ef4444"
        style={{marginBottom: 16}}
      />
      <Text className="text-white text-xl font-semibold mb-2">
        Unable to Load Downloads
      </Text>
      <Text className="text-gray-400 text-center text-sm leading-5 mb-6">
        Please check your storage permissions and try again.
      </Text>
      <TouchableOpacity
        className="bg-white/10 px-6 py-3 rounded-lg"
        onPress={() => {
          setLoading(true);
          // Re-trigger file loading
          const getFiles = async () => {
            const granted = await requestStoragePermission();
            if (granted) {
              try {
                const properPath =
                  Platform.OS === 'android'
                    ? `file://${downloadFolder}`
                    : downloadFolder;
                const allFiles = await FileSystem.readDirectoryAsync(properPath);
                const videoFiles = allFiles.filter(file => isVideoFile(file));
                const filesInfo = await Promise.all(
                  videoFiles.map(async file => {
                    const filePath =
                      Platform.OS === 'android'
                        ? `file://${downloadFolder}/${file}`
                        : `${downloadFolder}/${file}`;
                    const fileInfo = await FileSystem.getInfoAsync(filePath);
                    return fileInfo;
                  }),
                );
                downloadsStorage.saveFilesInfo(filesInfo);
                setFiles(filesInfo);
              } catch (error) {
                console.error('Error reading files:', error);
              }
            }
            setLoading(false);
          };
          getFiles();
        }}>
        <Text className="text-white font-medium">Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  // Improved media card
  const MediaCard = ({item}: {item: MediaGroup}) => (
    <TouchableOpacity
      className={`flex-1 m-1 rounded-xl overflow-hidden ${
        isSelecting && groupSelected.includes(item.episodes[0].uri)
          ? 'bg-blue-500/30 border-2 border-blue-400'
          : 'bg-white/5'
      }`}
      onLongPress={() => {
        if (settingsStorage.isHapticFeedbackEnabled()) {
          RNReactNativeHapticFeedback.trigger('effectTick', {
            enableVibrateFallback: true,
            ignoreAndroidSystemSettings: false,
          });
        }
        setGroupSelected(item.episodes.map(ep => ep.uri));
        setIsSelecting(true);
      }}
      onPress={() => {
        if (isSelecting) {
          if (settingsStorage.isHapticFeedbackEnabled()) {
            RNReactNativeHapticFeedback.trigger('effectTick', {
              enableVibrateFallback: true,
              ignoreAndroidSystemSettings: false,
            });
          }
          if (groupSelected.includes(item.episodes[0].uri)) {
            setGroupSelected(
              groupSelected.filter(f => f !== item.episodes[0].uri),
            );
          } else {
            setGroupSelected([...groupSelected, item.episodes[0].uri]);
          }
          if (
            groupSelected.length === 1 &&
            groupSelected[0] === item.episodes[0].uri
          ) {
            setIsSelecting(false);
            setGroupSelected([]);
          }
        } else {
          // Direct play for movies, navigate to episodes for series
          if (item.isMovie) {
            const file = item.episodes[0];
            const fileName = file.uri.split('/').pop() || '';
            navigation.navigate('Player', {
              episodeList: [{title: fileName, link: file.uri}],
              linkIndex: 0,
              type: '',
              directUrl: file.uri,
              primaryTitle: item.title,
              poster: {},
              providerValue: 'vega',
            });
          } else {
            navigation.navigate('TabStack', {
              screen: 'SettingsStack',
              params: {
                screen: 'WatchHistoryStack',
                params: {
                  screen: 'SeriesEpisodes',
                  params: {
                    episodes: item.episodes as any,
                    series: item.title,
                    thumbnails: thumbnails,
                  },
                },
              },
            });
          }
        }
      }}>
      <View className="relative aspect-[2/3]">
        {item.thumbnail ? (
          <Image
            source={{uri: item.thumbnail}}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            className="w-full h-full items-center justify-center">
            <MaterialCommunityIcons
              name="movie-outline"
              size={32}
              color="rgba(255,255,255,0.6)"
            />
          </LinearGradient>
        )}

        {/* Selection indicator */}
        {isSelecting && groupSelected.includes(item.episodes[0].uri) && (
          <View className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full items-center justify-center">
            <MaterialCommunityIcons
              name="check"
              size={16}
              color="white"
            />
          </View>
        )}

        {/* Play button overlay for movies */}
        {!item.isMovie && (
          <View className="absolute top-2 left-2">
            <View className="bg-black/60 px-2 py-1 rounded">
              <MaterialCommunityIcons
                name="layers"
                size={16}
                color="white"
              />
            </View>
          </View>
        )}

        {/* Movie indicator */}
        {item.isMovie && (
          <View className="absolute top-2 left-2">
            <View className="bg-black/60 px-2 py-1 rounded">
              <MaterialCommunityIcons
                name="movie"
                size={16}
                color="white"
              />
            </View>
          </View>
        )}

        {/* Bottom info overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          className="absolute bottom-0 left-0 right-0 p-2">
          <Text className="text-white text-sm font-medium" numberOfLines={2}>
            {item.title}
          </Text>
          {!item.isMovie && (
            <Text className="text-gray-300 text-xs">
              {item.episodes.length} episodes
            </Text>
          )}
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)', 'transparent']}
        className="px-4 py-4 border-b border-white/10">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-white">Downloads</Text>
            <Text className="text-gray-400 text-sm">
              {files.length} {files.length === 1 ? 'item' : 'items'}
            </Text>
          </View>

          <View className="flex-row items-center gap-3">
            {isSelecting && (
              <>
                <TouchableOpacity
                  className="p-2 bg-white/10 rounded-full"
                  onPress={() => {
                    setGroupSelected([]);
                    setIsSelecting(false);
                  }}>
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color={primary}
                  />
                </TouchableOpacity>

                {groupSelected.length > 0 && (
                  <TouchableOpacity
                    className="p-2 bg-red-500/20 rounded-full"
                    onPress={() => {
                      Alert.alert(
                        'Delete Files',
                        `Are you sure you want to delete ${groupSelected.length} ${groupSelected.length === 1 ? 'file' : 'files'}?`,
                        [
                          {text: 'Cancel', style: 'cancel'},
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: deleteFiles,
                          },
                        ],
                      );
                    }}>
                    <MaterialCommunityIcons
                      name="delete-outline"
                      size={24}
                      color="#ef4444"
                    />
                  </TouchableOpacity>
                )}
              </>
            )}

            {!isSelecting && files.length > 0 && (
              <TouchableOpacity
                className="p-2 bg-white/10 rounded-full"
                onPress={() => {
                  if (settingsStorage.isHapticFeedbackEnabled()) {
                    RNReactNativeHapticFeedback.trigger('effectTick', {
                      enableVibrateFallback: true,
                      ignoreAndroidSystemSettings: false,
                    });
                  }
                  setIsSelecting(true);
                }}>
                <MaterialCommunityIcons
                  name="select-multiple"
                  size={24}
                  color={primary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Selection mode indicator */}
        {isSelecting && (
          <View className="mt-3 bg-blue-500/20 px-3 py-2 rounded-lg">
            <Text className="text-blue-300 text-sm">
              {groupSelected.length} {groupSelected.length === 1 ? 'item' : 'items'} selected
            </Text>
          </View>
        )}
      </LinearGradient>

      {/* Content */}
      <View className="flex-1">
        {loading ? (
          <LoadingSkeleton />
        ) : files.length === 0 ? (
          <EmptyState />
        ) : (
          <FlashList
            data={groupMediaFiles()}
            numColumns={3}
            estimatedItemSize={180}
            contentContainerStyle={{padding: 8}}
            showsVerticalScrollIndicator={false}
            renderItem={({item}) => <MediaCard item={item} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default Downloads;
