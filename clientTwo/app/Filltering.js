import { StyleSheet } from "react-native";


export default StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: "#5f9ea0",
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
      width: "40%",
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
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
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
      width: "70%",
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
      marginTop: 8,
    },
  });