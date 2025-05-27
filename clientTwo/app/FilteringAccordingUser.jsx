import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from "react-native";
import axios from "axios";
import { Alert } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; // רק ב-Web
import { useNavigation } from "@react-navigation/native";
import { start } from "repl";

const FillyerCarsPage = ({ route }) => {
  const navigation = useNavigation();
  const { userID } = route.params; // ✅ הוספת userID

  // סטייטים לסינון רכבים
  const [carModel, setCarModel] = useState("");
  const [pricePerMinute, setPrice] = useState("");
  const [numberOfPlaces, setNumberOfPlaces] = useState("");
  const [filteredCars, setFilteredCars] = useState([]);
  //משתנה בוליאני כדי לדעת אם יש רכבים מסוננים
  const [hasFiltered, setHasFiltered] = useState(false);

  // סטייטים לטופס האיסוף
  const [pickupLocation, setPickupLocation] = useState("");
  const [DistantionLocation, setDistantionLocation] = useState("");
  const [startDate, setPickupDate] = useState("");
  const [endDate, setReturnDate] = useState("");

  // סטייטים ללוח שנה
  const [isPickupDatePickerVisible, setPickupDatePickerVisible] =
    useState(false);
  const [isReturnDatePickerVisible, setReturnDatePickerVisible] =
    useState(false);

  // סטייט לניהול תצוגת השדות
  const [showFields, setShowFields] = useState(false);

  // הצגת לוח שנה
  const showPickupDatePicker = () => setPickupDatePickerVisible(true);
  const hidePickupDatePicker = () => setPickupDatePickerVisible(false);

  const showReturnDatePicker = () => setReturnDatePickerVisible(true);
  const hideReturnDatePicker = () => setReturnDatePickerVisible(false);

  // בחירת תאריך
  const handlePickupConfirm = (date) => {
    setPickupDate(date.toISOString()); // פורמט YYYY-MM-DD
    hidePickupDatePicker();
  };

  const handleReturnConfirm = (date) => {
    setReturnDate(date.toISOString());
    hideReturnDatePicker();
  };

  const handleFiilter = async () => {
    console.log(`The end date is: ${endDate}`);
    setHasFiltered(true);
    try {
      // בדוק אם הערכים לא ריקים לפני שליחה 
      if (!carModel || !PricePerMinute) {
        Alert.alert("❌ שגיאה", "יש להזין את כל השדות");
        return;
      }

      console.log("Inside handleFiilter");
      console.log(carModel);
      console.log(pricePerMinute);
      console.log(numberOfPlaces);

      const response = await axios.post(
        "http://localhost:5000/api/cars/filter",
        { Model: carModel, pricePerMinute, numberOfPlaces }
      );

      console.log(carModel);
      console.log("Server response:", response);
      console.log("Filtered cars from server:", response.data);

      if (response.status === 200) {
        setFilteredCars(response.data); // ← שמירת התוצאות
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

  return (
    <View style={styles.container}>
      <Text style={styles.header}>סינון רכבים</Text>

      {/* טופס איסוף */}
      <View style={styles.formContainer}>
        <Text style={styles.label}>נקודת מוצא</Text>
        <View style={styles.inputWrapper}>
          <FontAwesome
            name="search"
            size={20}
            color="#888"
            style={styles.icon}
          />
          <TextInput
            style={styles.inputField}
            placeholder="הקלידו מיקום נוכחי..."
            value={pickupLocation}
            onChangeText={setPickupLocation}
            placeholderTextColor="#888"
          />
        </View>

        <Text style={styles.label}>נקודת יעד</Text>
        <View style={styles.inputWrapper}>
          <FontAwesome
            name="search"
            size={20}
            color="#888"
            style={styles.icon}
          />
          <TextInput
            style={styles.inputField}
            placeholder="הקלידו את היעד..."
            value={DistantionLocation}
            onChangeText={setDistantionLocation}
            placeholderTextColor="#888"
          />
        </View>
      </View>

      {/* כפתור לפתיחת השדות האחרים */}
      <View style={styles.buttonContainer}>
        <Button
          title="הצג שדות סינון"
          onPress={() => setShowFields(!showFields)}
        />
      </View>

      {/* הצגת השדות בהתאם ל-state */}
      {showFields && (
        <>
          {/* שדות סינון */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="סוג רכב"
              value={carModel}
              onChangeText={setCarModel}
              textAlign="right"
            />
            <TextInput
              style={styles.input}
              placeholder="מחיר מקסימלי לדקה"
              value={PricePerMinute}
              onChangeText={setPrice}
              keyboardType="numeric"
              textAlign="right"
            />
            <TextInput
              style={styles.input}
              placeholder="מספר מקומות"
              value={NumberOfPlaces}
              onChangeText={setNumberOfPlaces}
              keyboardType="numeric"
              textAlign="right"
            />
          </View>

          {hasFiltered && filteredCars.length === 0 && (
            <Text
              style={{
                color: "#000000",
                fontSize: 16,
                textAlign: "center",
                marginTop: 10,
              }}
            >
              ❗ לא נמצאו רכבים מתאימים עבור סינון זה
            </Text>
          )}

          {filteredCars.length > 0 && (
            <View style={{ marginTop: 20 }}>
              <Text style={{ fontWeight: "bold", fontSize: 18 }}>
                רכבים מתאימים:
              </Text>
              {filteredCars.map((car, index) => (
                <View key={index} style={styles.CarDetails}>
                  {/* תמונה בצד שמאל */}
                  {car.imageUrl && (
                    <Image
                      source={{ uri: car.ImageUrl }}
                      style={{
                        width: 90,
                        height: 70,
                        borderRadius: 8,
                        marginLeft: 20, // ריווח בין התמונה לטקסט
                      }}
                    />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text>
                      <Text style={{ fontWeight: "bold" }}>🚗 דגם: </Text>{" "}
                      {car.model}
                    </Text>
                    <Text>
                      <Text style={{ fontWeight: "bold" }}>💸 מחיר לדקה: </Text>{" "}
                      ₪{car.pricePerMinute}
                    </Text>
                    <Text>
                      <Text style={{ fontWeight: "bold" }}>🔋 סוללה: </Text>{" "}
                      {car.batteryAmount}%
                    </Text>
                    <Text>
                      <Text style={{ fontWeight: "bold" }}>
                        🧍‍♂️ מקומות ישיבה:
                      </Text>{" "}
                      {car.numberOfPlaces}
                    </Text>
                    <View style={styles.buttonContainer}>
                      <Button
                        title="להשכרת הרכב ופרטיו"
                        onPress={() =>
                          //הפרמטרים שאני מעביכרה לדף הבא
                          navigation.navigate("CarRental", {
                            car,
                            startDate,
                            endDate,
                            userID,
                          })
                        }
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View> // ← ✅ סגירה נכונה של ה־View הראשי שמכיל את התוצאה
          )}

          <View style={styles.inputContainer}>
            {/* שדה תאריך בתוך שדה הטקסט */}
            <Text style={styles.label}>מתי תאספו?</Text>

            {/* אם זה Mobile, נשתמש בכפתור TouchableOpacity לפתיחת התאריך */}
            {Platform.OS !== "web" ? (
              <TouchableOpacity
                onPress={() => setPickupDatePickerVisible(true)}
                style={styles.dateInputWrapper}
              >
                <Text style={styles.dateInput}>
                  {startDate || "בחרו תאריך"}
                </Text>
              </TouchableOpacity>
            ) : (
              // אם זה Web, נשתמש ב-react-datepicker עם customInput כדי שהלוח שנה ייפתח בשדה הגדול
              <DatePicker
                selected={startDate ? new Date(startDate) : null}
                onChange={(date) => handlePickupConfirm(date)}
                showTimeSelect
                customInput={
                  <TouchableOpacity style={styles.dateInputWrapper}>
                    <Text style={styles.dateInput}>
                      {startDate || "בחרו תאריך"}
                    </Text>
                  </TouchableOpacity>
                }
              />
            )}

            {/* שדה קטן שיציג את התאריך שנבחר */}
            <TextInput
              style={styles.smallInput}
              value={startDate}
              editable={false}
            />

            {/* תצוגת בחירת תאריך במובייל */}
            {Platform.OS !== "web" && (
              <DateTimePickerModal
                isVisible={isPickupDatePickerVisible}
                mode="date"
                onConfirm={handlePickupConfirm}
                onCancel={hidePickupDatePicker}
                date={startDate ? new Date(startDate) : new Date()}
              />
            )}

            {/* שדה תאריך החזרה */}
            <Text style={styles.label}>מתי תחזירו?</Text>
            {/* אם זה Mobile, נשתמש בכפתור TouchableOpacity לפתיחת התאריך */}
            {Platform.OS !== "web" ? (
              <TouchableOpacity
                onPress={() => setReturnDatePickerVisible(true)}
                style={styles.dateInputWrapper}
              >
                <Text style={styles.dateInput}>{endDate || "בחרו תאריך"}</Text>
              </TouchableOpacity>
            ) : (
              // אם זה Web, נשתמש ב-react-datepicker עם customInput כדי שהלוח שנה ייפתח בשדה הגדול
              <DatePicker
                selected={endDate ? new Date(endDate) : null}
                onChange={(date) => handleReturnConfirm(date)}
                showTimeSelect
                customInput={
                  <TouchableOpacity style={styles.dateInputWrapper}>
                    <Text style={styles.dateInput}>
                      {endDate || "בחרו תאריך"}
                    </Text>
                  </TouchableOpacity>
                }
              />
            )}

            {/* שדה קטן שיציג את התאריך שנבחר */}
            <TextInput
              style={styles.smallInput}
              value={endDate}
              editable={false}
            />

            {/* תצוגת בחירת תאריך במובייל */}
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
        </>
      )}

      {/* כפתור סינון */}
      <View style={styles.buttonContainer}>
        <Button
          title="סנן"
          onPress={() => {
            console.log("Button clicked");
            handleFiilter();
          }}
        />
      </View>
    </View>
  );
};

// 🎨 עיצוב
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f0ffff",
  },
  header: {
    fontSize: 24,
    marginBottom: 5,
    textAlign: "center",
    fontWeight: "bold",
  },
  inputContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 2,
  },
  input: {
    height: 30,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    marginBottom: 10,
    width: "30%",
    marginHorizontal: 5,
    textAlign: "right",
  },
  formContainer: {
    alignItems: "center",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    width: "90%",
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.2)",
    elevation: 3,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  icon: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 5,
  },
  dateInputWrapper: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    width: "90%",
    borderWidth: 1,
    borderColor: "#ddd",
    marginTop: 5,
    alignItems: "center",
  },
  dateInput: {
    fontSize: 16,
    color: "#333",
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 18,
    alignSelf: "center", // ממקם את הכפתור באמצע
    width: 180, // רוחב קבוע קטן יותר
    borderRadius: 8,
    overflow: "hidden", // במידה ויש border radius
    backgroundColor: "#3b7c72",
  },
  CarDetails: {
    flexDirection: "row-reverse", // הצגה RTL: תמונה משמאל, טקסט מימין
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    marginVertical: 10,
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    fontSize: 20,
  },
});

export default FillyerCarsPage;
