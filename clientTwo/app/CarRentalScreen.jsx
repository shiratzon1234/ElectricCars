import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Button,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Modal,
} from "react-native";
import { useState } from "react";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; // רק ב-Web

const CarRental = ({ route }) => {
  const { car, startDate, userID } = route.params;
  const startLocationID = car.stationID;
  const [cardNumber, setCardNumber] = useState("");
  const [digitalKey, setDigitalKey] = useState(null);
  const [rented, setRented] = useState(false);
  const navigation = useNavigation();
  const [endDate, setReturnDate] = useState("");

  const [calculatedCost, setCalculatedCost] = useState(null);

  const handleCalculateCost = async () => {
    if (!endDate) {
      alert("בחרו תאריך החזרה קודם");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/rental/calculateCost",
        {
          endDate,
          pricePerMinute: car.pricePerMinute,
        }
      );

      const result = response.data;
      console.log(result);
      setCalculatedCost(result);
      alert(`משך ההשכרה: ${result.minutes} דקות
            עלות משוערת: ₪${result.cost}`);
    } catch (error) {
      console.error("Error calculating cost:", error);
      if (error.response) {
        console.log("🔎 שגיאת שרת:", error.response.data);
        console.log("🔧 סטטוס:", error.response.status);
        console.log("📩 תגובה מלאה:", error.response);
      } else if (error.request) {
        console.log("📡 הבקשה נשלחה אך לא התקבלה תגובה:", error.request);
      } else {
        console.log("⚠️ שגיאה כללית:", error.message);
      }
    }
  };

  const [isReturnDatePickerVisible, setReturnDatePickerVisible] =
    useState(false);

  const showReturnDatePicker = () => setReturnDatePickerVisible(true);
  const hideReturnDatePicker = () => setReturnDatePickerVisible(false);

  const handleReturnConfirm = (date) => {
    setReturnDate(date.toISOString());
    hideReturnDatePicker();
  };

  const generateDigitalKey = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6 ספרות
  };

  const handlePayment = () => {
    navigation.navigate("Payment", { car });
  };

  const handleStartTrip = async () => {
    if (!digitalKey) {
      alert("לא נוצר מפתח דיגיטלי עדיין");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/rental/addRental",
        {
          userID,
          carID: car.carID,
          startDate,
          endDate,
          startLocationID,
          status: true, // או כל ערך שמתאים לך
          totalCost: car.pricePerMinute,
          digitalKey,
        }
      );
      console.log("Params:", route.params);

      console.log(
        "Fetching from:",
        "http://localhost:5000/api/rental/addRental"
      );

      const data = response.data;
      console.log("Server Response:", data);
      console.log(response);
      console.log("userID:", userID);
      console.log("startDate:", startDate);
      console.log("endDate:", endDate);
      console.log("carID:", car.carID);
      console.log("נשלח מפתח:", digitalKey);

      if (response.status === 200 || response.status === 201) {
        alert("ההשכרה הושלמה בהצלחה");
        //navigation.navigate("UserRentals"); // Navigate to the user dashboard
      } else {
        alert(`שגיאה בהרשמה: ${response.data.message}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("שגיאה בהתחברות לשרת");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>פרטי הרכב</Text>

      {car.imageUrl && (
        <Image source={{ uri: car.imageUrl }} style={styles.image} />
      )}

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
          style={styles.boldLabel}
          value={
            endDate
              ? new Date(endDate).toLocaleString("he-IL", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : ""
          }
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

      <View style={styles.infoButton}>
        <Button
          title="הצגת המחיר הכולל"
          onPress={handleCalculateCost}
          color="#00008b"
        />
      </View>

      {!rented && (
        <View style={styles.detailsWrapper}>
          <Text style={styles.detailText}>
            <Text style={styles.boldLabel}> מספר מזהה: </Text>
            {car.carID}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldLabel}>🚗 דגם: </Text>
            {car.model}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldLabel}>💸 מחיר לדקה: </Text>₪
            {car.pricePerMinute}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldLabel}>🔋 סוללה: </Text>
            {car.batteryAmount}%
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldLabel}>🧍‍♂️ מקומות ישיבה: </Text>
            {car.numberOfPlaces}
          </Text>

          <View style={styles.buttonWrapper}>
            <Button
              title="לתשלום הרכב"
              color="#3b7c72"
              onPress={handlePayment}
            />
          </View>
        </View>
      )}

      {rented && (
        <View style={{ marginTop: 30, alignItems: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: "bold", color: "#3b7c72" }}>
            המפתח הדיגיטלי שלך:
          </Text>
          <Text style={{ fontSize: 36, color: "#000", marginVertical: 10 }}>
            {digitalKey}
          </Text>
          <Text style={{ fontSize: 14, color: "gray", textAlign: "center" }}>
            השתמש בקוד זה כדי לפתוח את הרכב בתחילת הנסיעה
          </Text>

          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartTrip}
          >
            <Text style={styles.startButtonText}>התחל נסיעה</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 30,
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    flexGrow: 1,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 25,
  },
  image: {
    width: 320,
    height: 200,
    borderRadius: 12,
    marginBottom: 25,
  },
  detailsWrapper: {
    width: "90%",
    marginBottom: 30,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: "flex-end",
  },
  paymentLabel: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "right",
    width: "100%",
  },
  paymentWrapper: {
    width: "100%",
    alignItems: "center",
  },
  input: {
    width: "80%",
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 5,
    textAlign: "right",
  },
  dateInputWrapper: {
    width: "80%",
    flexDirection: "row-reverse",
    alignItems: "center",
    marginBottom: 20,
  },
  dateInputContainer: {
    flex: 1,
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    paddingHorizontal: 10,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    justifyContent: "center",
  },
  calendarIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: "#3b7c72",
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  calendarIcon: {
    fontSize: 18,
    color: "white",
  },
  dateInputText: {
    textAlign: "right",
    color: "#333",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    maxHeight: "70%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  yearSelector: {
    width: "100%",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  yearOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  selectedYear: {
    backgroundColor: "#3b7c72",
  },
  yearText: {
    fontSize: 16,
  },
  selectedYearText: {
    color: "white",
    fontWeight: "bold",
  },
  calendarContainer: {
    width: "100%",
    maxHeight: 250,
  },
  monthsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  monthItem: {
    width: "20%",
    padding: 15,
    margin: 5,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    alignItems: "center",
  },
  selectedMonth: {
    backgroundColor: "#3b7c72",
  },
  monthText: {
    fontSize: 18,
  },
  selectedMonthText: {
    color: "white",
    fontWeight: "bold",
  },
  closeButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#3b7c72",
    borderRadius: 5,
    width: 100,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  detailText: {
    fontSize: 22,
    color: "#333",
    marginBottom: 14,
    textAlign: "right",
  },
  boldLabel: {
    fontWeight: "bold",
    color: "#000",
  },
  buttonWrapper: {
    marginTop: 20,
    width: "100%",
    fontSize: 17,
  },

  // Message Modal Styles
  messageModalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  successModal: {
    borderTopWidth: 5,
    borderTopColor: "#4CAF50",
  },
  errorModal: {
    borderTopWidth: 5,
    borderTopColor: "#F44336",
  },
  infoModal: {
    borderTopWidth: 5,
    borderTopColor: "#2196F3",
  },
  messageIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  successIconContainer: {
    backgroundColor: "#4CAF50",
  },
  errorIconContainer: {
    backgroundColor: "#F44336",
  },
  infoIconContainer: {
    backgroundColor: "#2196F3",
  },
  messageIcon: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#fff",
  },
  messageTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  dateInput: {
    textAlign: "center",
    fontSize: 18,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 22,
  },
  messageButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    minWidth: 100,
    alignItems: "center",
  },
  successButton: {
    backgroundColor: "#4CAF50",
  },
  errorButton: {
    backgroundColor: "#F44336",
  },
  infoButton: {
    marginBottom: "40px",
    backgroundColor: "#2196F3",
    fontSize: 17,
  },
  messageButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },

  inputContainer: {
    position: "relative",
    zIndex: 1000,
    marginBottom: 10,
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
  datePickerContainer: {
    position: "relative",
    zIndex: 9999,
    isolation: "isolate",
  },
  label: {
    marginBottom: 5,
    fontWeight: "bold",
    textAlign: "right",
    fontSize: 18,
  },
});
export default CarRental;
