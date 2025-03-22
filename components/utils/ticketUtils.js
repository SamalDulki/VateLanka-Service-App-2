import { firestore } from "./firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { COLORS } from "./Constants";

// Fetch pending tickets count
export const fetchPendingTicketsCount = async (profile) => {
    if (!profile?.municipalCouncil || !profile?.district || !profile?.ward) {
      return 0;
    }
  
    try {
      const ticketsRef = collection(
        firestore,
        `municipalCouncils/${profile.municipalCouncil}/Districts/${profile.district}/Wards/${profile.ward}/tickets`
      );
  
      const q = query(ticketsRef, where("status", "==", "pending"));
      const snapshot = await getDocs(q);
  
      return snapshot.size;
    } catch (error) {
      console.error("Error fetching pending tickets count:", error);
      return 0;
    }
  };
  
  // Subscribe to pending tickets count changes
  export const subscribeToPendingTickets = (profile, callback) => {
    if (!profile?.municipalCouncil || !profile?.district || !profile?.ward) {
      callback(0);
      return () => {};
    }
  
    try {
      const ticketsRef = collection(
        firestore,
        `municipalCouncils/${profile.municipalCouncil}/Districts/${profile.district}/Wards/${profile.ward}/tickets`
      );
  
      const q = query(ticketsRef, where("status", "==", "pending"));
  
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          callback(snapshot.size);
        },
        (error) => {
          console.error("Error in pending tickets subscription:", error);
          callback(0);
        }
      );
  
      return unsubscribe;
    } catch (error) {
      console.error("Error setting up pending tickets subscription:", error);
      callback(0);
      return () => {};
    }
  };
  
  // Fetch assigned tickets count for a driver
  export const fetchAssignedTicketsCount = async (truckId, profile) => {
    if (!profile?.municipalCouncil || !profile?.district || !profile?.ward || !truckId) {
      return 0;
    }
  
    try {
      const ticketsRef = collection(
        firestore,
        `municipalCouncils/${profile.municipalCouncil}/Districts/${profile.district}/Wards/${profile.ward}/tickets`
      );
  
      const q = query(
        ticketsRef, 
        where("assignedTo", "==", truckId),
        where("status", "!=", "resolved")
      );
      
      const snapshot = await getDocs(q);
  
      return snapshot.size;
    } catch (error) {
      console.error("Error fetching assigned tickets count:", error);
      return 0;
    }
  };
  
  // Subscribe to assigned tickets count for a driver
  export const subscribeToAssignedTicketsCount = (truckId, profile, callback) => {
    if (!profile?.municipalCouncil || !profile?.district || !profile?.ward || !truckId) {
      callback(0);
      return () => {};
    }
  
    try {
      const ticketsRef = collection(
        firestore,
        `municipalCouncils/${profile.municipalCouncil}/Districts/${profile.district}/Wards/${profile.ward}/tickets`
      );
  
      const q = query(
        ticketsRef, 
        where("assignedTo", "==", truckId),
        where("status", "!=", "resolved")
      );
  
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          callback(snapshot.size);
        },
        (error) => {
          console.error("Error in assigned tickets subscription:", error);
          callback(0);
        }
      );
  
      return unsubscribe;
    } catch (error) {
      console.error("Error setting up assigned tickets subscription:", error);
      callback(0);
      return () => {};
    }
  };
  
  // Format time ago for timestamps
  export const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "";
  
    const now = new Date();
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const seconds = Math.round((now - date) / 1000);
  
    if (seconds < 60) return "just now";
  
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
  
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
  
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
  
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  };
  
  // Format date for display
  export const formatDate = (date) => {
    if (!date) return "N/A";
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };
  
  // Serialize ticket for navigation
  export const serializeTicket = (ticket) => {
    if (!ticket) return null;
  
    return {
      ...ticket,
      createdAt: ticket.createdAt ? ticket.createdAt.toISOString() : null,
      updatedAt: ticket.updatedAt ? ticket.updatedAt.toISOString() : null,
      resolvedAt: ticket.resolvedAt ? ticket.resolvedAt.toISOString() : null,
      assignedAt: ticket.assignedAt ? ticket.assignedAt.toISOString() : null,
    };
  };
  
  // Parse ticket dates from strings to Date objects
  export const parseTicketDates = (ticket) => {
    if (!ticket) return null;
  
    return {
      ...ticket,
      createdAt: ticket.createdAt ? new Date(ticket.createdAt) : null,
      updatedAt: ticket.updatedAt ? new Date(ticket.updatedAt) : null,
      resolvedAt: ticket.resolvedAt ? new Date(ticket.resolvedAt) : null,
      assignedAt: ticket.assignedAt ? new Date(ticket.assignedAt) : null,
    };
  };
  
  // Get status color
  export const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return COLORS.notificationYellow;
      case "assigned":
        return COLORS.primary;
      case "in_progress":
        return COLORS.completed; // Blue
      case "resolved":
        return COLORS.successbanner;
      case "cancelled":
        return COLORS.errorbanner;
      default:
        return COLORS.textGray;
    }
  };
  
  // Get status text
  export const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "assigned":
        return "Assigned";
      case "in_progress":
        return "In Progress";
      case "resolved":
        return "Resolved";
      case "cancelled":
        return "Cancelled";
      default:
        return "Unknown";
    }
  };
  
  // Get background color with transparency for status
  export const getStatusBackgroundColor = (status) => {
    return getStatusColor(status) + "20";
  };