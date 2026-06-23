import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

interface Permissions {
  camera: 'granted' | 'denied' | 'undetermined';
  gallery: 'granted' | 'denied' | 'undetermined';
  mediaLibrary: 'granted' | 'denied' | 'undetermined';
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<Permissions>({
    camera: 'undetermined',
    gallery: 'undetermined',
    mediaLibrary: 'undetermined',
  });

  useEffect(() => {
    checkAll();
  }, []);

  const checkAll = async () => {
    const [camera, gallery, media] = await Promise.all([
      ImagePicker.getCameraPermissionsAsync(),
      ImagePicker.getMediaLibraryPermissionsAsync(),
      MediaLibrary.getPermissionsAsync(),
    ]);
    setPermissions({
      camera: camera.status,
      gallery: gallery.status,
      mediaLibrary: media.status,
    });
  };

  const requestCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    setPermissions((p) => ({ ...p, camera: status }));
    return status === 'granted';
  };

  const requestGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setPermissions((p) => ({ ...p, gallery: status }));
    return status === 'granted';
  };

  const requestMediaLibrary = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    setPermissions((p) => ({ ...p, mediaLibrary: status }));
    return status === 'granted';
  };

  return {
    permissions,
    hasCamera: permissions.camera === 'granted',
    hasGallery: permissions.gallery === 'granted',
    hasMediaLibrary: permissions.mediaLibrary === 'granted',
    requestCamera,
    requestGallery,
    requestMediaLibrary,
    recheckAll: checkAll,
  };
}
