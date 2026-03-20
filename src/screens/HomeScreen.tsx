import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  useAnimatedValue,
  Keyboard,
  Platform,
  BackHandler,
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/EvilIcons';
import Ionicon from 'react-native-vector-icons/Ionicons';
import { debounce } from 'lodash';
import NetInfo from '@react-native-community/netinfo';
import { fetchLocations, fetchWeatherForecast } from '../api/weather';
import { weatherImages, getWeatherImage } from '../constants/constants';
import { getData, storeData } from '../utilities/asyncStorage';
import { FONTSIZE, SIZE, SPACING, BORDERRADIUS } from '../utilities/Responsive';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useFocusEffect } from '@react-navigation/native';
import {
  LoaderKitView,
} from 'react-native-loader-kit';
import LottieView from 'lottie-react-native';
const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const [showSearch, toggleSearch] = useState(false);
  const [locations, setLoactions] = useState([]);
  const [weather, setWeather] = useState({});
  const { current, location } = weather;
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [savedCities, setSavedCities] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const searchAnimation = useAnimatedValue(0);
  const sheet = useRef<TrueSheet>(null);
  const inputRef = useRef(null);
  const isSheetOpen = useRef(false);

  const present = async () => {
    Keyboard.dismiss();
    await loadSavedCities();
    requestAnimationFrame(async () => {
      isSheetOpen.current = true;

      await sheet.current?.present();
    });
  };

  const dismiss = async () => {
    if (!isSheetOpen.current) return;

    isSheetOpen.current = false;
    await sheet.current?.dismiss();
  };

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;

      const onBackPress = () => {
        // If sheet is open → dismiss it
        if (isSheetOpen.current) {
          dismiss();
          return true; // stop navigation
        }

        // Otherwise → allow normal navigation behavior
        return false;
      };

      const sub = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => sub.remove();
    }, []),
  );

  const loadSavedCities = async () => {
    const cities = await getData('savedCities');
    setSavedCities(cities ? JSON.parse(cities) : []);
  };

  const saveCityToList = async (cityName: string) => {
    const cities = await getData('savedCities');
    const cityList = cities ? JSON.parse(cities) : [];
    if (!cityList.includes(cityName)) {
      cityList.push(cityName);
      await storeData('savedCities', JSON.stringify(cityList));
    }
  };

  const deleteSavedCity = async (cityName: string) => {
    const cities = await getData('savedCities');
    const cityList = cities ? JSON.parse(cities) : [];
    const filtered = cityList.filter(city => city !== cityName);
    await storeData('savedCities', JSON.stringify(filtered));
    setSavedCities(filtered);
  };

  const handleLocation = async (loc: any) => {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      setSearchError('No internet connection');
      return;
    }
    toggleSearch(false);
    setLoactions([]);
    setLoading(true);
    try {
      const foreCastData = await fetchWeatherForecast({
        cityName: loc.name,
        days: '7',
      });
      setWeather(foreCastData);
      storeData('city', loc.name);
      await saveCityToList(loc.name);
    } catch (error) {
      console.log('Error', error);
    } finally {
      setLoading(false);
    }
  };
  const handleSearch = async (value: string) => {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      setSearchError('No internet connection');
      setLocationLoading(false);
      return;
    }
    setLocationLoading(true);
    setSearchError('');
    try {
      if (value.length > 2) {
        const res = await fetchLocations({ cityName: value });
        if (res && res.length > 0) {
          setLoactions(res);
        } else {
          setLoactions([]);
          setSearchError('City not found');
        }
      } else {
        setLoactions([]);
        setSearchError('');
      }
    } catch (error) {
      console.log('Error in homescreen', error);
      setLoactions([]);
      setSearchError('Error searching city');
    } finally {
      setLocationLoading(false);
    }
  };
  const handleTextDebounce = useCallback(debounce(handleSearch, 1200), []);

  useEffect(() => {
    fetchWeatherForecastData();
  }, []);
  const fetchWeatherForecastData = async () => {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.log('No internet connection');
      setLoading(false);
      setInitialLoading(false);
      return;
    }
    toggleSearch(false);
    const myCity = await getData('city');
    let cityName = 'Jaunpur';
    if (myCity) {
      cityName = myCity;
    }
    setLoading(true);
    try {
      const foreCastData = await fetchWeatherForecast({
        cityName,
        days: '7',
      });
      setWeather(foreCastData);
    } catch (error) {
      console.log('Error', error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWeatherForecastData();
    setRefreshing(false);
  };
  return (
    <View style={[styles.container]}>
      <StatusBar
        barStyle={'light-content'}
        translucent
        backgroundColor={'transparent'}
      />
      <Image
        blurRadius={30}
        source={require('../assets/images/bg.png')}
        style={styles.imageStyle}
      />
      <View
        style={{
          paddingTop: insets.top,
          // paddingBottom: insets.bottom + 10,
          flex: 1,
        }}
      >
        {loading ? (
          <View style={styles.loaderView}>
            {/* <ActivityIndicator size={150} color={'rgba(241, 219, 219, 0.41)'} /> */}
            <LoaderKitView
              style={{ width: SPACING[100], height: SPACING[100] }}
              name={'BallSpinFadeLoader'}
              animationSpeedMultiplier={1.3}
              color={'rgba(241, 219, 219, 0.41)'}
            />
          </View>
        ) : !initialLoading && !current && !location ? (
          <View style={styles.loaderView}>
            <Ionicon name="cloud-offline-outline" size={100} color="rgba(255, 255, 255, 0.5)" />
            <Text style={styles.noDataText}>No internet connection</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchWeatherForecastData}>
              <Ionicon name="refresh" size={FONTSIZE[20]} color="#fff" />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (

          // {/* Search Section  */}
          <>

            <View style={styles.searchSection}>

              <Animated.View
                style={[
                  styles.inputView,
                  {
                    width: searchAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['19%', '100%'],
                    }),
                    backgroundColor: showSearch ? 'rgba(241, 219, 219, 0.2)' : 'transparent',
                  },
                ]}
              >
                {showSearch && (
                  <Animated.View
                    style={{
                      flex: 1,
                      opacity: searchAnimation,
                    }}
                  >
                    <TextInput
                      ref={inputRef}
                      onChangeText={handleTextDebounce}
                      placeholder="Search city"
                      placeholderTextColor={'lightgray'}
                      style={styles.inputStyle}
                    />
                  </Animated.View>
                )}
                {locationLoading && showSearch && (
                  <ActivityIndicator size={FONTSIZE[25]} color="lightgray" style={{ marginRight: SPACING[10] }} />
                )}
                <TouchableOpacity
                  style={styles.searchBtn}
                  onPress={() => {
                    const toValue = showSearch ? 0 : 1;
                    Animated.timing(searchAnimation, {
                      toValue,
                      duration: 300,
                      useNativeDriver: false,
                    }).start(() => {
                      if (!showSearch) {
                        setTimeout(() => inputRef.current?.focus(), 100);
                      }
                    });
                    toggleSearch(!showSearch);
                    setLoactions([]);
                  }}
                >
                  <Ionicon name="search" size={FONTSIZE[25]} color="lightgray" />
                </TouchableOpacity>
              </Animated.View>
              {locations.length > 0 && showSearch ? (
                <View style={[styles.locationView]}>
                  {locations.map((loc, index) => {
                    return (
                      <TouchableOpacity
                        key={index}
                        style={styles.locationBtnView}
                        onPress={() => handleLocation(loc)}
                      >
                        <Ionicon name="location" size={FONTSIZE[22]} solid color="#fff" />
                        <Text style={styles.locationText}>
                          {loc?.name} , {loc?.region} , {loc?.country}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : searchError && showSearch ? (
                <View style={[styles.locationView]}>
                  <View style={styles.errorView}>
                    <Ionicon name="alert-circle-outline" size={FONTSIZE[22]} color="#DC3535" />
                    <Text style={styles.errorText}>{searchError}</Text>
                  </View>
                </View>
              ) : null}
            </View>
            {/* Forcast section  */}
            {current && location ? (
              <ScrollView

                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingBottom: insets.bottom
                }}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="rgba(241, 219, 219, 0.41)"
                    progressBackgroundColor={'gray'}
                    colors={['rgba(241, 219, 219, 0.41)']}
                  />
                }

              >
                <View style={styles.forcastSection}>
                  {/* Location  */}
                  <TouchableOpacity style={styles.locationTitleView} onPress={present}>
                    <Ionicon name="location-sharp" size={FONTSIZE[20]} color="#fff" />
                    <Text style={styles.locationTitle} numberOfLines={1}>
                      {location?.name},{''} {location?.region},{' '}
                      <Text style={styles.locationSubtitle} numberOfLines={1}>{location?.country}</Text>
                    </Text>
                  </TouchableOpacity>
                  {/* Weather Image  */}
                  <View style={styles.weatherImageView}>
                    <LottieView
                      source={getWeatherImage(current?.condition?.text)}
                      style={styles.weatherImageStyle}
                      loop
                      autoPlay
                      speed={0.7}
                    />
                  </View>
                  {/* Celcius  */}
                  <View style={styles.celciusView}>
                    <Text style={styles.celciusText}>{current?.temp_c}°C</Text>
                    <Text style={styles.subCelciusText}>
                      {current?.condition?.text}
                    </Text>
                    <Text style={styles.feelsLikeText}>Feels like {current?.feelslike_c}°C</Text>
                  </View>
                  {/* other states  */}
                  <View style={styles.otherStatesView}>
                    <View style={styles.subOtherStateView}>
                      <Image
                        source={require('../assets/icons/wind.png')}
                        style={styles.subStateIcon}
                      />
                      <Text style={styles.windText}>{current?.wind_kph} km/h</Text>
                    </View>
                    <View style={styles.subOtherStateView}>
                      <Image
                        source={require('../assets/icons/drop.png')}
                        style={styles.subStateIcon}
                      />
                      <Text style={styles.windText}>{current?.humidity}%</Text>
                    </View>
                    <View style={styles.subOtherStateView}>
                      <Image
                        source={require('../assets/icons/sun.png')}
                        style={styles.subStateIcon}
                      />
                      <Text style={styles.windText}>
                        {weather?.forecast?.forecastday[0]?.astro?.sunrise}
                      </Text>
                    </View>
                  </View>
                  {/* Additional Details */}
                  <View style={styles.additionalDetails}>
                    <View style={styles.detailRow}>
                      <View style={styles.detailLabelView}>
                        <Ionicon name="sunny-outline" size={FONTSIZE[18]} color="rgba(255, 255, 255, 0.7)" />
                        <Text style={styles.detailLabel}>UV Index</Text>
                      </View>
                      <Text style={styles.detailValue}>{current?.uv}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <View style={styles.detailLabelView}>
                        <Ionicon name="eye-outline" size={FONTSIZE[18]} color="rgba(255, 255, 255, 0.7)" />
                        <Text style={styles.detailLabel}>Visibility</Text>
                      </View>
                      <Text style={styles.detailValue}>{current?.vis_km} km</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <View style={styles.detailLabelView}>
                        <Ionicon name="speedometer-outline" size={FONTSIZE[18]} color="rgba(255, 255, 255, 0.7)" />
                        <Text style={styles.detailLabel}>Pressure</Text>
                      </View>
                      <Text style={styles.detailValue}>{current?.pressure_mb} mb</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <View style={styles.detailLabelView}>
                        <Ionicon name="moon-outline" size={FONTSIZE[18]} color="rgba(255, 255, 255, 0.7)" />
                        <Text style={styles.detailLabel}>Sunset</Text>
                      </View>
                      <Text style={styles.detailValue}>{weather?.forecast?.forecastday[0]?.astro?.sunset}</Text>
                    </View>
                    <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                      <View style={styles.detailLabelView}>
                        <Ionicon name="cloud-outline" size={FONTSIZE[18]} color="rgba(255, 255, 255, 0.7)" />
                        <Text style={styles.detailLabel}>Cloud</Text>
                      </View>
                      <Text style={styles.detailValue}>{current?.cloud}%</Text>
                    </View>
                  </View>
                </View>
                {/* Daily Forcast  */}
                <View style={styles.dailyForcastWrapper}>
                  <View style={styles.dailyForcastView}>
                    <Ionicon name="calendar-outline" size={FONTSIZE[20]} color="#fff" />
                    <Text style={styles.dailyForcastText}>Daily Forecast</Text>
                  </View>
                  <ScrollView
                    contentContainerStyle={{ paddingHorizontal: SPACING[10], gap: SPACING[10] }}
                    horizontal
                    showsHorizontalScrollIndicator={false}

                  >
                    {weather?.forecast?.forecastday?.map((item, index) => {
                      let date = new Date(item?.date);
                      let options = { weekday: 'long' };
                      let dayName = date.toLocaleDateString('en-US', options);
                      dayName = dayName.split(',')[0];
                      return (
                        <View key={index} style={styles.scrollInsideView}>
                          <LottieView
                            source={getWeatherImage(item?.day?.condition?.text)}
                            style={{
                              width: SIZE.wp(15),
                              height: SIZE.hp(7),
                            }}
                            loop
                            autoPlay
                            speed={0.7}
                          />
                          <Text style={styles.dayText}>{dayName}</Text>
                          <Text style={styles.dayText}>
                            {item?.day?.avgtemp_c}°C
                          </Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              </ScrollView>
            ) : null}
          </>


        )}
      </View>
      <TrueSheet
        ref={sheet}
        detents={['auto', 1, 1]}
        backgroundBlur="dark"
        blurOptions={{
          intensity: 15,
          interaction: false,
        }}
        // draggable={false}
        backgroundColor={'#44444E'}
        cornerRadius={BORDERRADIUS[24]}
        accessibilityViewIsModal={true}
      >

        <View style={[styles.trueSheetContainer, {
          paddingTop: insets.top,
          paddingBottom: insets.bottom + SPACING[40],
        }]}>

          <Text style={styles.sheetTitle}>Saved Cities</Text>
          <ScrollView showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              gap: SPACING[10],
              paddingBottom: SPACING[20],

            }}
          >
            {savedCities.length > 0 ? (
              savedCities.map((city, index) => (
                <View key={index} style={styles.savedCityItem}>
                  <TouchableOpacity
                    style={styles.cityNameBtn}
                    onPress={async () => {
                      dismiss();
                      setLoading(true);
                      try {
                        const foreCastData = await fetchWeatherForecast({
                          cityName: city,
                          days: '7',
                        });
                        setWeather(foreCastData);
                        storeData('city', city);
                      } catch (error) {
                        console.log('Error', error);
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    <Ionicon name="location" size={FONTSIZE[20]} color="#fff" />
                    <Text style={styles.savedCityText}>{city}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteSavedCity(city)}>
                    <Ionicon name="trash-outline" size={FONTSIZE[20]} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.noCitiesText}>No saved cities</Text>
            )}
          </ScrollView>
        </View>


      </TrueSheet>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  imageStyle: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  searchSection: {
    // height: '50%',
    margin: SPACING[4],
    position: 'relative',
    zIndex: 50,
    padding: SPACING[4],
  },
  inputView: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderRadius: BORDERRADIUS[30],
    backgroundColor: 'rgba(241, 219, 219, 0.2)',
    paddingLeft: SPACING[2],
    overflow: 'hidden',
    height: SIZE.hp(6),
    alignSelf: 'flex-end',
  },
  inputStyle: {
    flex: 1,
    paddingLeft: SPACING[10],
    color: '#fff',
    alignItems: 'baseline',
    fontWeight: '500',
    fontSize: FONTSIZE[18],
  },
  searchBtn: {
    backgroundColor: 'rgba(241, 219, 219, 0.2)',
    borderRadius: BORDERRADIUS[60],
    paddingVertical: SPACING[6],
    paddingHorizontal: SPACING[15],
    justifyContent: 'center',
    alignItems: 'center',
    height: '85%',
    marginRight: SPACING[5],


  },
  locationView: {
    position: 'absolute',
    width: '100%',
    backgroundColor: '#595966',
    borderRadius: BORDERRADIUS[30],
    padding: SPACING[5],
    top: SIZE.hp(7),
    alignSelf: 'center',
    overflow: 'hidden',
  },
  locationBtnView: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING[10],
    borderWidth: 0,
    borderBottomWidth: 0.6,
    borderBottomColor: 'gray',
    gap: SPACING[5],
  },
  locationText: {
    fontSize: FONTSIZE[18],
    color: '#fff',
  },
  errorView: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING[10],
    gap: SPACING[2],
    justifyContent: 'center',
  },
  errorText: {
    fontSize: FONTSIZE[16],
    color: '#DC3535',
  },
  forcastSection: {
    // flex: 1,
    justifyContent: 'space-around',
    margin: SPACING[8],
    marginBottom: SPACING[10],
    gap: SPACING[10],
  },
  locationTitleView: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING[1],
  },
  locationTitle: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 20,
  },
  locationSubtitle: {
    color: 'lightgray',
    textAlign: 'center',
    fontWeight: '900',
    fontSize: FONTSIZE[18],
  },
  weatherImageView: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  weatherImageStyle: {
    width: SIZE.wp(25),
    height: SIZE.hp(10),
  },
  celciusView: {
    paddingVertical: SPACING[10],
  },
  celciusText: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#fff',
    fontSize: FONTSIZE[24],
  },
  subCelciusText: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#fff',
    fontSize: FONTSIZE[15],
    letterSpacing: 1,
  },
  otherStatesView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
  },
  subOtherStateView: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING[3],
    gap: SPACING[5],
  },
  subStateIcon: {
    height: SIZE.hp(2.5),
    width: SIZE.wp(5),
  },
  windText: {
    color: '#fff',
    fontSize: FONTSIZE[18],
  },
  feelsLikeText: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: FONTSIZE[14],
    marginTop: SPACING[5],
  },
  additionalDetails: {
    backgroundColor: 'rgba(241, 219, 219, 0.2)',
    borderRadius: BORDERRADIUS[20],
    padding: SPACING[10],
    marginTop: SPACING[2],
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING[8],
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  detailLabelView: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[5],
  },
  detailLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: FONTSIZE[16],
  },
  detailValue: {
    color: '#fff',
    fontSize: FONTSIZE[16],
    fontWeight: '600',
  },
  dailyForcastWrapper: {
    marginBottom: SPACING[10],
    paddingVertical: SPACING[10],
  },
  dailyForcastView: {
    flexDirection: 'row',
    marginHorizontal: SPACING[10],
    paddingHorizontal: SPACING[10],
    alignItems: 'center',
    gap: SPACING[10],
  },
  dailyForcastText: {
    fontSize: FONTSIZE[20],
    color: '#fff',
  },
  scrollInsideView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: 120,
    borderRadius: BORDERRADIUS[20],
    paddingVertical: SPACING[10],
    marginVertical: SPACING[10],
    backgroundColor: 'rgba(241, 219, 219, 0.2)',
  },
  dayText: {
    color: '#fff',
    fontSize: FONTSIZE[12],
  },
  loaderView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trueSheetContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: SPACING[24],
    paddingTop: SPACING[16],
    paddingBottom: SPACING[40],
    borderTopLeftRadius: BORDERRADIUS[28],
    borderTopRightRadius: BORDERRADIUS[28],
  },
  sheetTitle: {
    fontSize: FONTSIZE[22],
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: SPACING[16],
  },
  savedCityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING[12],
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  cityNameBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[8],
    flex: 1,
  },
  savedCityText: {
    fontSize: FONTSIZE[18],
    color: '#fff',
  },
  noCitiesText: {
    fontSize: FONTSIZE[16],
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: SPACING[20],
  },
  noDataText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: FONTSIZE[18],
    marginTop: SPACING[20],
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[8],
    backgroundColor: 'rgba(241, 219, 219, 0.2)',
    paddingHorizontal: SPACING[20],
    paddingVertical: SPACING[12],
    borderRadius: BORDERRADIUS[20],
    marginTop: SPACING[20],
  },
  retryText: {
    color: '#fff',
    fontSize: FONTSIZE[16],
    fontWeight: '600',
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  }
});
