import { firestore } from "../utils/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
} from "firebase/firestore";

// Fetch tickets assigned to a driver
export const fetchAssignedTickets = async (truckId) => {
  try {
    if (!truckId) {
      throw new Error("Truck ID is required");
    }

    const councilsRef = collection(firestore, "municipalCouncils");
    const councils = await getDocs(councilsRef);

    let tickets = [];

    for (const council of councils.docs) {
      const councilId = council.id;
      const districts = await getDocs(collection(council.ref, "Districts"));

      for (const district of districts.docs) {
        const districtId = district.id;
        const wards = await getDocs(collection(district.ref, "Wards"));

        for (const ward of wards.docs) {
          const wardId = ward.id;
          const ticketsRef = collection(
            firestore,
            `municipalCouncils/${councilId}/Districts/${districtId}/Wards/${wardId}/tickets`
          );

          const q = query(
            ticketsRef,
            where("assignedTo", "==", truckId),
            orderBy("assignedAt", "desc")
          );

          const snapshot = await getDocs(q);

          const wardTickets = snapshot.docs.map((doc) => ({
            id: doc.id,
            councilId,
            districtId,
            wardId,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
            resolvedAt: doc.data().resolvedAt?.toDate(),
            assignedAt: doc.data().assignedAt?.toDate(),
          }));

          tickets = [...tickets, ...wardTickets];
        }
      }
    }

    return tickets;
  } catch (error) {
    console.error("Error fetching assigned tickets:", error);
    throw error;
  }
};

// Subscribe to tickets assigned to a driver
export const subscribeToAssignedTickets = (truckId, profile, callback) => {
  if (!truckId || !profile) {
    callback([]);
    return () => {};
  }

  try {
    const { municipalCouncil, district, ward } = profile;

    if (!municipalCouncil || !district || !ward) {
      console.error("Missing location information in profile");
      callback([]);
      return () => {};
    }

    const ticketsRef = collection(
      firestore,
      `municipalCouncils/${municipalCouncil}/Districts/${district}/Wards/${ward}/tickets`
    );

    const q = query(
      ticketsRef,
      where("assignedTo", "==", truckId),
      orderBy("assignedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tickets = snapshot.docs.map((doc) => ({
          id: doc.id,
          councilId: municipalCouncil,
          districtId: district,
          wardId: ward,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          resolvedAt: doc.data().resolvedAt?.toDate(),
          assignedAt: doc.data().assignedAt?.toDate(),
        }));

        callback(tickets);
      },
      (error) => {
        console.error("Error in tickets subscription:", error);
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error("Error setting up tickets subscription:", error);
    callback([]);
    return () => {};
  }
};

// Update ticket status
export const updateTicketStatus = async (
  ticketId,
  councilId,
  districtId,
  wardId,
  status,
  additionalData = {}
) => {
  try {
    const ticketRef = doc(
      firestore,
      `municipalCouncils/${councilId}/Districts/${districtId}/Wards/${wardId}/tickets/${ticketId}`
    );

    const updateData = {
      status,
      updatedAt: serverTimestamp(),
      ...additionalData,
    };

    if (status === "resolved") {
      updateData.resolvedAt = serverTimestamp();
    }

    await updateDoc(ticketRef, updateData);

    return true;
  } catch (error) {
    console.error("Error updating ticket status:", error);
    throw error;
  }
};

// Start working on a ticket
export const startWorkingOnTicket = async (
  ticketId,
  councilId,
  districtId,
  wardId,
  driverName
) => {
  try {
    return await updateTicketStatus(
      ticketId,
      councilId,
      districtId,
      wardId,
      "in_progress",
      {
        startedWorkingAt: serverTimestamp(),
        lastUpdatedBy: driverName || "Driver",
      }
    );
  } catch (error) {
    throw error;
  }
};

// Complete a ticket
export const completeTicket = async (
  ticketId,
  councilId,
  districtId,
  wardId,
  completionData
) => {
  try {
    return await updateTicketStatus(
      ticketId,
      councilId,
      districtId,
      wardId,
      "resolved",
      {
        completedAt: serverTimestamp(),
        completionNotes: completionData.notes || "",
        ...completionData,
      }
    );
  } catch (error) {
    throw error;
  }
};

// Get ticket details
export const getTicketDetails = async (
  ticketId,
  councilId,
  districtId,
  wardId
) => {
  try {
    const ticketRef = doc(
      firestore,
      `municipalCouncils/${councilId}/Districts/${districtId}/Wards/${wardId}/tickets/${ticketId}`
    );

    const ticketDoc = await getDoc(ticketRef);

    if (!ticketDoc.exists()) {
      throw new Error("Ticket not found");
    }

    return {
      id: ticketDoc.id,
      councilId,
      districtId,
      wardId,
      ...ticketDoc.data(),
      createdAt: ticketDoc.data().createdAt?.toDate(),
      updatedAt: ticketDoc.data().updatedAt?.toDate(),
      resolvedAt: ticketDoc.data().resolvedAt?.toDate(),
      assignedAt: ticketDoc.data().assignedAt?.toDate(),
    };
  } catch (error) {
    console.error("Error getting ticket details:", error);
    throw error;
  }
};
