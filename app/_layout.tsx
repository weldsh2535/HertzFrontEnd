import { Stack } from "expo-router";
import React from "react";
import { ApolloProvider } from '@apollo/client';
import { Provider as ReduxProvider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';
import client from './src/apollo/client';
import AppNavigator from './src/navigation/AppNavigator';
import LoadingIndicator from './src/components/Common/LoadingIndicator';

export default function RootLayout() {
  return (
    <ReduxProvider store={store}>
      <PersistGate loading={<LoadingIndicator color={''} />} persistor={persistor}>
        <ApolloProvider client={client}>
          <SafeAreaProvider>
            <StatusBar style="light" />
            <AppNavigator />
          </SafeAreaProvider>
        </ApolloProvider>
      </PersistGate>
    </ReduxProvider>
  );
}
