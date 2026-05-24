/**
 * Image Utilities
 * Helper functions for image picking, camera, and manipulation
 */

import {Alert, Platform} from 'react-native';
// import ImagePicker from 'react-native-image-crop-picker';
// import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';

export interface ImagePickerOptions {
  width?: number;
  height?: number;
  cropping?: boolean;
  cropperCircleOverlay?: boolean;
  compressImageQuality?: number;
  mediaType?: 'photo' | 'video' | 'any';
  includeBase64?: boolean;
  multiple?: boolean;
}

export interface SelectedImage {
  path: string;
  uri: string;
  width: number;
  height: number;
  mime: string;
  size: number;
  base64?: string;
}

/**
 * Request camera permission
 */
export const requestCameraPermission = async (): Promise<boolean> => {
  // TODO: Wire up react-native-permissions when installed. Placeholder grants access.
  return true;
};

/**
 * Request photo library permission
 */
export const requestPhotoLibraryPermission = async (): Promise<boolean> => {
  // TODO: Wire up react-native-permissions when installed. Placeholder grants access.
  return true;
};

/**
 * Open camera to take a photo
 */
export const openCamera = async (
  options: ImagePickerOptions = {}
): Promise<SelectedImage | null> => {
  try {
    const hasPermission = await requestCameraPermission();

    if (!hasPermission) {
      Alert.alert(
        'Permission refusée',
        'Veuillez autoriser l\'accès à la caméra dans les paramètres de votre appareil.'
      );
      return null;
    }

    // TODO: Uncomment when react-native-image-crop-picker is installed
    /*
    const image = await ImagePicker.openCamera({
      width: options.width || 800,
      height: options.height || 800,
      cropping: options.cropping !== false,
      cropperCircleOverlay: options.cropperCircleOverlay || false,
      compressImageQuality: options.compressImageQuality || 0.8,
      mediaType: options.mediaType || 'photo',
      includeBase64: options.includeBase64 || false,
    });

    return {
      path: image.path,
      uri: Platform.OS === 'ios' ? image.path.replace('file://', '') : image.path,
      width: image.width,
      height: image.height,
      mime: image.mime,
      size: image.size,
      base64: image.data,
    };
    */

    // Placeholder response
    console.log('Camera opened with options:', options);
    return null;
  } catch (error: any) {
    if (error.code !== 'E_PICKER_CANCELLED') {
      console.error('Camera error:', error);
      Alert.alert('Erreur', 'Impossible d\'ouvrir la caméra');
    }
    return null;
  }
};

/**
 * Open image picker from gallery
 */
export const openImagePicker = async (
  options: ImagePickerOptions = {}
): Promise<SelectedImage | SelectedImage[] | null> => {
  try {
    const hasPermission = await requestPhotoLibraryPermission();

    if (!hasPermission) {
      Alert.alert(
        'Permission refusée',
        'Veuillez autoriser l\'accès à la galerie dans les paramètres de votre appareil.'
      );
      return null;
    }

    // TODO: Uncomment when react-native-image-crop-picker is installed
    /*
    if (options.multiple) {
      const images = await ImagePicker.openPicker({
        multiple: true,
        compressImageQuality: options.compressImageQuality || 0.8,
        mediaType: options.mediaType || 'photo',
        includeBase64: options.includeBase64 || false,
      });

      return images.map(image => ({
        path: image.path,
        uri: Platform.OS === 'ios' ? image.path.replace('file://', '') : image.path,
        width: image.width,
        height: image.height,
        mime: image.mime,
        size: image.size,
        base64: image.data,
      }));
    }

    const image = await ImagePicker.openPicker({
      width: options.width || 800,
      height: options.height || 800,
      cropping: options.cropping !== false,
      cropperCircleOverlay: options.cropperCircleOverlay || false,
      compressImageQuality: options.compressImageQuality || 0.8,
      mediaType: options.mediaType || 'photo',
      includeBase64: options.includeBase64 || false,
    });

    return {
      path: image.path,
      uri: Platform.OS === 'ios' ? image.path.replace('file://', '') : image.path,
      width: image.width,
      height: image.height,
      mime: image.mime,
      size: image.size,
      base64: image.data,
    };
    */

    // Placeholder response
    console.log('Image picker opened with options:', options);
    return null;
  } catch (error: any) {
    if (error.code !== 'E_PICKER_CANCELLED') {
      console.error('Image picker error:', error);
      Alert.alert('Erreur', 'Impossible d\'ouvrir la galerie');
    }
    return null;
  }
};

/**
 * Show image source selection (Camera or Gallery)
 */
export const showImageSourceSelector = (
  onImageSelected: (image: SelectedImage) => void,
  options: ImagePickerOptions = {}
): void => {
  Alert.alert(
    'Choisir une image',
    'Sélectionnez la source de l\'image',
    [
      {
        text: 'Prendre une photo',
        onPress: async () => {
          const image = await openCamera(options);
          if (image) {
            onImageSelected(image);
          }
        },
      },
      {
        text: 'Choisir depuis la galerie',
        onPress: async () => {
          const image = await openImagePicker(options);
          if (image && !Array.isArray(image)) {
            onImageSelected(image);
          }
        },
      },
      {
        text: 'Annuler',
        style: 'cancel',
      },
    ],
    {cancelable: true}
  );
};

/**
 * Compress image
 */
export const compressImage = async (
  imagePath: string,
  quality: number = 0.8
): Promise<string> => {
  try {
    // TODO: Implement image compression
    // You can use libraries like react-native-image-resizer
    console.log('Compressing image:', imagePath, 'with quality:', quality);
    return imagePath;
  } catch (error) {
    console.error('Image compression error:', error);
    return imagePath;
  }
};

/**
 * Resize image
 */
export const resizeImage = async (
  imagePath: string,
  width: number,
  height: number
): Promise<string> => {
  try {
    // TODO: Implement image resizing
    // You can use libraries like react-native-image-resizer
    console.log('Resizing image:', imagePath, 'to', width, 'x', height);
    return imagePath;
  } catch (error) {
    console.error('Image resize error:', error);
    return imagePath;
  }
};

/**
 * Convert image to base64
 */
export const imageToBase64 = async (imagePath: string): Promise<string | null> => {
  try {
    // TODO: Implement base64 conversion
    // You can use react-native-fs or similar library
    console.log('Converting image to base64:', imagePath);
    return null;
  } catch (error) {
    console.error('Base64 conversion error:', error);
    return null;
  }
};

/**
 * Create FormData for image upload
 */
export const createImageFormData = (
  image: SelectedImage,
  fieldName: string = 'image'
): FormData => {
  const formData = new FormData();

  formData.append(fieldName, {
    uri: Platform.OS === 'ios' ? image.uri.replace('file://', '') : image.uri,
    type: image.mime,
    name: `upload_${Date.now()}.${image.mime.split('/')[1]}`,
  } as any);

  return formData;
};

/**
 * Validate image size
 */
export const validateImageSize = (
  image: SelectedImage,
  maxSizeInMB: number = 5
): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return image.size <= maxSizeInBytes;
};

/**
 * Get image dimensions
 */
export const getImageDimensions = (
  uri: string
): Promise<{width: number; height: number}> => {
  return new Promise((resolve, reject) => {
    // TODO: Implement using Image.getSize
    /*
    Image.getSize(
      uri,
      (width, height) => resolve({width, height}),
      error => reject(error)
    );
    */
    resolve({width: 0, height: 0});
  });
};

/**
 * Calculate aspect ratio
 */
export const calculateAspectRatio = (width: number, height: number): number => {
  return width / height;
};

/**
 * Get cropped dimensions maintaining aspect ratio
 */
export const getCroppedDimensions = (
  originalWidth: number,
  originalHeight: number,
  targetAspectRatio: number
): {width: number; height: number} => {
  const originalAspectRatio = originalWidth / originalHeight;

  if (originalAspectRatio > targetAspectRatio) {
    // Image is wider than target
    const width = originalHeight * targetAspectRatio;
    return {width, height: originalHeight};
  } else {
    // Image is taller than target
    const height = originalWidth / targetAspectRatio;
    return {width: originalWidth, height};
  }
};

export default {
  requestCameraPermission,
  requestPhotoLibraryPermission,
  openCamera,
  openImagePicker,
  showImageSourceSelector,
  compressImage,
  resizeImage,
  imageToBase64,
  createImageFormData,
  validateImageSize,
  getImageDimensions,
  calculateAspectRatio,
  getCroppedDimensions,
};
