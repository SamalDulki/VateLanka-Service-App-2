import AsyncStorage from "@react-native-async-storage/async-storage";

export const saveDriverSession = async (user, profileData) => {
  try {
    if (!user || !profileData) {
      console.error("Invalid data for session saving");
      return null;
    }

    if (
      !profileData.truckId ||
      !profileData.municipalCouncil ||
      !profileData.district ||
      !profileData.ward ||
      !profileData.supervisorId
    ) {
      console.error("Incomplete driver profile data for session");
      return null;
    }

    const userData = {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified || true,
      userType: "driver",
      profile: profileData,
      lastLogin: new Date().toISOString(),
    };

    await AsyncStorage.setItem("driverSession", JSON.stringify(userData));
    console.log("Driver session saved successfully");

    await AsyncStorage.setItem("providerSession", JSON.stringify(userData));

    return userData;
  } catch (error) {
    console.error("Error saving driver session:", error);
    return null;
  }
};

export const clearDriverSession = async () => {
  try {
    await AsyncStorage.removeItem("driverSession");
    await AsyncStorage.removeItem("providerSession");
    console.log("Driver session cleared successfully");
    return true;
  } catch (error) {
    console.error("Error clearing driver session:", error);
    return false;
  }
};

export const getDriverSession = async () => {
  try {
    let driverSession = await AsyncStorage.getItem("driverSession");

    if (!driverSession) {
      driverSession = await AsyncStorage.getItem("providerSession");
      if (!driverSession) {
        return null;
      }
    }

    const parsedSession = JSON.parse(driverSession);

    if (!parsedSession.uid || !parsedSession.profile) {
      console.warn("Invalid session format, clearing session");
      await clearDriverSession();
      return null;
    }

    if (parsedSession.userType !== "driver") {
      console.warn("Non-driver session found, clearing");
      await clearDriverSession();
      return null;
    }

    const { profile } = parsedSession;
    if (
      !profile.truckId ||
      !profile.municipalCouncil ||
      !profile.district ||
      !profile.ward ||
      !profile.supervisorId
    ) {
      console.warn("Incomplete driver profile data in session");
      await clearDriverSession();
      return null;
    }

    return parsedSession;
  } catch (error) {
    console.error("Error getting driver session:", error);
    return null;
  }
};

export const saveProviderSession = async (user, profileData) => {
  return saveDriverSession(user, profileData);
};

export const clearProviderSession = async () => {
  return clearDriverSession();
};

export const getProviderSession = async () => {
  return getDriverSession();
};
