import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import FeedScreen from '../screens/FeedScreen';
import SearchScreen from '../screens/SearchScreen';
import CirclesScreen from '../screens/CirclesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import HighlightsScreen from '../screens/HighlightsScreen';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();

const icons: Record<string, string> = {
  Feed: '🏠',
  Search: '🔍',
  Circles: '👥',
  Notifications: '🔔',
  Highlights: '🔖',
};

function HeaderRight() {
  const navigation = useNavigation();
  const { user } = useAuth();

  return (
    <View className="flex-row items-center gap-3 mr-4">
      <TouchableOpacity onPress={() => navigation.navigate('Messages' as never)}>
        <Text className="text-lg">💬</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Profile' as never)}>
        {user?.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} className="w-7 h-7 rounded-full" />
        ) : (
          <View className="w-7 h-7 rounded-full bg-[#7C3AED]/15 items-center justify-center">
            <Text className="text-xs font-semibold text-white">{user?.username[0]?.toUpperCase()}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function AppTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icons[route.name]}</Text>
        ),
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: '#9D9DA3',
        tabBarStyle: {
          backgroundColor: '#0A0A0A',
          borderTopColor: '#2C2C2E',
          borderTopWidth: 1,
          paddingBottom: insets.bottom + 4,
          paddingTop: 6,
          height: 56 + insets.bottom,
        },
        tabBarLabelStyle: { fontSize: 9, fontWeight: '500' as const },
        headerStyle: { backgroundColor: '#0A0A0A' },
        headerTintColor: '#7C3AED',
        headerTitleStyle: { fontWeight: 'bold' as const },
        headerRight: () => <HeaderRight />,
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} options={{ title: 'Orbit' }} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Circles" component={CirclesScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Highlights" component={HighlightsScreen} options={{ title: 'Saved' }} />
    </Tab.Navigator>
  );
}
