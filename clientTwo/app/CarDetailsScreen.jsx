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

const Payment = ({ route }) => {
  const { car } = route.params;

  const [cardNumber, setCardNumber] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formattedExpiryDate, setFormattedExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const [showMessageModal, setShowMessageModal] = useState(false);
  const [digitalKey, setDigitalKey] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const generateDigitalKey = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6 ספרות
  };

  const [messageTitle, setMessageTitle] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [messageType, setMessageType] = useState("error"); // "error", "success", "info"

  const generateFutureMonths = () => {
    const months = [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    for (let year = 0; year < 10; year++) {
      for (let month = 0; month < 12; month++) {
        if (year === 0 && month < currentMonth) continue;

        const monthYear = {
          month: month + 1,
          year: currentYear + year,
          label: `${month + 1 < 10 ? "0" + (month + 1) : month + 1}/${
            (currentYear + year) % 100
          }`,
        };
        months.push(monthYear);
      }
    }
    return months;
  };

  const futureMonths = generateFutureMonths();

  const isExpiryValid = (month, year) => {
    if (month < 1 || month > 12) return false;

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;

    return true;
  };

  const showMessage = (title, content, type = "error") => {
    setMessageTitle(title);
    setMessageContent(content);
    setMessageType(type);
    setShowMessageModal(true);
  };

  const handlePayment = () => {
    if (!cvv || cvv.length < 3) {
      console.log("CVV is less than 3 digits");
      showMessage("שגיאה", "CVV לא תקין - חייב להכיל שלוש ספרות");
      return;
    }

    console.log("CVV is valid");

    if (!formattedExpiryDate) {
      showMessage("שגיאה", "יש לבחור תוקף לכרטיס");
      return;
    }

    const [month, year] = formattedExpiryDate.split("/");
    const fullYear = parseInt("20" + year, 10);

    if (!isExpiryValid(parseInt(month, 10), fullYear)) {
      showMessage("שגיאה", "תאריך תוקף לא תקין");
      return;
    }

    const generatedKey = generateDigitalKey();
    setDigitalKey(generatedKey);
    setPaymentSuccess(true);
    showMessage("הצלחה", "התשלום בוצע בהצלחה! קיבלת מפתח דיגיטלי", "success");
  };

  const openCalendarModal = () => {
    setShowCalendarModal(true);
  };

  const handleDateSelect = (monthYear) => {
    setSelectedDate(new Date(monthYear.year, monthYear.month - 1, 1));
    setFormattedExpiryDate(monthYear.label);
    setShowCalendarModal(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>פרטי כרטיס אשראי</Text>

      <View style={styles.paymentWrapper}>
        <TextInput
          placeholder="מספר כרטיס"
          value={cardNumber}
          onChangeText={setCardNumber}
          keyboardType="numeric"
          style={styles.input}
        />

        <View style={styles.dateInputWrapper}>
          <TouchableOpacity
            style={styles.dateInputContainer}
            onPress={openCalendarModal}
          >
            <Text style={styles.dateInputText}>
              {formattedExpiryDate || "תוקף (MM/YY)"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.calendarIconContainer}
            onPress={openCalendarModal}
          >
            <Text style={styles.calendarIcon}>📅</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar Modal - Updated with built-in year selection */}
        <Modal
          visible={showCalendarModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCalendarModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>בחר תוקף כרטיס</Text>

              <View style={styles.yearSelector}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {Array.from(
                    new Set(futureMonths.map((item) => item.year))
                  ).map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.yearOption,
                        selectedDate.getFullYear() === year &&
                          styles.selectedYear,
                      ]}
                      onPress={() => {
                        const newDate = new Date(selectedDate);
                        newDate.setFullYear(year);
                        setSelectedDate(newDate);
                      }}
                    >
                      <Text
                        style={[
                          styles.yearText,
                          selectedDate.getFullYear() === year &&
                            styles.selectedYearText,
                        ]}
                      >
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <ScrollView style={styles.calendarContainer}>
                <View style={styles.monthsGrid}>
                  {futureMonths
                    .filter((item) => item.year === selectedDate.getFullYear())
                    .map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.monthItem,
                          formattedExpiryDate === item.label &&
                            styles.selectedMonth,
                        ]}
                        onPress={() => handleDateSelect(item)}
                      >
                        <Text
                          style={[
                            styles.monthText,
                            formattedExpiryDate === item.label &&
                              styles.selectedMonthText,
                          ]}
                        >
                          {item.month < 10 ? "0" + item.month : item.month}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCalendarModal(false)}
              >
                <Text style={styles.closeButtonText}>סגור</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Friendly Message Modal */}
        <Modal
          visible={showMessageModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowMessageModal(false)}
        >
          <View style={styles.modalContainer}>
            <View
              style={[
                styles.messageModalContent,
                messageType === "success"
                  ? styles.successModal
                  : messageType === "error"
                  ? styles.errorModal
                  : styles.infoModal,
              ]}
            >
              <View
                style={[
                  styles.messageIconContainer,
                  messageType === "success"
                    ? styles.successIconContainer
                    : messageType === "error"
                    ? styles.errorIconContainer
                    : styles.infoIconContainer,
                ]}
              >
                {messageType === "success" ? (
                  <Text style={styles.messageIcon}>✓</Text>
                ) : messageType === "error" ? (
                  <Text style={styles.messageIcon}>!</Text>
                ) : (
                  <Text style={styles.messageIcon}>i</Text>
                )}
              </View>

              <Text style={styles.messageTitle}>{messageTitle}</Text>
              <Text style={styles.messageText}>{messageContent}</Text>

              <TouchableOpacity
                style={[
                  styles.messageButton,
                  messageType === "success"
                    ? styles.successButton
                    : messageType === "error"
                    ? styles.errorButton
                    : styles.infoButton,
                ]}
                onPress={() => setShowMessageModal(false)}
              >
                <Text style={styles.messageButtonText}>הבנתי</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <TextInput
          placeholder="CVV"
          value={cvv}
          onChangeText={setCvv}
          keyboardType="numeric"
          secureTextEntry
          maxLength={3}
          style={styles.input}
        />

        <Button title="אישור ותשלום" color="#3b7c72" onPress={handlePayment} />
        {paymentSuccess && digitalKey && (
          <View style={{ marginTop: 30, alignItems: "center" }}>
            <Text
              style={{ fontSize: 20, fontWeight: "bold", color: "#3b7c72" }}
            >
              מפתח דיגיטלי שלך:
            </Text>
            <Text style={{ fontSize: 36, color: "#000", marginVertical: 10 }}>
              {digitalKey}
            </Text>
            <Text style={{ fontSize: 14, color: "gray", textAlign: "center" }}>
              הקוד נועד לפתיחת הרכב בתחילת הנסיעה
            </Text>

            <TouchableOpacity
              style={{
                marginTop: 20,
                backgroundColor: "#3b7c72",
                paddingHorizontal: 30,
                paddingVertical: 12,
                borderRadius: 10,
              }}
              onPress={() => alert("🚗 הנסיעה החלה!")}
            >
              <Text
                style={{ color: "white", fontWeight: "bold", fontSize: 16 }}
              >
                התחל נסיעה
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 30,
    paddingTop: 100, // מוסיף רווח מלמעלה
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    flexGrow: 1,
    justifyContent: "flex-start", // או center אם רוצים מרכוז לגמרי
    paddingTop: 200,
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
    width: "40%",
    height: 50,
    fontSize: 16,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 5,
    textAlign: "right",
  },
  dateInputWrapper: {
    width: "40%", // כמו input
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
    fontSize: 16,
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
    backgroundColor: "#2196F3",
  },
  messageButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default Payment;
