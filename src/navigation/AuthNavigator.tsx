/**
 * Authentication Stack Navigator
 * Handles onboarding and authentication flows
 */

import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {AuthStackParamList} from './types';
import {useTheme} from '@theme';

// Import screens
import WelcomeScreen from '@screens/auth/WelcomeScreen';
import LoginScreen from '@screens/auth/LoginScreen';
import RegisterScreen from '@screens/auth/RegisterScreen';
import VerifyOTPScreen from '@screens/auth/VerifyOTPScreen';
// import CreatePINScreen from '@screens/auth/CreatePINScreen';
// import SetupBiometricScreen from '@screens/auth/SetupBiometricScreen';
// import LinkMobileMoneyScreen from '@screens/auth/LinkMobileMoneyScreen';

const Stack = createStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
  const {colors} = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: {backgroundColor: colors.bg.base},
      }}
      initialRouteName="Welcome">
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
      {/* <Stack.Screen name="CreatePIN" component={CreatePINScreen} />
      <Stack.Screen name="SetupBiometric" component={SetupBiometricScreen} />
      <Stack.Screen name="LinkMobileMoney" component={LinkMobileMoneyScreen} /> */}
    </Stack.Navigator>
  );
};

export default AuthNavigator;
