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
} from "react-native";

export default function DailyReport() {
  const [date, setDate] = useState("");
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
  if(!date || !area || !description){
    Alert.alert("Error", "Please fill in all fields before submiting.");
    return
  }

  Alert.alert("Success", "Report submitted successfully!",[
    {text: "OK", onPress: () => console.log("Report Submitted")},
  ]);

  // Reset fields
  setDate("");
  setArea("");
  setDescription("");
};




return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Waste Delivery Report</Text>

        <Text style={styles.label}>Delivery Date</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter delivery date (e.g., 2025-06-20)"
          value={date}
          onChangeText={setDate}
        />

        <Text style={styles.label}>Delivery Area</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter area (e.g., Westminster)"
          value={area}
          onChangeText={setArea}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe the delivery..."
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit Report</Text>
        </TouchableOpacity>
      </ScrollView>
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
  submitButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
});





