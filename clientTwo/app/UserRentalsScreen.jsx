import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Button,
  Alert,
  TextInput,
  Platform,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import { Image } from "react-native";
import { useNavigation } from "@react-navigation/native"; // Import navigation hook
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; // רק ב-Web

const ShowAvailableCarsScreen = ({ route }) => {
  const navigation = useNavigation();
  const { stationId, carRequirement, forceRoute } = route.params;
  // אנחנו מקבלים את הסינון כבר מניווט קודם, מתוך route.params
  console.log(
    `Parameters received: ${stationId}, ${carRequirement}, ${forceRoute}`
  );
  const [cars, setCars] = useState([]);
  const [selectedCarId, setSelectedCarId] = useState(null);

  const [carModel, setCarModel] = useState("");
  const [pricePerMinute, setPrice] = useState("");
  const [numberOfPlaces, setNumberOfPlaces] = useState("");
  const [showFields, setShowFields] = useState(false);
  const [startDate, setPickupDate] = useState("");
  const [endDate, setReturnDate] = useState("");
  //משתנה בוליאני כדי לדעת אם יש רכבים מסוננים
  const [hasFiltered, setHasFiltered] = useState(false);
  const [filteredCars, setFilteredCars] = useState([]);

  // סטייטים ללוח שנה
  const [isPickupDatePickerVisible, setPickupDatePicskerVisible] =
    useState(false);
  const [isReturnDatePickerVisible, setReturnDatePickerVisible] =
    useState(false);

  // הצגת לוח שנה
  const showPickupDatePicker = () => setPickupDatePickerVisible(true);
  const hidePickupDatePicker = () => setPickupDatePickerVisible(false);

  const showReturnDatePicker = () => setReturnDatePickerVisible(true);
  const hideReturnDatePicker = () => setReturnDatePickerVisible(false);

  const handleReturnConfirm = (date) => {
    setReturnDate(date.toISOString());
    hideReturnDatePicker();
  };

  useEffect(() => {
    const fetchAvailableCars = async () => {
      try {
        const response = await axios.post(
          "http://localhost:5000/api/get-available-cars",
          {
            stationId: stationId,
            carRequirement: carRequirement,
            forceRoute: forceRoute,
          }
        );

        if (response.data) {
          setCars(response.data);
        } else {
          setCars([]);
        }
      } catch (error) {
        console.error("שגיאה בשליפת רכבים זמינים:", error);
      }
    };

    fetchAvailableCars();
  }, []);

  const handleSelectCar = async (car) => {
    const carId = car.carID;
    setSelectedCarId(carId);
    console.log("Selected Car", carId);
    await AsyncStorage.setItem("selectedCarId", carId);

    // Show confirmation alert with navigation option
    Alert.alert("✅ רכב נבחר", `בחרת את הרכב עם מזהה: ${carId}`, [
      {
        text: "חזור למסך הראשי",
        onPress: () =>
          navigation.navigate("ShowRoutesAccordingUser", {
            selectedCarId: carId,
            stationId: stationId,
            carRequirement: carRequirement,
            forceRoute: forceRoute,
          }),
      },
      {
        text: "ביטול",
        style: "cancel",
      },
    ]);
  };

  const handleFiilter = async () => {
    console.log(`The end date is: ${endDate}`);
    setHasFiltered(true);
    try {
      // בדוק אם הערכים לא ריקים לפני שליחה
      /**if (!carModel || !pricePerMinute) {
        Alert.alert("❌ שגיאה", "יש להזין את כל השדות");
        return;
      }*/

      console.log("Inside handleFiilter");
      console.log(carModel);
      console.log(pricePerMinute);
      console.log(numberOfPlaces);

      const response = await axios.post(
        "http://localhost:5000/api/cars/filter",
        { model: carModel, pricePerMinute, numberOfPlaces, cars }
      );

      console.log(carModel);
      console.log("Server response:", response);
      console.log("Filtered cars from server:", response.data);

      if (response.status === 200) {
        console.log("Filtered cars:", response.data);
        setFilteredCars(response.data); // ← שמירת התוצאות
        if (response.data.length == 0) {
          alert("אין רכבים זמינים לפי הסינון שלך");
        }
      } else {
        Alert.alert("❌ שגיאה", response.data.message);
      }
    } catch (error) {
      console.log("Error:", error);
      // טיפול בשגיאות רשת
      const errorMessage =
        error.response?.data?.message || "אירעה שגיאה בעת חיבור לשרת";
      Alert.alert("❌ שגיאה", errorMessage);
    }
  };

  const handleFilterDate = async () => {
    try {
      console.log(cars);
      const results = await Promise.all(
        cars.map(async (car) => {
          const response = await fetch(
            "http://localhost:5000/api/is-dates-available",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                startDate,
                endDate,
                carId: car.carID,
              }),
            }
          );
          const data = await response.json();
          return { car, isAvailable: data.isAvailable };
        })
      );
      const availableCars = results
        .filter((r) => r.isAvailable)
        .map((r) => r.car);
      console.log("Available cars:", availableCars);
      // Optionally update state to show only available cars
      setFilteredCars(availableCars);
    } catch (error) {
      console.error("Error checking car availability:", error);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      <Text style={styles.header}>רכבים זמינים עבורך</Text>
      <View>
        {/* שדות סינון */}
        <View style={styles.filterRow}>
          <TextInput
            style={styles.filterInput}
            placeholder="סוג רכב"
            value={carModel}
            onChangeText={setCarModel}
          />
          <TextInput
            style={styles.filterInput}
            placeholder="מחיר מקסימלי לדקה"
            value={pricePerMinute}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.filterInput}
            placeholder="מספר מקומות"
            value={numberOfPlaces}
            onChangeText={setNumberOfPlaces}
            keyboardType="numeric"
          />
          <View style={styles.filterButton}>
            <Button title="סנן" onPress={handleFiilter} color="#00008b" />
          </View>
        </View>

        {/* שורת לוח שנה וכפתור סינון */}
        <View style={styles.dateRow}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>מתי תחזירו?</Text>
            {Platform.OS !== "web" ? (
              <TouchableOpacity
                onPress={() => setReturnDatePickerVisible(true)}
                style={styles.dateInputWrapper}
              >
                <Text style={styles.dateInput}>{endDate || "בחרו תאריך"}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.datePickerContainer}>
                <DatePicker
                  selected={endDate ? new Date(endDate) : null}
                  onChange={(date) => handleReturnConfirm(date)}
                  showTimeSelect
                  withPortal={true}
                  popperPlacement="auto"
                  popperModifiers={{
                    preventOverflow: {
                      enabled: true,
                      escapeWithReference: false,
                      boundariesElement: "viewport",
                    },
                  }}
                  customInput={
                    <TouchableOpacity style={styles.dateInputWrapper}>
                      <Text style={styles.dateInput}>
                        {endDate || "בחרו תאריך"}
                      </Text>
                    </TouchableOpacity>
                  }
                />
              </View>
            )}
            <TextInput
              style={styles.smallInput}
              value={endDate}
              editable={false}
            />
            {Platform.OS !== "web" && (
              <DateTimePickerModal
                isVisible={isReturnDatePickerVisible}
                mode="date"
                onConfirm={handleReturnConfirm}
                onCancel={hideReturnDatePicker}
                date={endDate ? new Date(endDate) : new Date()}
              />
            )}
          </View>

          <View style={styles.filterButton}>
            <Button title="סנן" onPress={handleFilterDate} color="#00008b" />
          </View>
        </View>
      </View>

      {/* Wrap cars in a separate container with its own stacking context */}
      <View style={styles.carListContainer}>
        {cars.length > 0 ? (
          (filteredCars.length == 0 ? cars : filteredCars).map((Car) => (
            <View key={Car._id} style={styles.carCard}>
              <Image
                source={{ uri: Car.imageUrl }}
                style={styles.carImage}
                resizeMode="cover"
              />
              <View style={styles.carInfo}>
                <Text style={styles.carText}>
                  <Text style={styles.bold}>מספר רכב :</Text> {Car.carID}
                </Text>
                <Text style={styles.carText}>
                  <Text style={styles.bold}>🚗 דגם:</Text> {Car.model}
                </Text>
                <Text style={styles.carText}>
                  <Text style={styles.bold}>💸 מחיר לדקה:</Text> ₪
                  {Car.pricePerMinute}
                </Text>
                <Text style={styles.carText}>
                  <Text style={styles.bold}>🔋 סוללה:</Text> {Car.batteryAmount}
                  %
                </Text>
                <Text style={styles.carText}>
                  <Text style={styles.bold}>🧍‍♂️ מקומות ישיבה:</Text>{" "}
                  {Car.numberOfPlaces}
                </Text>
                <Text style={styles.carText}>
                  <Text style={styles.bold}>🔓 סטטוס:</Text>{" "}
                  {Car.status ? "זמין" : "לא זמין"}
                </Text>
                <View style={styles.reserveButtonWrapper}>
                  <Button
                    title="בחר רכב זה"
                    onPress={() => handleSelectCar(Car)}
                    color="#00008b"
                  />
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noCars}>אין רכבים זמינים לפי הסינון שלך.</Text>
        )}

        {selectedCarId && (
          <View style={styles.selectionResult}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>
              מספר מזהה הרכב שנבחר : {selectedCarId}
            </Text>
            <View style={styles.continueButtonWrapper}>
              <Button
                title="חזור למסך חישוב מסלול"
                onPress={() =>
                  navigation.navigate("ShowRoutesAccordingUser", {
                    selectedCarId: selectedCarId,
                  })
                }
                color="#4169E1"
              />
            </View>
          </View>
        )}
      </View>
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
    elevation: 5,
  },
  carModel: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 18,
    alignSelf: "center",
    width: 180,
    borderRadius: 8,
    //overflow: "hidden",
  },
  rentalDetails: {
    gap: 5,
  },
  status: {
    marginTop: 5,
    fontWeight: "bold",
    color: "#008080",
  },
  buttonWrapper: {
    marginTop: 10,
  },
  continueButtonWrapper: {
    marginTop: 15,
    width: "100%",
  },
  selectionResult: {
    marginTop: 20,
    alignItems: "center",
    padding: 15,
    backgroundColor: "#e6f7ff",
    borderRadius: 10,
  },
  noCars: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
    color: "red",
  },
  filterRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
  },
  filterInput: {
    width: 120,
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    textAlign: "right",
    backgroundColor: "#fff",
  },
  filterButton: {
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  carCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    elevation: 3,
    width: "30%", // Keep your width setting
  },
  carImage: {
    width: 120,
    height: 90,
    borderRadius: 10,
    marginLeft: 12,
  },
  carInfo: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  carText: {
    fontSize: 16,
    marginBottom: 4,
    textAlign: "right",
  },
  bold: {
    fontWeight: "bold",
  },
  reserveButtonWrapper: {
    marginTop: 10,
    alignSelf: "flex-start",
  },
  test: {
    position: "relative",
    zIndex: 9999,
  },
  dateInput: {
    textAlign: "center",
  },
  inputContainer: {
    position: "relative",
    zIndex: 1000,
    marginBottom: 10,
  },
  label: {
    marginBottom: 5,
    fontWeight: "bold",
    textAlign: "right",
  },
  dateInputWrapper: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
    minWidth: 120,
    alignItems: "center",
    zIndex: 1000,
  },
  smallInput: {
    height: 35,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    marginTop: 5,
    backgroundColor: "#f9f9f9",
    textAlign: "center",
  },
  datePickerContainer: {
    position: "relative",
    zIndex: 9999,
    isolation: "isolate",
  },
  dateRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
    position: "relative",
    zIndex: 2000,
  },
  // New style for car list container
  carListContainer: {
    position: "relative",
    zIndex: 1,
    marginTop: 20,
    display: "flex",
    flexDirection: "column", // Changed to column for vertical stacking
    alignItems: "center",
    width: "90%",
  },
});

export default ShowAvailableCarsScreen;
