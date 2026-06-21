import { Tabs } from 'expo-router';
import { Home, ShoppingBag, CreditCard, Package, Camera, MessageSquare, User } from 'lucide-react-native';

const NAVY = '#1C3D5A';
const GRAY = '#8E9099';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: NAVY,
        tabBarInactiveTintColor: GRAY,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#EEEFF2',
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size - 2} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Catalog',
          tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size - 2} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, size }) => <CreditCard color={color} size={size - 2} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="packages"
        options={{
          title: 'Packages',
          tabBarIcon: ({ color, size }) => <Package color={color} size={size - 2} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Instants',
          tabBarIcon: ({ color, size }) => <Camera color={color} size={size - 2} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size - 2} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size - 2} strokeWidth={1.75} />,
        }}
      />
    </Tabs>
  );
}
