import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { COLORS } from "../../utils/Constants";
import CustomText from "../../utils/CustomText";
import Icon from "react-native-vector-icons/Feather";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import NotificationBanner from "../../utils/NotificationBanner";
import { subscribeToAssignedTickets } from "../../services/ticketService";
import {
  formatTimeAgo,
  getStatusColor,
  getStatusText,
  getStatusBackgroundColor,
} from "../../utils/ticketUtils";
import { Linking } from "react-native";

export default function AssignedTicketsScreen({ route, navigation }) {
  const { profile } = route.params;
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    let unsubscribe = () => {};

    const loadTickets = async () => {
      try {
        if (!profile.truckId) {
          console.log("Missing truck ID for ticket query");
          setLoading(false);
          return;
        }

        unsubscribe = subscribeToAssignedTickets(
          profile.truckId,
          profile,
          (ticketsData) => {
            setTickets(ticketsData || []);
            setLoading(false);
            setRefreshing(false);
          }
        );
      } catch (error) {
        console.error("Error loading assigned tickets:", error);
        showNotification("Failed to load assigned tickets", "error");
        setLoading(false);
        setRefreshing(false);
      }
    };

    loadTickets();

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [profile]);

  useEffect(() => {
    applyFilters();
  }, [tickets, searchQuery, statusFilter]);

  const applyFilters = () => {
    let filtered = [...tickets];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ticket) =>
          (ticket.userName && ticket.userName.toLowerCase().includes(query)) ||
          (ticket.wasteType &&
            ticket.wasteType.toLowerCase().includes(query)) ||
          (ticket.issueType && ticket.issueType.toLowerCase().includes(query))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.status === statusFilter);
    }

    setFilteredTickets(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      if (refreshing) {
        setRefreshing(false);
      }
    }, 3000);
  };

  const showNotification = (message, type = "error") => {
    setNotification({
      visible: true,
      message,
      type,
    });
  };

  const handleTicketPress = (ticket) => {
    navigation.navigate("TicketDetail", {
      ticket,
      profile,
    });
  };

  const handleCallUser = (phoneNumber) => {
    if (!phoneNumber) {
      showNotification("User phone number not available", "error");
      return;
    }

    Linking.openURL(`tel:${phoneNumber}`)
      .then(() => console.log("Opening phone app"))
      .catch((err) => showNotification("Could not open phone app", "error"));
  };

  const renderTicketItem = ({ item }) => (
    <TouchableOpacity
      style={styles.ticketItem}
      onPress={() => handleTicketPress(item)}
    >
      <View style={styles.ticketHeader}>
        <View style={styles.ticketMain}>
          <CustomText style={styles.ticketType}>{item.issueType}</CustomText>
          <CustomText style={styles.ticketUser}>
            {item.userName || "Anonymous User"}
          </CustomText>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: getStatusBackgroundColor(item.status),
              borderColor: getStatusColor(item.status),
            },
          ]}
        >
          <CustomText
            style={[
              styles.statusText,
              {
                color: getStatusColor(item.status),
              },
            ]}
          >
            {getStatusText(item.status)}
          </CustomText>
        </View>
      </View>

      <View style={styles.ticketInfoRow}>
        <Icon name="trash-2" size={16} color={COLORS.textGray} />
        <CustomText style={styles.wasteTypeText}>{item.wasteType}</CustomText>
      </View>

      <View style={styles.ticketInfoRow}>
        <Icon name="clock" size={16} color={COLORS.textGray} />
        <CustomText style={styles.timeText}>
          {formatTimeAgo(item.assignedAt)} • Assigned to you
        </CustomText>
      </View>

      <View style={styles.actionRow}>
        {item.phoneNumber && (
          <TouchableOpacity
            style={[styles.actionButton, styles.callButton]}
            onPress={() => handleCallUser(item.phoneNumber)}
          >
            <MaterialIcon name="call" size={16} color={COLORS.white} />
            <CustomText style={styles.actionText}>Call</CustomText>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => handleTicketPress(item)}
        >
          <MaterialIcon name="visibility" size={16} color={COLORS.white} />
          <CustomText style={styles.actionText}>View</CustomText>
        </TouchableOpacity>

        {item.status === "assigned" && (
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={() => handleTicketPress(item)}
          >
            <MaterialIcon name="play-arrow" size={16} color={COLORS.white} />
            <CustomText style={styles.actionText}>Start</CustomText>
          </TouchableOpacity>
        )}

        {item.status === "in_progress" && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => handleTicketPress(item)}
          >
            <MaterialIcon name="check" size={16} color={COLORS.white} />
            <CustomText style={styles.actionText}>Complete</CustomText>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <NotificationBanner
        {...notification}
        onHide={() => setNotification((prev) => ({ ...prev, visible: false }))}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <CustomText style={styles.headerTitle}>Assigned Tasks</CustomText>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Icon name="search" size={20} color={COLORS.textGray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tickets..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Icon name="x" size={20} color={COLORS.textGray} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === "all" && styles.activeFilter,
            ]}
            onPress={() => setStatusFilter("all")}
          >
            <CustomText
              style={[
                styles.filterText,
                statusFilter === "all" && styles.activeFilterText,
              ]}
            >
              All
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === "assigned" && styles.activeFilter,
            ]}
            onPress={() => setStatusFilter("assigned")}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor("assigned") },
              ]}
            />
            <CustomText
              style={[
                styles.filterText,
                statusFilter === "assigned" && styles.activeFilterText,
              ]}
            >
              Assigned
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === "in_progress" && styles.activeFilter,
            ]}
            onPress={() => setStatusFilter("in_progress")}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor("in_progress") },
              ]}
            />
            <CustomText
              style={[
                styles.filterText,
                statusFilter === "in_progress" && styles.activeFilterText,
              ]}
            >
              In Progress
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === "resolved" && styles.activeFilter,
            ]}
            onPress={() => setStatusFilter("resolved")}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor("resolved") },
              ]}
            />
            <CustomText
              style={[
                styles.filterText,
                statusFilter === "resolved" && styles.activeFilterText,
              ]}
            >
              Completed
            </CustomText>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredTickets}
          renderItem={renderTicketItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="inbox" size={40} color={COLORS.textGray} />
              <CustomText style={styles.emptyText}>
                {searchQuery || statusFilter !== "all"
                  ? "No tickets match your filters"
                  : "No tickets assigned to you yet"}
              </CustomText>
            </View>
          }
        />
      )}
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGray,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
  },
  searchContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGray,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    color: COLORS.black,
  },
  filtersContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGray,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
  },
  activeFilter: {
    backgroundColor: COLORS.primary + "20",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.textGray,
  },
  activeFilterText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  listContainer: {
    padding: 15,
  },
  ticketItem: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  ticketMain: {
    flex: 1,
  },
  ticketType: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 4,
  },
  ticketUser: {
    fontSize: 14,
    color: COLORS.textGray,
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  ticketInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  wasteTypeText: {
    fontSize: 14,
    color: COLORS.textGray,
    marginLeft: 8,
  },
  timeText: {
    fontSize: 14,
    color: COLORS.textGray,
    marginLeft: 8,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  callButton: {
    backgroundColor: COLORS.primary,
  },
  viewButton: {
    backgroundColor: COLORS.completed,
  },
  startButton: {
    backgroundColor: COLORS.primary,
  },
  completeButton: {
    backgroundColor: COLORS.successbanner,
  },
  actionText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textGray,
    textAlign: "center",
    marginTop: 10,
  },
});
