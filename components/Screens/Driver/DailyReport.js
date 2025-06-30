import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";

export default function DailyReport() {
  const [date, setDate] = useState("");
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    // Trim input values
    if (!date.trim() || !area.trim() || !description.trim()) {
      Alert.alert("Error", "Please fill in all fields before submitting.");
      return;
    }

    setIsSubmitting(true);

    // Simulate API submission delay
    setTimeout(() => {
      setIsSubmitting(false);

      // Show confirmation alert after successful submission
      Alert.alert(
        "Success",
        "Report submitted successfully!\n\nWould you like to clear the form?",
        [
          {
            text: "Keep Form",
            style: "cancel",
            onPress: () => console.log("User chose to keep form data"),
          },
          {
            text: "Clear Form",
            style: "destructive",
            onPress: () => {
              setDate("");
              setArea("");
              setDescription("");
              console.log("Form cleared after submission");
            },
          },
        ],
        { cancelable: false }
      );
    }, 1500); // Simulate 1.5 second delay
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Waste Delivery Report</Text>

          <Text style={styles.label}>Delivery Date</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 2025-06-30"
            value={date}
            onChangeText={setDate}
            accessibilityLabel="Delivery Date Input"
          />

          <Text style={styles.label}>Delivery Area</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Colombo 03"
            value={area}
            onChangeText={setArea}
            accessibilityLabel="Delivery Area Input"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the delivery..."
            value={description}
            onChangeText={setDescription}
            multiline
            accessibilityLabel="Description Input"
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Report</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    color: "#555",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#A5D6A7",
  },
  submitButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
});
