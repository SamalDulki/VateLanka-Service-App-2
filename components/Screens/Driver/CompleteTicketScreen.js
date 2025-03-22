import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { COLORS } from "../../utils/Constants";
import CustomText from "../../utils/CustomText";
import Icon from "react-native-vector-icons/Feather";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import NotificationBanner from "../../utils/NotificationBanner";
import { completeTicket } from "../../services/ticketService";
import CustomConfirmDialog from "../../utils/CustomConfirmDialog";

export default function CompleteTicketScreen({ route, navigation }) {
  const { ticket, profile, onSuccess } = route.params;
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "success",
  });
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);

  const showNotification = (message, type = "error") => {
    setNotification({
      visible: true,
      message,
      type,
    });
  };

  const handleComplete = async () => {
    try {
      setLoading(true);

      await completeTicket(
        ticket.id,
        ticket.councilId,
        ticket.districtId,
        ticket.wardId,
        {
          notes,
          completedByName: profile.driverName || "Driver",
          completedByTruckId: profile.truckId,
        }
      );

      showNotification("Task completed successfully!", "success");

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          navigation.goBack();
        }, 1500);
      } else {
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      }
    } catch (error) {
      console.error("Error completing task:", error);
      showNotification("Failed to complete task. Please try again.", "error");
      setLoading(false);
    }
  };

  const confirmCompletion = () => {
    setConfirmDialogVisible(true);
  };

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
        <CustomText style={styles.headerTitle}>Complete Task</CustomText>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoid}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.taskInfoCard}>
            <View style={styles.taskInfoRow}>
              <Icon name="trash-2" size={20} color={COLORS.primary} />
              <CustomText style={styles.taskInfoLabel}>Waste Type:</CustomText>
              <CustomText style={styles.taskInfoValue}>
                {ticket.wasteType}
              </CustomText>
            </View>

            <View style={styles.taskInfoRow}>
              <Icon name="info" size={20} color={COLORS.primary} />
              <CustomText style={styles.taskInfoLabel}>Issue Type:</CustomText>
              <CustomText style={styles.taskInfoValue}>
                {ticket.issueType}
              </CustomText>
            </View>

            <View style={styles.taskInfoRow}>
              <Icon name="user" size={20} color={COLORS.primary} />
              <CustomText style={styles.taskInfoLabel}>
                Requested By:
              </CustomText>
              <CustomText style={styles.taskInfoValue}>
                {ticket.userName || "Anonymous"}
              </CustomText>
            </View>
          </View>

          <View style={styles.completionCard}>
            <View style={styles.sectionHeader}>
              <MaterialIcon
                name="task-alt"
                size={24}
                color={COLORS.successbanner}
              />
              <CustomText style={styles.sectionTitle}>
                Completion Details
              </CustomText>
            </View>

            <CustomText style={styles.notesLabel}>
              Add notes about the completed task (optional):
            </CustomText>

            <TextInput
              style={styles.notesInput}
              multiline
              placeholder="e.g., Collected all waste as requested, all materials properly sorted."
              placeholderTextColor={COLORS.placeholderTextColor}
              value={notes}
              onChangeText={setNotes}
              maxLength={500}
            />

            <View style={styles.charCountContainer}>
              <CustomText style={styles.charCount}>
                {notes.length}/500
              </CustomText>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Icon name="info" size={18} color={COLORS.primary} />
            <CustomText style={styles.infoText}>
              Marking this task as complete will notify the user and update your
              task list. This action cannot be undone.
            </CustomText>
          </View>

          <TouchableOpacity
            style={styles.completeButton}
            onPress={confirmCompletion}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Icon name="check-circle" size={20} color={COLORS.white} />
                <CustomText style={styles.completeButtonText}>
                  Mark as Complete
                </CustomText>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomConfirmDialog
        visible={confirmDialogVisible}
        title="Complete Task"
        message="Are you sure you want to mark this task as complete? This action cannot be undone."
        confirmText="Complete"
        cancelText="Cancel"
        onConfirm={() => {
          setConfirmDialogVisible(false);
          handleComplete();
        }}
        onCancel={() => setConfirmDialogVisible(false)}
        iconName="check-circle"
        iconColor={COLORS.successbanner}
        confirmButtonColor={COLORS.successbanner}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardAvoid: {
    flex: 1,
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
  content: {
    flex: 1,
    padding: 16,
  },
  taskInfoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  taskInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  taskInfoLabel: {
    fontSize: 14,
    color: COLORS.textGray,
    marginLeft: 10,
    width: 100,
  },
  taskInfoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.black,
    flex: 1,
  },
  completionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
    marginLeft: 10,
  },
  notesLabel: {
    fontSize: 14,
    color: COLORS.textGray,
    marginBottom: 10,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    textAlignVertical: "top",
    fontSize: 16,
    color: COLORS.black,
  },
  charCountContainer: {
    alignItems: "flex-end",
    marginTop: 5,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textGray,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textGray,
    marginLeft: 10,
    lineHeight: 20,
  },
  completeButton: {
    backgroundColor: COLORS.successbanner,
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  completeButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
});
