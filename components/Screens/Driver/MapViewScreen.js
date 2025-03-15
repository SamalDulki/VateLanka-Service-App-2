import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { COLORS } from "../../utils/Constants";
import CustomText from "../../utils/CustomText";
import Icon from "react-native-vector-icons/Feather";
import * as Location from "expo-location";
import NotificationBanner from "../../utils/NotificationBanner";

export default function MapViewScreen({ route, navigation }) {
  const { profile, routeStatus } = route.params;
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "error",
  });
  const mapRef = useRef(null);
  const locationSubscription = useRef(null);

  const showNotification = (message, type = "error") => {
    setNotification({
      visible: true,
      message,
      type,
    });
  };

  useEffect(() => {
    setupLocation();

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  const setupLocation = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();

      if (status !== "granted") {
        const { status: newStatus } =
          await Location.requestForegroundPermissionsAsync();

        if (newStatus !== "granted") {
          showNotification(
            "Location permission is required for mapping.",
            "error"
          );
          setLoading(false);
          return;
        }
      }

      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeout: 10000,
        });

        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (locError) {
        console.error("Error getting initial location:", locError);
        showNotification(
          "Could not get your current location. Please check your device settings.",
          "error"
        );
      }

      try {
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 10,
            timeInterval: 5000,
          },
          (location) => {
            setCurrentLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          }
        );
      } catch (watchError) {
        console.error("Error setting up location watcher:", watchError);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error in location setup:", error);
      setLoading(false);
      showNotification("Error setting up location tracking", "error");
    }
  };

  const centerOnLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <NotificationBanner
        {...notification}
        onHide={() => setNotification((prev) => ({ ...prev, visible: false }))}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <CustomText style={styles.headerTitle}>Live Route Tracking</CustomText>
        <View
          style={[
            styles.statusBadge,
            routeStatus === "active"
              ? styles.activeBadge
              : routeStatus === "paused"
              ? styles.pausedBadge
              : styles.inactiveBadge,
          ]}
        >
          <CustomText
            style={[
              styles.statusText,
              {
                color:
                  routeStatus === "active"
                    ? COLORS.successbanner
                    : routeStatus === "paused"
                    ? COLORS.notificationYellow
                    : COLORS.textGray,
              },
            ]}
          >
            {routeStatus === "active"
              ? "Active"
              : routeStatus === "paused"
              ? "Paused"
              : "Inactive"}
          </CustomText>
        </View>
      </View>

      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <CustomText style={styles.loadingText}>Loading map...</CustomText>
          </View>
        ) : currentLocation ? (
          <MapView
            ref={mapRef}
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            initialRegion={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            showsUserLocation={false}
            followsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={true}
            showsTraffic={true}
          >
            <Marker
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }}
              title={profile.driverName || "Your Location"}
              description={profile.numberPlate || "Current position"}
              image={require("../../ApplicationAssets/truck-icon.png")}
            />
          </MapView>
        ) : (
          <View style={styles.errorContainer}>
            <Icon name="map-off" size={40} color={COLORS.textGray} />
            <CustomText style={styles.errorText}>
              Location data unavailable. Please check your device settings.
            </CustomText>
          </View>
        )}

        {currentLocation && (
          <View style={styles.mapControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={centerOnLocation}
            >
              <Icon name="crosshair" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGray,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeBadge: {
    backgroundColor: COLORS.bg1,
  },
  pausedBadge: {
    backgroundColor: COLORS.bg2,
  },
  inactiveBadge: {
    backgroundColor: COLORS.bg4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textGray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    textAlign: "center",
    color: COLORS.textGray,
  },
  mapControls: {
    position: "absolute",
    bottom: 24,
    right: 16,
  },
  controlButton: {
    backgroundColor: COLORS.white,
    borderRadius: 30,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});
