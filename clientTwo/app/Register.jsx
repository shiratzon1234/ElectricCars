import React, { useState } from "react";
import { Button, Text, TextInput, View, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import styles from "./Register";
import { Platform, Alert } from "react-native";
import axios from "axios";

export default function RegisterScreen() {
  const [userID, setUserID] = useState("");
  const [fullName, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const navigation = useNavigation();

  //פונקצייה לבדיקת תקינות של תעודת זהות
  const isValidIsraeliID = (id) => {
    //מסיר רווחים מיותרים מתחילת ומסוף המחרוזת.
    id = id.trim();
    //isNaN(id) → בודק אם id מכיל משהו שהוא לא מספרים
    if (id.length !== 9 || isNaN(id)) return false; // לוודא שזה מספר עם 9 ספרות
    id = id.padStart(9, "0"); // השלמה ל-9 ספרות במידת הצורך
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      let num = Number(id[i]) * ((i % 2) + 1);
      sum += num > 9 ? num - 9 : num;
    }
    return sum % 10 === 0;
  };

  //אימות של גיל תקין
  const isValidAge = (age) => {
    return age > 0 && age < 120;
  };

  const isValidFullName = (fullName) => {
    const nameParts = fullName.trim().split(/\s+/); // מפצל לפי רווחים
    return nameParts.length >= 2 && nameParts.every((part) => part.length > 1);
  };

  //אימות של מספר טלפון תקין
  const isValidPhone = (phone) => {
    const phoneRegex = /^05\d{8}$/;
    return phoneRegex.test(phone);
  };

  //אימות של גימייל תקין
  //^ – מסמן את תחילת המחרוזת.
  const isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    let errors = [];

    // בדיקת תעודת זהות
    if (!isValidIsraeliID(userID)) {
      errors.push("⚠️ מספר תעודת הזהות אינו תקין.");
    }

    // בדיקת גיל
    const ageNumber = Number(age);
    if (!isValidAge(ageNumber)) {
      errors.push("⚠️ הגיל שהוזן לא תקין. אנא הזן גיל בין 1 ל-120.");
    }

    // בדיקת כתובת אימייל
    if (!isValidEmail(email)) {
      errors.push(
        "⚠️ עליך להזין כתובת Gmail תקינה (לדוגמה: example@gmail.com)."
      );
    }

    // בדיקת מספר טלפון
    if (!isValidPhone(phone)) {
      errors.push("⚠️ עלייך להזין מספר טלפון תקין.");
    }

    // בדיקת שם מלא
    if (!isValidFullName(fullName)) {
      errors.push("⚠️ יש להזין שם מלא (לפחות שם פרטי ושם משפחה).");
    }

    // בדיקת סיסמה (הוספתי כאן תנאי לבדיקת חוזק הסיסמה)
    if (password.length < 6) {
      errors.push("⚠️ הסיסמה חייבת להכיל לפחות 6 תווים.");
    }

    // אם יש שגיאות – הצגת כל השגיאות יחד
    if (errors.length > 0) {
      const errorMessage = errors.join("\n"); // מחבר את כל ההודעות להודעה אחת
      console.log("Errors:", errorMessage);

      if (Platform.OS === "web") {
        alert(errorMessage);
      } else {
        Alert.alert("⚠️ שגיאות בטופס", errorMessage);
      }
      return; // עצירה במקרה של שגיאות
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/users/addUser",
        {
          userID,
          fullName,
          password,
          age,
          email,
          phone,
        }
      );

      console.log("Fetching from:", "http://localhost:5000/api/users/addUser");

      const data = response.data;
      console.log("Server Response:", data);
      console.log(response);

      // הנתיב לבדיקה אם התעודת זהות כבר רשומה
      /*const response = await axios.post(
        "http://localhost:5000/api/users/CheckIfUserExists",*/

      if (response.status === 200 || response.status === 201) {
        alert("ההרשמה הושלמה בהצלחה");
        navigation.navigate("UserRentals"); // Navigate to the user dashboard
      } else {
        alert(`שגיאה בהרשמה: ${response.data.message}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("שגיאה בהתחברות לשרת");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>הכנס את פרטיך </Text>

      <TextInput
        style={styles.input}
        placeholder="תעודת זהות"
        value={userID}
        onChangeText={setUserID}
      />

      <TextInput
        style={styles.input}
        placeholder="שם מלא"
        value={fullName}
        onChangeText={setUsername}
      />

      <TextInput
        style={styles.input}
        placeholder="סיסמה"
        secureTextEntry={true}
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="גיל"
        value={age}
        onChangeText={setAge}
      />

      <TextInput
        style={styles.input}
        placeholder="גימייל"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="טלפון"
        value={phone}
        onChangeText={setPhone}
      />

      <View style={styles.buttonWrapper} backgroundcolor="#008080">
        <Button title="שלח פרטים " onPress={handleRegister} />
      </View>
    </View>
  );
}
