import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import AppNavigation from './src/navigator/AppNavigation'
import { SystemBars } from 'react-native-edge-to-edge'

const App = () => {

  return (
    <SafeAreaProvider>
      <AppNavigation />
      <SystemBars style='inverted' />
    </SafeAreaProvider>
  )
}

export default App

const styles = StyleSheet.create({})