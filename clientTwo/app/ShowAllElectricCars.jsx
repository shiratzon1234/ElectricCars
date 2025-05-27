import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import axios from "axios";
import { useState, useEffect } from "react";

const ShowAllCarsScreen = () => {
  // שליפת כל הרכבים הקיימים
  const [cars, setCars] = useState([]);

  useEffect(() => {
    console.log("hello");
    // שליפת נתונים מה-API
    const endpoint = "http://localhost:5000/api/cars/getCar";
    axios
      .get("http://localhost:5000/api/cars/getCar")
      .then((response) => {
        console.log(`list of all cars from the endpoint ${endpoint}}`);
        setCars(response.data.ElectricCars || []);
      })
      .catch((error) => {
        console.error("There was an error fetching the rentals!", error);
      });
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>השכרת רכבים</Text>

      {cars.map((Car) => (
        <View key={Car.id} style={styles.rentalCard}>
          <Text style={styles.carModel}>{Car.carModel}</Text>
          <View style={styles.rentalDetails}>
            <Image source={{ uri: Car.imageUrl }} style={styles.carImage} />
            <Text>
              <Text style={styles.headerDetails}>סוג הרכב :</Text> {Car.model}
            </Text>
            <Text>
              <Text style={styles.headerDetails}>מספר הרכב :</Text> {Car.carID}
            </Text>
            <Text>
              <Text style={styles.headerDetails}> מחיר לפי דקות :</Text> ₪
              {Car.pricePerMinute}
            </Text>
            <Text>
              <Text style={styles.status}>סטטוס:</Text>{" "}
              {Car.status ? "זמין" : "לא זמין"}{" "}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0ffff",
    padding: 15,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  rentalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.2)",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  carModel: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  rentalDetails: {
    gap: 5,
  },
  headerDetails: {
    fontWeight: "bold",
  },
  status: {
    marginTop: 5,
    fontWeight: "bold",
    color: "#008080",
  },
});

export default ShowAllCarsScreen;
