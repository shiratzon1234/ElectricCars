import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Switch,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ShowRoutesAccordingUser() {
  const navigation = useNavigation();
  const [pickupLocation, setPickupLocation] = useState("");
  const [destinationLocation, setDestinationLocation] = useState("");
  const [routeDetails, setRouteDetails] = useState(null);
  const [selectedCar, setSelectedCar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [allowReplacement, setAllowReplacement] = useState(true);
  const [maxChargeWaitTime, setMaxChargeWaitTime] = useState("15");

  const [carModel, setCarModel] = useState("");
  const [PricePerMinute, setPrice] = useState("");
  const [NumberOfPlaces, setNumberOfPlaces] = useState("");

  // For choosing concrete car
  const [carId, setCarId] = useState(null);

  useEffect(() => {
    const loadSelectedCar = async () => {
      try {
        const savedCarId = await AsyncStorage.getItem("selectedCarId");
        if (savedCarId) {
          setCarId(savedCarId);
          console.log("Loaded car ID from storage:", savedCarId);
        }
      } catch (error) {
        console.error("Error loading car ID from storage:", error);
      }
    };
    loadSelectedCar();
  }, []);

  let carRequirements = null;
  let stationId = null;
  let forceRoute = true;
  let apiKey = "AIzaSyDfBzegymp06dsAWHvtcSm1ztrly16-Hss";

  // Function to handle route calculation
  const handleRoutes = async () => {
    console.log("Calculating route...");
    if (!pickupLocation || !destinationLocation) {
      Alert.alert("שגיאה", "נא למלא את הכתובות");
      return;
    }

    try {
      setLoading(true);

      // המרת כתובות לקואורדינטות
      const pickupRes = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          pickupLocation
        )}&key=${apiKey}`
      );

      if (!pickupRes.data.results || pickupRes.data.results.length === 0) {
        Alert.alert("שגיאה", "כתובת המוצא לא נמצאה");
        setLoading(false);
        return;
      }

      const source = pickupRes.data.results[0].geometry.location;

      const destRes = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          destinationLocation
        )}&key=${apiKey}`
      );

      if (!destRes.data.results || destRes.data.results.length === 0) {
        Alert.alert("שגיאה", "כתובת היעד לא נמצאה");
        setLoading(false);
        return;
      }

      const dest = destRes.data.results[0].geometry.location;

      // Check if any car filters are set
      const hasCarFilters =
        carModel.trim() || PricePerMinute.trim() || NumberOfPlaces.trim();

      // Create carRequirements only if any filter is set
      carRequirements = hasCarFilters
        ? {
            carType: carModel.trim() || null,
            minPassengers: NumberOfPlaces.trim()
              ? parseInt(NumberOfPlaces.trim())
              : null,
            maxPricePerMinute: PricePerMinute.trim()
              ? parseFloat(PricePerMinute.trim())
              : null,
          }
        : null;

      // מעבר למסך שמציג את הרכבים הזמינים
      // navigation.navigate("UserRentalsScreen", {
      //   stationId: source,
      //   carRequirements: carRequirements,
      //   forceRoute: allowReplacement,
      // });

      console.log(
        `selectedCarId: ${await AsyncStorage.getItem("selectedCarId")}`
      );

      // בניית אובייקט לשליחה לשרת
      const requestData = {
        source: {
          latitude: source.lat,
          longitude: source.lng,
        },
        dest: {
          latitude: dest.lat,
          longitude: dest.lng,
        },
        destName: { destinationLocation },
        filters: {
          carRequirements,
          allowCarSwitch: allowReplacement,
          maxWaitTime: maxChargeWaitTime.trim()
            ? parseInt(maxChargeWaitTime.trim())
            : 15,
          forceRoute: true,
        },
        carId: await AsyncStorage.getItem("selectedCarId"),
      };

      console.log(
        "שולח בקשה עם פרמטרים:",
        JSON.stringify(requestData, null, 2)
      );

      // שליחת הבקשה לשרת
      console.log(`Before algorithm call : ${JSON.stringify(requestData)}`);
      const response = await axios.post(
        "http://localhost:5000/api/get-optimize-path",
        requestData
      );

      setLoading(false);

      if (response.data && response.data.success) {
        setRouteDetails(response.data.route);
        setSelectedCar(response.data.selectedCar);
        console.log(
          `See the router details ${JSON.stringify(response.data.route)}`
        );

        // הצגת הודעה עם פרטי המסלול הבסיסיים וכפתור אישור
        let message = `מרחק כולל: ${(
          response.data.route.Distance / 1000
        ).toFixed(2)} ק"מ\n`;
        if (response.data.route.TotalTime) {
          message += `זמן כולל: ${response.data.route.TotalTime} דקות\n\n`;
        }
        message += `רכב נבחר: ${
          response.data.selectedCar.carID || response.data.selectedCar._id
        }\n`;
        message += `סוללה: ${response.data.selectedCar.batteryAmount}%\n\n`;
        message += "האם ברצונך לאשר את המסלול ולשריין את הרכב?";

        Alert.alert("המסלול חושב בהצלחה", message, [
          {
            text: "בטל",
            style: "cancel",
          },
          {
            text: "אשר מסלול",
            onPress: () =>
              confirmRoute(
                response.data.selectedCar.carID || response.data.selectedCar._id
              ),
          },
        ]);
        return;
      } else if (
        response.data &&
        response.data.reason === "charge_exceeds_limit"
      ) {
        alert(
          "⏱ זמן טעינה חורג",
          `זמן הטעינה הצפוי הוא ${response.data.timeToCharge} דקות, אך ציינת מגבלה של ${response.data.maxAllowed} דקות.\nהאם להציג את המסלול בכל זאת?`,
          [
            {
              text: "לא",
              style: "cancel",
            },
            {
              text: "כן, הצג מסלול",
              onPress: () => {
                setRouteDetails({
                  Description: response.data.description,
                  TotalTime: response.data.timeToCharge,
                });
              },
            },
          ]
        );
        return;
      } else if (response.data && !response.data.success) {
        Alert.alert("שגיאה", response.data.message || "לא נמצא מסלול מתאים");
      } else {
        Alert.alert("שגיאה", "לא נמצא מסלול");
      }
    } catch (error) {
      setLoading(false);
      console.error("שגיאה בשליפת נתיב:", error);

      let errorMessage = "שגיאה בשליפת הנתיב";
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        errorMessage = error.response.data.message;
      }

      Alert.alert("שגיאה", errorMessage);
    }
  };

  const handleAvailableCars = async (navigation) => {
    console.log("Navigating to UserRentals");
    const pickupRes = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        pickupLocation
      )}&key=${apiKey}`
    );

    console.log(
      `Pickup coordinates: ${pickupRes.data.results[0].geometry.location.lat}, ${pickupRes.data.results[0].geometry.location.lng}`
    );

    const source = pickupRes.data.results[0].geometry.location;

    console.log(`Source coordinates: ${source.lat}, ${source.lng}`);

    const response = await axios.post(
      "http://localhost:5000/api/get-closest-pickup",
      {
        latitude: source.lat,
        longitude: source.lng,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log(
      `Response data from server in closest pickup location: ${JSON.stringify(
        response.data
      )}`
    );
    stationId = response.data.pickupPoint.id;
    console.log(`###Extracted stationId: ${stationId}####`);
    navigation.navigate("UserRentals", {
      stationId: stationId,
      carRequirements: null,
      forceRoute: true,
    });
  };

  // Function to confirm the route and update car status
  const confirmRoute = async (carId) => {
    try {
      setConfirming(true);

      const response = await axios.post(
        "http://localhost:5000/api/confirm-route",
        { carId }
      );

      setConfirming(false);

      if (response.data && response.data.success) {
        Alert.alert(
          "המסלול אושר",
          "הרכב שוריין עבורך בהצלחה. ניתן לצאת לדרך!",
          [{ text: "אישור" }]
        );
      } else {
        Alert.alert(
          "שגיאה באישור המסלול",
          response.data?.message || "לא ניתן היה לשריין את הרכב",
          [{ text: "אישור" }]
        );
      }
    } catch (error) {
      setConfirming(false);
      console.error("שגיאה באישור המסלול:", error);

      let errorMessage = "שגיאה באישור המסלול";
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        errorMessage = error.response.data.message;
      }

      Alert.alert("שגיאה", errorMessage);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }} // paddingBottom מוסיף מקום לגלילה
      showsVerticalScrollIndicator={true} // מציג פס גלילה
    >
      <Text style={styles.header}>הצגת מסלול אופטימלי</Text>

      <View style={styles.formContainer}>
        <Text style={styles.label}>נקודת מוצא</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.inputField}
            placeholder="הקלד כתובת התחלה..."
            value={pickupLocation}
            onChangeText={setPickupLocation}
            placeholderTextColor="#888"
          />
        </View>

        <Text style={styles.label}>נקודת יעד</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.inputField}
            placeholder="הקלד כתובת יעד..."
            value={destinationLocation}
            onChangeText={setDestinationLocation}
            placeholderTextColor="#888"
          />
        </View>
      </View>

      <View
        style={{
          flexDirection: "row-reverse",
          alignItems: "center",
          justifyContent: "flex-start",
          width: "90%",
          marginBottom: 10,
          alignSelf: "center",
        }}
      >
        <Text style={{ fontSize: 16, marginLeft: 10, textAlign: "right" }}>
          האם לאפשר החלפת רכב?
        </Text>
        <Switch value={allowReplacement} onValueChange={setAllowReplacement} />
      </View>

      <View style={styles.extraField}>
        <Text style={styles.label}>כמה זמן תסכים להמתין לטעינה? (בדקות)</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.inputField}
            placeholder="למשל: 15"
            value={maxChargeWaitTime}
            onChangeText={setMaxChargeWaitTime}
            keyboardType="numeric"
            placeholderTextColor="#888"
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="חשב מסלול "
          onPress={handleRoutes}
          color="#3b7c72"
          disabled={loading || confirming}
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="הצג את כל הרכבים זמינים "
          onPress={() =>
            handleAvailableCars(navigation, {
              stationId,
              carRequirements: carRequirements,
              forceRoute,
            })
          }
          color="#000080"
          disabled={loading || confirming}
        />
      </View>

      {(loading || confirming) && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>
            {loading ? "מחשב מסלול אופטימלי..." : "משריין את הרכב..."}
          </Text>
        </View>
      )}

      {routeDetails && !loading && !confirming && (
        <View style={styles.resultsContainer}>
          <Text style={styles.sectionHeader}>תיאור המסלול:</Text>
          <Text style={styles.routeDescription}>
            {routeDetails.Description.split("->").map((step, index) => (
              <Text key={index} style={styles.routeDescription}>
                {step.trim()}
                {index < routeDetails.Description.split("->").length - 1
                  ? " ->\n"
                  : ""}
              </Text>
            ))}
          </Text>

          <Text style={styles.sectionHeader}>מרחק כולל:</Text>
          <Text style={styles.routeData}>
            {(routeDetails.Distance / 1000).toFixed(2)} ק"מ
          </Text>

          {routeDetails.TotalTime && (
            <>
              <Text style={styles.sectionHeader}>זמן כולל:</Text>
              <Text style={styles.routeData}>
                {routeDetails.TotalTime} דקות
              </Text>
            </>
          )}

          {selectedCar && (
            <>
              <Text style={styles.sectionHeader}>פרטי הרכב:</Text>
              <Text style={styles.routeData}>
                מזהה: {selectedCar.carID || selectedCar._id}
              </Text>
              <Text style={styles.routeData}>
                סוללה: {selectedCar.batteryAmount}%
              </Text>
              {selectedCar.CarType && (
                <Text style={styles.routeData}>סוג: {selectedCar.CarType}</Text>
              )}
              {selectedCar.PassengerCapacity && (
                <Text style={styles.routeData}>
                  מקומות: {selectedCar.PassengerCapacity}
                </Text>
              )}
            </>
          )}

          <View style={styles.confirmButtonContainer}>
            <Button
              title="אשר מסלול ושריין רכב"
              onPress={() => {
                confirmRoute(selectedCar.carID || selectedCar._id);
                navigation.navigate("CarRental", {
                  car: selectedCar,
                  startDate: Date.now(),
                  //endDate: Date.now(),
                  userID: 1,
                });
              }}
              color="#006400"
              disabled={confirming}
            />
          </View>

          <Text style={styles.sectionHeader}>כל הנתונים מהשרת:</Text>
          <Text style={styles.jsonData}>
            {JSON.stringify(routeDetails, null, 2)}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#e6f7f5",
  },
  header: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: "center",
    fontWeight: "bold",
    color: "#333",
  },
  formContainer: {
    alignItems: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 5,
    alignSelf: "flex-end",
    marginRight: "5%",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: "90%",
    elevation: 3,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 12,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    textAlign: "right",
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 18,
    alignSelf: "center",
    width: 180,
    borderRadius: 8,
    overflow: "hidden",
  },
  confirmButtonContainer: {
    marginTop: 20,
    marginBottom: 20,
    alignSelf: "center",
    width: 220,
    borderRadius: 8,
    overflow: "hidden",
  },
  extraField: {
    width: "90%",
    marginBottom: 10,
    alignSelf: "center",
    textAlign: "right",
  },
  inputContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    width: "30%",
    marginHorizontal: 5,
    textAlign: "right",
    backgroundColor: "#fff",
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
  resultsContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
    marginBottom: 5,
    textAlign: "right",
  },
  routeDescription: {
    fontSize: 16,
    color: "#333",
    textAlign: "right",
    lineHeight: 22,
  },
  routeData: {
    fontSize: 16,
    color: "#333",
    textAlign: "right",
  },
  jsonData: {
    fontFamily: "monospace",
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 8,
    fontSize: 12,
  },
});
