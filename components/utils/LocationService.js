import * as Location from "expo-location";
import { firestore } from "./firebaseConfig";
import { doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";

class LocationService {
  constructor() {
    this.watchId = null;
    this.isTracking = false;
    this.currentTruckId = null;
    this.currentMunicipalCouncil = null;
    this.currentDistrict = null;
    this.currentWard = null;
    this.currentSupervisorId = null;
    this.routeStatus = "idle";
    this.initialized = false;
    this.lastRouteDate = null;
  }

  async initialize() {
    try {
      if (this.initialized) return true;

      await new Promise((resolve) => setTimeout(resolve, 500));

      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        throw new Error("Location services are disabled");
      }

      const { status: foregroundStatus } =
        await Location.getForegroundPermissionsAsync();

      this.initialized = true;
      return { foregroundStatus, isEnabled };
    } catch (error) {
      console.error("LocationService initialization error:", error);
      return { foregroundStatus: "unknown", isEnabled: false, error };
    }
  }

  async requestPermissions() {
    try {
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        throw new Error("Location services are disabled");
      }

      const { status: foregroundStatus } =
        await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== "granted") {
        console.warn("Foreground location permission denied");
        return { foregroundStatus, backgroundStatus: "denied" };
      }

      const { status: backgroundStatus } =
        await Location.requestBackgroundPermissionsAsync();

      return { foregroundStatus, backgroundStatus };
    } catch (error) {
      console.error("Error requesting location permissions:", error);
      return { foregroundStatus: "error", backgroundStatus: "error", error };
    }
  }

  setTruckInfo(truckId, municipalCouncil, district, ward, supervisorId) {
    this.currentTruckId = truckId;
    this.currentMunicipalCouncil = municipalCouncil;
    this.currentDistrict = district;
    this.currentWard = ward;
    this.currentSupervisorId = supervisorId;
  }

  getTruckDocRef() {
    if (
      !this.currentTruckId ||
      !this.currentMunicipalCouncil ||
      !this.currentDistrict ||
      !this.currentWard ||
      !this.currentSupervisorId
    ) {
      throw new Error("Truck information not set");
    }

    return doc(
      firestore,
      `municipalCouncils/${this.currentMunicipalCouncil}/Districts/${this.currentDistrict}/Wards/${this.currentWard}/supervisors/${this.currentSupervisorId}/trucks/${this.currentTruckId}`
    );
  }

  async checkAndResetRouteStatus() {
    try {
      if (!this.currentTruckId) return false;

      const truckRef = this.getTruckDocRef();
      const truckDoc = await getDoc(truckRef);

      if (!truckDoc.exists()) {
        console.warn("Truck document not found during status check");
        return false;
      }

      const truckData = truckDoc.data();
      const currentStatus = truckData.routeStatus || "idle";
      this.routeStatus = currentStatus;

      const lastCompletedDate = truckData.lastCompletedDate;
      if (!lastCompletedDate && currentStatus !== "completed") {
        return false;
      }

      const today = new Date().toISOString().split("T")[0];
      const lastDate = lastCompletedDate
        ? lastCompletedDate.split("T")[0]
        : null;

      if (lastDate && lastDate !== today && currentStatus === "completed") {
        await updateDoc(truckRef, {
          routeStatus: "idle",
          lastStatusReset: serverTimestamp(),
          lastResetDate: today,
        });

        this.routeStatus = "idle";
        console.log("Route status reset from completed to idle for new day");
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error checking/resetting route status:", error);
      return false;
    }
  }

  async startRoute() {
    try {
      await this.initialize();

      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        throw new Error("Location services are disabled");
      }

      let permResult;
      try {
        permResult = await this.requestPermissions();
      } catch (permError) {
        console.error("Permission request error:", permError);
        throw permError;
      }

      if (permResult.foregroundStatus !== "granted") {
        throw new Error("Location permission is required to track routes");
      }

      try {
        const truckRef = this.getTruckDocRef();
        await updateDoc(truckRef, {
          routeStatus: "active",
          lastLocationUpdate: serverTimestamp(),
          lastRouteStarted: new Date().toISOString(),
        });
        this.routeStatus = "active";
      } catch (updateError) {
        console.error("Error updating route status:", updateError);
        throw new Error("Failed to update route status");
      }

      if (permResult.foregroundStatus === "granted") {
        try {
          if (this.watchId) {
            this.watchId.remove();
            this.watchId = null;
          }

          this.watchId = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              distanceInterval: 10,
              timeInterval: 3000,
            },
            this.updateLocation.bind(this)
          );
          this.isTracking = true;
        } catch (watchError) {
          console.error("Error watching position:", watchError);
        }
      } else {
        console.log(
          "Location permission not granted, route active without tracking"
        );
      }

      return true;
    } catch (error) {
      console.error("Error starting route tracking:", error);
      throw error;
    }
  }

  async updateLocation(location) {
    try {
      if (!this.isTracking) return;

      const { latitude, longitude, heading, speed, timestamp } =
        location.coords;

      let formattedTimestamp;
      try {
        formattedTimestamp = new Date(timestamp).toISOString();
      } catch (error) {
        console.warn("Invalid timestamp format, using current time instead");
        formattedTimestamp = new Date().toISOString();
      }

      const truckRef = this.getTruckDocRef();
      await updateDoc(truckRef, {
        currentLocation: {
          latitude,
          longitude,
          heading: heading || 0,
          speed: speed || 0,
          timestamp: formattedTimestamp,
        },
        lastLocationUpdate: serverTimestamp(),
      });

      console.log("Location updated:", latitude, longitude);
    } catch (error) {
      console.error("Error updating location:", error);
    }
  }

  async getCurrentLocation() {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();

      if (status !== "granted") {
        throw new Error("Location permission not granted");
      }

      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        throw new Error("Location services are disabled");
      }

      const location = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Location request timed out")),
            10000
          )
        ),
      ]);

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        heading: location.coords.heading || 0,
        speed: location.coords.speed || 0,
        timestamp: new Date(location.timestamp).toISOString(),
      };
    } catch (error) {
      console.error("Error getting current location:", error);
      throw error;
    }
  }

  async pauseRoute() {
    try {
      const truckRef = this.getTruckDocRef();
      await updateDoc(truckRef, {
        routeStatus: "paused",
        lastLocationUpdate: serverTimestamp(),
      });

      this.routeStatus = "paused";
      return true;
    } catch (error) {
      console.error("Error pausing route:", error);
      throw error;
    }
  }

  async resumeRoute() {
    try {
      const truckRef = this.getTruckDocRef();
      await updateDoc(truckRef, {
        routeStatus: "active",
        lastLocationUpdate: serverTimestamp(),
      });

      this.routeStatus = "active";
      return true;
    } catch (error) {
      console.error("Error resuming route:", error);
      throw error;
    }
  }

  async stopRoute() {
    try {
      if (this.watchId) {
        this.watchId.remove();
        this.watchId = null;
      }

      this.isTracking = false;
      const today = new Date().toISOString();

      const truckRef = this.getTruckDocRef();
      await updateDoc(truckRef, {
        routeStatus: "completed",
        lastLocationUpdate: serverTimestamp(),
        lastCompletedDate: today,
      });

      this.routeStatus = "completed";
      this.lastRouteDate = today;
      return true;
    } catch (error) {
      console.error("Error stopping route:", error);
      throw error;
    }
  }

  getStatus() {
    return {
      isTracking: this.isTracking,
      routeStatus: this.routeStatus,
    };
  }
}

const locationService = new LocationService();

export default locationService;
