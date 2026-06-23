import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

interface UseImagePickerResult {
  pickFromGallery: () => Promise<string | null>;
  pickFromCamera: () => Promise<string | null>;
  isLoading: boolean;
}

export function useImagePicker(): UseImagePickerResult {
  const [isLoading, setIsLoading] = useState(false);

  const requestPermission = async (type: 'camera' | 'gallery') => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera Access Needed', 'Please allow camera access in your device settings to take photos.');
        return false;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Gallery Access Needed', 'Please allow photo library access in your device settings.');
        return false;
      }
    }
    return true;
  };

  const pickFromGallery = async (): Promise<string | null> => {
    const hasPermission = await requestPermission('gallery');
    if (!hasPermission) return null;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const pickFromCamera = async (): Promise<string | null> => {
    const hasPermission = await requestPermission('camera');
    if (!hasPermission) return null;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { pickFromGallery, pickFromCamera, isLoading };
}
