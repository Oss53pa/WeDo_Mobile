/**
 * Root Navigator
 * Main navigation container that switches between Auth and Main flows
 */

import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {RootStackParamList} from './types';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import ManageTontineScreen from '@screens/tontine/ManageTontineScreen';
import InviteTontineScreen from '@screens/tontine/InviteTontineScreen';
import MemberProfileScreen from '@screens/profile/MemberProfileScreen';
import KycScreen from '@screens/profile/KycScreen';
import AddMobileMoneyAccountScreen from '@screens/payment/AddMobileMoneyAccountScreen';

const Stack = createStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
  isAuthenticated: boolean;
}

const RootNavigator: React.FC<RootNavigatorProps> = ({isAuthenticated}) => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          {/* Feature screens reachable from anywhere via navigate(name) */}
          <Stack.Screen name="ManageTontine" component={ManageTontineScreen} />
          <Stack.Screen name="InviteTontine" component={InviteTontineScreen} />
          <Stack.Screen name="MemberProfile" component={MemberProfileScreen} />
          <Stack.Screen name="Kyc" component={KycScreen} />
          <Stack.Screen name="AddMobileMoneyAccount" component={AddMobileMoneyAccountScreen} />
          {/* Additional modal screens accessible from anywhere */}
          {/* <Stack.Screen
            name="TontineDetail"
            component={TontineDetailScreen}
            options={{presentation: 'modal'}}
          />
          <Stack.Screen
            name="CreateTontine"
            component={CreateTontineScreen}
            options={{presentation: 'modal'}}
          />
          <Stack.Screen
            name="PaymentFlow"
            component={PaymentFlowScreen}
            options={{presentation: 'modal'}}
          />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="MemberProfile" component={MemberProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="AddMobileMoneyAccount" component={AddMobileMoneyAccountScreen} />
          <Stack.Screen name="VoteDetail" component={VoteDetailScreen} /> */}
        </>
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
