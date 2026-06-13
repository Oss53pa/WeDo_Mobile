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
import JoinByCodeScreen from '@screens/tontine/JoinByCodeScreen';
import HowItWorksScreen from '@screens/info/HowItWorksScreen';
import LegalScreen from '@screens/legal/LegalScreen';
import FeedbackScreen from '@screens/feedback/FeedbackScreen';
import MemberProfileScreen from '@screens/profile/MemberProfileScreen';
import KycScreen from '@screens/profile/KycScreen';
import KycP2Screen from '@screens/profile/KycP2Screen';
import AddMobileMoneyAccountScreen from '@screens/payment/AddMobileMoneyAccountScreen';
import RegistreScreen from '@screens/tontine/RegistreScreen';
import OrganizerDashboardScreen from '@screens/tontine/OrganizerDashboardScreen';
import TontineScheduleScreen from '@screens/tontine/TontineScheduleScreen';
import AmbassadorScreen from '@screens/ambassador/AmbassadorScreen';

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
          <Stack.Screen name="JoinByCode" component={JoinByCodeScreen} />
          <Stack.Screen name="HowItWorks" component={HowItWorksScreen} />
          <Stack.Screen name="Legal" component={LegalScreen} />
          <Stack.Screen name="Feedback" component={FeedbackScreen} />
          <Stack.Screen name="MemberProfile" component={MemberProfileScreen} />
          <Stack.Screen name="Kyc" component={KycScreen} />
          <Stack.Screen name="KycP2" component={KycP2Screen} />
          <Stack.Screen name="AddMobileMoneyAccount" component={AddMobileMoneyAccountScreen} />
          <Stack.Screen name="Registre" component={RegistreScreen} />
          <Stack.Screen name="OrganizerDashboard" component={OrganizerDashboardScreen} />
          <Stack.Screen name="TontineSchedule" component={TontineScheduleScreen} />
          <Stack.Screen name="Ambassador" component={AmbassadorScreen} />
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
