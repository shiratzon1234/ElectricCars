import React, { useState } from "react";
import {
  Platform,
  Button,
  Text,
  TextInput,
  View,
  StyleSheet,
  Alert,
} from "react-native";
import axios from "axios";

const LoginScreen = ({ navigation }) => {
  const [userID, setUserID] = useState("");
  const [password, setPassword] = useState("");
  //להצגת השגיאות
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async () => {
    //אם המשתמש לא הזין בכלל שם משתמש וסיסמה

    setErrorMessage(""); // איפוס כל הודעת שגיאה ישנה

    if (!userID || !password) {
      setErrorMessage("אנא הזן תעודת זהות וסיסמה");
      return;
    }

    try {
      console.log("Inside handleLogin");
      console.log(userID);
      const response = await axios.post(
        "http://localhost:5000/api/users/GetUserById",
        { userID, password }
      );

      console.log("Server response:", response);

      if (response.data.success) {
        console.log("Login Success");
        navigation.navigate("ShowRoutesAccordingUser", { userID });
        Alert.alert("✅ התחברות מוצלחת!", "ברוך הבא!");
      } else {
        console.log("Login not Success");
        const message = response.data.message;
        setErrorMessage("שם משתמש או סיסמה שגויים\nאם אינך רשום אנא הירשם");
      }
    } catch (error) {
      console.log("Error:", error); // להוסיף לוג כאן כדי לראות מה קורה בשגיאה
      setErrorMessage("שם משתמש או סיסמה שגויים\nאם אינך רשום אנא הירשם");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>הכנס את פרטיך</Text>

      <TextInput
        style={styles.input}
        placeholder="תעודת זהות"
        value={userID}
        onChangeText={setUserID}
      />

      <TextInput
        style={styles.input}
        placeholder="סיסמה"
        secureTextEntry={true}
        value={password}
        onChangeText={setPassword}
      />

      {errorMessage !== "" && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}

      <View style={styles.buttonWrapper}>
        <Button
          title="התחבר"
          onPress={() => {
            console.log("Button clicked");
            console.log(userID);
            handleLogin();
          }}
          color="#008080"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e6f7f5",
  },
  title: {
    fontSize: 20,
    marginBottom: 30,
    fontWeight: "bold",
  },
  input: {
    width: "20%",
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 5,
    textAlign: "right",
  },
  buttonWrapper: {
    marginTop: 4,
    width: "20%",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    fontWeight: "bold",
  },
});

export default LoginScreen;
