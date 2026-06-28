import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '@components/ui/SolidGradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useProjectStore } from '../../store/projectStore';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

export default function CreateScreen() {
  const user = useAuthStore((s) => s.user);
  const createProject = useProjectStore((s) => s.createProject);
  const [showPicker, setShowPicker] = useState(true);

  const processAsset = (asset: ImagePicker.ImagePickerAsset) => {
    if (user) {
      const project = createProject({
        userId: user.id,
        imageUri: asset.uri,
        width: asset.width ?? 0,
        height: asset.height ?? 0,
        fileSize: asset.fileSize ?? 0,
      });
      router.replace({ pathname: '/editor', params: { id: project.id } });
    } else {
      router.replace('/(auth)/login');
    }
  };

  const openCamera = async (cameraType: ImagePicker.CameraType) => {
    // Ask camera permission first
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Gweno Editor Pro needs access to your camera to take photos for editing. Please grant camera permission in your device settings.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => router.back() },
          { text: 'Open Gallery Instead', onPress: () => openGallery() },
        ]
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
      cameraType,
    });

    if (result.canceled || !result.assets?.length) {
      router.back();
      return;
    }
    processAsset(result.assets[0]);
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Gallery Permission Required',
        'Gweno Editor Pro needs access to your photo library to select photos for editing.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 1,
    });

    if (result.canceled || !result.assets?.length) {
      router.back();
      return;
    }
    processAsset(result.assets[0]);
  };

  if (!showPicker) {
    return <View style={styles.bg} />;
  }

  return (
    <View style={styles.bg}>
      <LinearGradient
        colors={['rgba(10,10,15,0.0)', 'rgba(10,10,15,0.98)']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={28} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.content}>
          <LinearGradient colors={Colors.gradients.primary} style={styles.iconRing}>
            <Ionicons name="camera" size={36} color={Colors.white} />
          </LinearGradient>
          <Text style={styles.heading}>Add a Photo</Text>
          <Text style={styles.sub}>Choose how you want to add your photo</Text>

          <View style={styles.options}>
            {/* Back Camera */}
            <TouchableOpacity
              style={styles.optionCard}
              activeOpacity={0.85}
              onPress={() => openCamera(ImagePicker.CameraType.back)}
            >
              <LinearGradient colors={Colors.gradients.primary} style={styles.optionIcon}>
                <Ionicons name="camera" size={26} color={Colors.white} />
              </LinearGradient>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Back Camera</Text>
                <Text style={styles.optionDesc}>Take a photo with rear camera</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
            </TouchableOpacity>

            {/* Selfie / Front Camera */}
            <TouchableOpacity
              style={styles.optionCard}
              activeOpacity={0.85}
              onPress={() => openCamera(ImagePicker.CameraType.front)}
            >
              <LinearGradient colors={['#EC4899', '#8B5CF6']} style={styles.optionIcon}>
                <Ionicons name="person" size={26} color={Colors.white} />
              </LinearGradient>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Selfie Camera</Text>
                <Text style={styles.optionDesc}>Take a selfie with front camera</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
            </TouchableOpacity>

            {/* Gallery */}
            <TouchableOpacity
              style={styles.optionCard}
              activeOpacity={0.85}
              onPress={openGallery}
            >
              <LinearGradient colors={['#10B981', '#0EA5E9']} style={styles.optionIcon}>
                <Ionicons name="images" size={26} color={Colors.white} />
              </LinearGradient>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Photo Gallery</Text>
                <Text style={styles.optionDesc}>Choose from your files and albums</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.dark.background },
  safe: { flex: 1 },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 16,
    margin: 8,
    backgroundColor: Colors.dark.card,
    borderRadius: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  heading: {
    fontSize: Layout.fontSize['2xl'],
    fontFamily: 'Poppins_700Bold',
    color: Colors.white,
    textAlign: 'center',
  },
  sub: {
    fontSize: Layout.fontSize.base,
    fontFamily: 'Poppins_400Regular',
    color: Colors.text.muted,
    textAlign: 'center',
    marginBottom: 16,
  },
  options: { width: '100%', gap: 12 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.dark.card,
    borderRadius: Layout.radius.lg,
    padding: 16,
    borderWidth: 0.5,
    borderColor: Colors.dark.border,
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1 },
  optionTitle: {
    fontSize: Layout.fontSize.base,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.text.primary,
  },
  optionDesc: {
    fontSize: Layout.fontSize.xs,
    fontFamily: 'Poppins_400Regular',
    color: Colors.text.muted,
    marginTop: 2,
  },
});
