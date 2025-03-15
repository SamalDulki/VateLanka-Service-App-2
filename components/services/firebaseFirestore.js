import { firestore } from "../utils/firebaseConfig";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

// Get driver details
export const getDriverDetails = async (truckId) => {
  try {
    const councils = await getDocs(collection(firestore, "municipalCouncils"));

    for (const council of councils.docs) {
      const districts = await getDocs(collection(council.ref, "Districts"));

      for (const district of districts.docs) {
        const wards = await getDocs(collection(district.ref, "Wards"));

        for (const ward of wards.docs) {
          const supervisors = await getDocs(
            collection(ward.ref, "supervisors")
          );

          for (const supervisor of supervisors.docs) {
            const truckRef = doc(supervisor.ref, "trucks", truckId);
            const truckDoc = await getDoc(truckRef);

            if (truckDoc.exists()) {
              return {
                ...truckDoc.data(),
                supervisorRef: supervisor.ref,
              };
            }
          }
        }
      }
    }
    throw new Error("Driver not found");
  } catch (error) {
    console.error("Error fetching driver details:", error);
    throw error;
  }
};

// Subscribe to driver updates
export const subscribeToDriverUpdates = (
  truckId,
  municipalCouncil,
  district,
  ward,
  supervisorId,
  callback
) => {
  const truckRef = doc(
    firestore,
    `municipalCouncils/${municipalCouncil}/Districts/${district}/Wards/${ward}/supervisors/${supervisorId}/trucks/${truckId}`
  );

  return onSnapshot(
    truckRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() });
      }
    },
    (error) => {
      console.error("Error in driver subscription:", error);
      callback(null);
    }
  );
};
