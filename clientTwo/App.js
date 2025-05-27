import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './app/Login.jsx'; // ייבוא מסך הכניסה
import HomeScreen from './app/Home.jsx';  // ייבוא מסך הבית
import RegisterScreen from './app/Register.jsx';  // ייבוא מסך הרשמה
import UserRentalsScreen from './app/UserRentalsScreen.jsx'; // דאשבורד עיקרי משתמש
import ShowAllCarsScreen from './app/ShowAllElectricCars.jsx'; //ייבוא הצגת כל הרכבים
import FillyerCarsPage from './app/FilteringAccordingUser.jsx' ;
import FindNearestBranch from './app/findNearestBranch.jsx'; // Import the new screen
import ShowCarsAccordingPickUpScreen from './app/ShowCarsAccordingPickUp.jsx';//מסך המציג רכבים לפי הנקודת איסוף שנבחרה על ידי המשתמש 
import Payment  from './app/CarDetailsScreen.jsx';
import CarRentalScreen from './app/CarRentalScreen.jsx';
import ShowRoutesAccordingUser from './app/ShowRoutesAccordingUser.jsx';
const Stack = createStackNavigator();

export default function App() {
  return (    
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="UserRentals" component={UserRentalsScreen} />
        <Stack.Screen name="ShowAllElectricCars" component={ShowAllCarsScreen} />
        <Stack.Screen name ="FilteringAccordingUser" component={FillyerCarsPage} />
        <Stack.Screen name="FindNearestBranch" component={FindNearestBranch} />
        <Stack.Screen name="ShowCarsAccordingPickUp" component={ShowCarsAccordingPickUpScreen} />
        <Stack.Screen name="Payment" component={Payment} />
        <Stack.Screen name="CarRental" component={CarRentalScreen} />
        <Stack.Screen name="ShowRoutesAccordingUser" component={ShowRoutesAccordingUser} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}