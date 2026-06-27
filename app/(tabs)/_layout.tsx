import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

function TabBarIcon({ name, focused }: { name: any; focused: boolean }) {
  return (
    <Ionicons
      name={focused ? name.replace('-outline', '') : name}
      size={Layout.isTablet ? 26 : 24}
      color={focused ? Colors.primary : Colors.text.muted}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.text.muted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: Colors.dark.surface }]} />
        ),
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabBarIcon name="home-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          tabBarIcon: ({ focused }) => <TabBarIcon name="folder-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={styles.createButton}>
              <Ionicons name="camera" size={Layout.isTablet ? 26 : 24} color={Colors.white} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ focused }) => <TabBarIcon name="compass-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabBarIcon name="person-outline" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 0.5,
    borderTopColor: Colors.dark.border,
    height: Layout.tabBarHeight + (Platform.OS === 'ios' ? 20 : 0),
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    backgroundColor: 'transparent',
    elevation: 0,
    // On web/desktop, center the tab bar content
    ...(Platform.OS === 'web' && Layout.isDesktop
      ? { paddingHorizontal: 80 }
      : {}),
  },
  tabLabel: {
    fontSize: Layout.fontSize.xs,
    fontFamily: 'Poppins_500Medium',
  },
  createButton: {
    width: Layout.isTablet ? 58 : 52,
    height: Layout.isTablet ? 58 : 52,
    borderRadius: Layout.isTablet ? 18 : 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});
