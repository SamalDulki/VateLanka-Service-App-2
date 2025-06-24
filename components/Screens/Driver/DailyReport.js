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
}

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
}


