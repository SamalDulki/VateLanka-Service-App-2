import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import {
  saveDriverSession,
  clearDriverSession,
  getDriverSession,
} from "../utils/authStorage";
import { auth, firestore, ensureInitialized } from "../utils/firebaseConfig";

// Login driver with truck ID and password
export const loginDriver = async (truckId, password) => {
  await ensureInitialized();
  try {
    if (!truckId.startsWith("TRUCK")) {
      throw new Error("Invalid truck ID format");
    }

    console.log("Searching for truck:", truckId);
    const councilsRef = collection(firestore, "municipalCouncils");
    const councils = await getDocs(councilsRef);

    let truckDoc = null;
    let truckData = null;
    let councilId = "";
    let districtId = "";
    let wardId = "";
    let supervisorId = "";

    for (const council of councils.docs) {
      councilId = council.id;
      const districts = await getDocs(collection(council.ref, "Districts"));

      for (const district of districts.docs) {
        districtId = district.id;
        const wards = await getDocs(collection(district.ref, "Wards"));

        for (const ward of wards.docs) {
          wardId = ward.id;
          const supervisors = await getDocs(
            collection(ward.ref, "supervisors")
          );

          for (const supervisor of supervisors.docs) {
            supervisorId = supervisor.id;
            const truckRef = doc(supervisor.ref, "trucks", truckId);
            const tempDoc = await getDoc(truckRef);

            if (tempDoc.exists()) {
              truckDoc = tempDoc;
              truckData = {
                ...tempDoc.data(),
                truckId,
                municipalCouncil: councilId,
                district: districtId,
                ward: wardId,
                supervisorId,
              };
              break;
            }
          }
          if (truckDoc) break;
        }
        if (truckDoc) break;
      }
      if (truckDoc) break;
    }

    if (!truckDoc) {
      throw new Error("Truck not found");
    }

    const userCredential = await signInWithEmailAndPassword(
      auth,
      truckData.email,
      password
    );

    await saveDriverSession(userCredential.user, truckData);

    let verifiedSession = null;
    let attempts = 0;
    const maxAttempts = 5;

    while (!verifiedSession && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      attempts++;
      console.log(`Verifying session (attempt ${attempts}/${maxAttempts})...`);
      verifiedSession = await getDriverSession();

      if (
        verifiedSession &&
        verifiedSession.profile &&
        verifiedSession.profile.truckId
      ) {
        console.log("Session verification successful!");
      }
    }

    if (!verifiedSession) {
      console.warn("Could not verify session after multiple attempts");
    }

    return {
      user: userCredential.user,
      profile: truckData,
    };
  } catch (error) {
    console.error("Login error:", error);

    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/invalid-email" ||
      error.code === "auth/wrong-password"
    ) {
      throw new Error("Invalid truck ID or password");
    } else if (error.code === "auth/user-disabled") {
      throw new Error("This account has been disabled");
    } else if (error.code === "auth/network-request-failed") {
      throw new Error("Network error. Please check your connection");
    }

    throw new Error(error.message || "Login failed");
  }
};

// Logout driver
export const logout = async () => {
  try {
    await clearDriverSession();

    await signOut(auth);
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    throw new Error("Failed to logout");
  }
};
