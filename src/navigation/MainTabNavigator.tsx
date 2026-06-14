/**
 * Main Bottom Tab Navigator
 * Primary navigation for authenticated users
 * WeDo Design - Professional SVG Icons
 */

import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {getFocusedRouteNameFromRoute} from '@react-navigation/native';
import {MainTabParamList, TontinesStackParamList} from './types';
import {CustomTabBar} from '@components/navigation/CustomTabBar';

// Import screens
import HomeScreen from '@screens/home/HomeScreen';
import TontinesListScreen from '@screens/tontine/TontinesListScreen';
import TontineDetailScreen from '@screens/tontine/TontineDetailScreen';
import CreateTontineScreen from '@screens/tontine/CreateTontineScreen';
import ProfileScreen from '@screens/profile/ProfileScreen';
import EditProfileScreen from '@screens/profile/EditProfileScreen';
import SettingsScreen from '@screens/settings/SettingsScreen';
import NotificationsScreen from '@screens/notifications/NotificationsScreen';
import ContributionScreen from '@screens/payment/ContributionScreen';
import MessagesScreen from '@screens/chat/MessagesScreen';
import ChatScreen from '@screens/chat/ChatScreen';
import TransactionsScreen from '@screens/transactions/TransactionsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const TontinesStack = createStackNavigator<TontinesStackParamList>();
const ProfileStack = createStackNavigator();
const MessagesStack = createStackNavigator();

// Tontines Stack Navigator
const TontinesStackNavigator = () => (
  <TontinesStack.Navigator screenOptions={{headerShown: false}}>
    <TontinesStack.Screen name="TontinesList" component={TontinesListScreen} />
    <TontinesStack.Screen name="TontineDetail" component={TontineDetailScreen} />
    <TontinesStack.Screen name="Contribution" component={ContributionScreen} />
  </TontinesStack.Navigator>
);

// Profile Stack Navigator
const ProfileStackNavigator = () => (
  <ProfileStack.Navigator screenOptions={{headerShown: false}}>
    <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
    <ProfileStack.Screen name="Settings" component={SettingsScreen} />
    <ProfileStack.Screen name="Notifications" component={NotificationsScreen} />
    <ProfileStack.Screen name="Transactions" component={TransactionsScreen} />
  </ProfileStack.Navigator>
);

// Messages Stack Navigator
const MessagesStackNavigator = () => (
  <MessagesStack.Navigator screenOptions={{headerShown: false}}>
    <MessagesStack.Screen name="MessagesList" component={MessagesScreen} />
    <MessagesStack.Screen name="Chat" component={ChatScreen} />
  </MessagesStack.Navigator>
);

const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{headerShown: false}}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Tontines" component={TontinesStackNavigator} />
      <Tab.Screen name="Create" component={CreateTontineScreen} />
      <Tab.Screen
        name="Messages"
        component={MessagesStackNavigator}
        options={({route}) => ({
          // Plein écran quand on est dans une conversation (la barre flottante
          // recouvrirait le champ de saisie).
          tabBarStyle:
            (getFocusedRouteNameFromRoute(route) ?? 'MessagesList') === 'Chat'
              ? {display: 'none'}
              : undefined,
        })}
      />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
