import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from './constants/api';
import DriverLoginScreen from './screens/DriverLoginScreen';
import DriverMapScreen from './screens/DriverMapScreen';
import RouteInputScreen from './screens/RouteInputScreen';
import DriverAlertsScreen from './screens/DriverAlertsScreen';
import DriverStatusScreen from './screens/DriverStatusScreen';
import AlertPopup from './components/AlertPopup';

const Tab = createBottomTabNavigator();

function MainTabs({ driverId }) {
  return (
    <View style={styles.fullFlex}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: COLORS.bgCard,
            borderTopColor: COLORS.border,
            borderTopWidth: 1,
            height: 64,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: COLORS.accent,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 0.3,
          },
        }}
      >
        <Tab.Screen
          name="Map"
          component={DriverMapScreen}
          initialParams={{ driverId }}
          options={{
            tabBarLabel: 'Map',
            tabBarIcon: () => <Text style={styles.tabIcon}>🗺️</Text>,
          }}
        />
        <Tab.Screen
          name="RouteInput"
          component={RouteInputScreen}
          initialParams={{ driverId }}
          options={{
            tabBarLabel: 'Route',
            tabBarIcon: () => <Text style={styles.tabIcon}>📝</Text>,
          }}
        />
        <Tab.Screen
          name="Alerts"
          component={DriverAlertsScreen}
          initialParams={{ driverId }}
          options={{
            tabBarLabel: 'Alerts',
            tabBarIcon: () => <Text style={styles.tabIcon}>🔔</Text>,
          }}
        />
        <Tab.Screen
          name="Status"
          component={DriverStatusScreen}
          initialParams={{ driverId }}
          options={{
            tabBarLabel: 'Status',
            tabBarIcon: () => <Text style={styles.tabIcon}>📊</Text>,
          }}
        />
      </Tab.Navigator>
      <AlertPopup driverId={driverId} />
    </View>
  );
}

export default function App() {
  const [driverId, setDriverId] = useState(null);

  useEffect(() => {
    // Inject global web styles for proper full-height layout and visibility
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.textContent = `
        html, body, #root {
          height: 100vh !important;
          width: 100vw !important;
          margin: 0;
          padding: 0;
          overflow: hidden;
          background-color: ${COLORS.bg} !important;
          display: flex;
          flex-direction: column;
        }
        #root > div {
          height: 100% !important;
          display: flex;
          flex-direction: column;
        }
        * { box-sizing: border-box; }
      `;
      document.head.appendChild(style);
      console.log("Web styles injected");
    }
  }, []);

  if (!driverId) {
    return (
      <View style={styles.root}>
        {/* Force a visible element to debug mounting */}
        <View style={{ backgroundColor: COLORS.accent, padding: 10, position: 'absolute', top: 0, left: 0, zIndex: 10000 }}>
          <Text style={{ color: '#000', fontWeight: 'bold' }}>APP MOUNTED</Text>
        </View>
        <DriverLoginScreen
          navigation={{
            replace: (_screen, params) => {
              if (params?.driverId) {
                AsyncStorage.setItem('driver_id', params.driverId).catch(() => {});
                setDriverId(params.driverId);
              }
            },
          }}
        />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <View style={styles.root}>
        {Platform.OS !== 'web' && <StatusBar barStyle="light-content" />}
        <MainTabs driverId={driverId} />
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    height: Platform.OS === 'web' ? '100vh' : '100%',
    width: Platform.OS === 'web' ? '100vw' : '100%',
  },
  fullFlex: {
    flex: 1,
  },
  tabIcon: {
    fontSize: 20,
  },
});
