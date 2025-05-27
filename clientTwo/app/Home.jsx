import React, { useState } from "react";
import {
  Button,
  Text,
  View,
  StyleSheet,
  Image,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const screenWidth = Dimensions.get("window").width;

export default function HomeScreen() {
  const navigation = useNavigation();

  
  return (
    <View style={styles.container}>
      {/* לוגו בחלק העליון */}
      <Image
        source={require("../assets/Logo.png")} // שנה את הנתיב לפי מיקום הקובץ שלך
        style={styles.logo}
        resizeMode="cover"
      />

      {/* ריווח בין הלוגו לטקסט */}
      <View style={styles.spacer} />

      {/* טקסט מקבל פנים */}
      <Text style={styles.welcome}>
        ברוכים הבאים לשירות השכרת רכבים חשמליים שיתופיים !
      </Text>

      {/* כפתורי ניווט */}
      <View style={styles.buttonWrapper}>
        <Button
          onPress={() => navigation.navigate("Login")}
          title="כניסה"
          color="#008080"
        />
      </View>

      <View style={styles.buttonWrapper}>
        <Button
          onPress={() => navigation.navigate("Register")}
          title="הרשמה"
          color="#008080"
        />
      </View>

      <View style={styles.buttonWrapper}>
        <Button
          onPress={() => alert("Second Button Pressed!")}
          title="אודות"
          color="#008080"
        />
      </View>
    </View>
  );
}

/*
      <View style={styles.buttonWrapper}>
          <Button
          onPress={() => navigation.navigate("FindNearestBranch")}
          title="מצא סניף קרוב"
          color="#008080"
        />
      </View>
      */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#e6f7f5",
    paddingTop: 0,
  },
  spacer: {
    height: 20,
  },
  welcome: {
    fontSize: 18,
    fontWeight: "500",
    color: "#191970",
    marginBottom: 20,
    textAlign: "center",
    //backgroundColor: "008080",
  },
  buttonWrapper: {
    margin: 10,
    borderWidth: 4,
    borderColor: "#ffffff",
    borderRadius: 30,
    overflow: "hidden",
    width: 220,
    height: 50,
    backgroundColor: "#3b7c72",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  boldText: {
    fontFamily: "Arial", // שימוש בגופן תומך ב-bold
    fontWeight: "bold", // הדגשה של הטקסט
    fontSize: 20, // גודל טקסט
  },
  logoWrapper: {
    width: "100%",
    paddingTop: 0,
    paddingBottom: 40,
    backgroundColor: "#3b7c72",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: "100%",
    height: "40%",
  },
});
