import React from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
} from "react-native";
import axios from "axios";
import { useState, useEffect } from "react";

// 📍 פונקציה עיקרית: שליפת רכבים לפי שם סניף
const fetchCarsForBranch = async (locationID) => {
  const { locationId } = route.params;
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/cars/getCarsByLocationID/${locationId}`
        );
        const data = await res.json();
        setCars(data);
      } catch (error) {
        console.error("Error fetching cars:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, [locationId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading cars...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Cars</Text>
      <FlatList
        data={cars}
        keyExtractor={(item) => item.carID.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.carTitle}>Model: {item.Model}</Text>
            <Text>Car ID: {item.carID}</Text>
            <Text>Price: ₪{item.pricePerMinute} / min</Text>
            <Text>Status: {item.status ? "Available" : "Not Available"}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  card: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
  },
  carTitle: { fontSize: 18, fontWeight: "bold" },
});

export default fetchCarsForBranch;
