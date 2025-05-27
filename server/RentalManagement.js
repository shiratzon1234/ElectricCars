import mongoose from 'mongoose';
import {ElectricCar} from './CarsManagement.js';
//הגדרת סכימה להשכרות רכב
const rentalSchema = new mongoose.Schema({
    userID: String ,
    carID : String,
    startDate: Date,
    endDate: Date,
    startLocationID: Number,
    endLocationID: Number,
    totalCost: Number,
    digitalKey: String,
    rentalIsOpen: Boolean ,
}, { collection: 'Rentals'});

//
export const Rental = mongoose.model('Rental', rentalSchema);

export const AddRental = async (req, res) => {
    try {
        const { userID, carID, startDate, endDate , startLocationID ,totalCost, digitalKey } = req.body; // שליפת נתונים מבקשת POST
        console.log(req.body)
        //const formattedStartDate = new Date(startDate).toISOString().split("T")[0];
        //const formattedEndDate = new Date(endDate).toISOString().split("T")[0];

        const formattedStartDate = new Date(new Date(startDate).setHours(0, 0, 0, 0));
        const formattedEndDate = new Date(new Date(endDate).setHours(0, 0, 0, 0));
        const newRental = new Rental({
            userID,
            carID,
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            startLocationID,
            totalCost,
            digitalKey
          });
        await newRental.save();
        console.log(newRental)
        console.log("digitalKey in server:", digitalKey);
        console.log("type:", typeof digitalKey);
        res.status(201).json({
            message: 'Rental added successfully!',
            rental: newRental
          });
    } catch (err) {
        console.error("Error occurred while adding user:", err.message);
        res.status(500).json({
            message: 'Failed to add user',
            error: err.message
        });
    }
};

//פונקצייה לבדיקה אם קיימות השכרות בתאריכים האלו
export const IfDatesAvailableFunction = async (startDate, endDate, carId) => {
    try {

        if (!startDate || !endDate || !carId) {
            return faListSquares;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        // חיפוש אם קיימת השכרה עם חפיפה בתאריכים
        const overlappingRental = await Rental.findOne({
            carId: carId,
            $or: [
                { startDate: { $lte: end }, endDate: { $gte: start } }
            ]
        });
        console.log('Start date:', start);
        console.log('End date:', end);
        console.log('Car ID:', carId);


        console.log('Overlapping rental:', overlappingRental);

        if (overlappingRental) {
            return false;
        } else {
            return true;
        }
    } catch (error) {
        console.error("Error checking dates:", error);
    }
};

//פונקצייה להצגת מחיר סופי למשתמש
export const calculateRentalCost = (req,res) => {
    console.log(req.body)
    const { endDate, pricePerMinute } = req.body;
    const start = new Date();
    const end = new Date(endDate);
  
    const diffHours = (end - start) / (1000 * 60 * 60);
    const totalMinutes = diffHours * 60;
    const totalCost = totalMinutes * pricePerMinute;
  console.log("totalCost:", totalCost)
  res.status(200).json({
      hours: diffHours.toFixed(2),
      minutes: Math.round(totalMinutes),
      cost: totalCost.toFixed(2) ,
});}

  
  //פונקצייה שעולה כל פעם ומעדכנת בהתאם את הרכבים
  export const updateFinishedRentals = async () => {
    try {
      const now = new Date();
  
      const finishedRentals = await Rental.find({
        endDate: { $lt: now },
        rentalIsOpen: true // נוסיף תנאי כדי שלא נעדכן שוב השכרות שכבר נסגרו
      });
  
      if (finishedRentals.length === 0) {
        console.log("🔍 אין השכרות פתוחות שהסתיימו לעדכון.");
        return;
      }
  
      const finishedRentalsArray = [...finishedRentals];
  
      for (const rental of finishedRentalsArray) {
        const carId = rental.carID;
        const endLocationID = rental.endLocationID;
  
        if (!carId || !endLocationID) {
          console.warn("⚠️ השכרה לא תקינה, דילוג:", rental);
          continue;
        }
  
        // עדכון הרכב
        await ElectricCar.updateOne(
          { carID: carId },
          {
            $set: {
              status: true,
              LocationID: endLocationID,
              batteryAmount: 80,
            },
          }
        );
  
        // עדכון השכרה - לסגור אותה
        await Rental.updateOne(
          { _id: rental._id },
          { $set: { rentalIsOpen: false } }
        );
      }
  
      console.log("✅ עודכנו רכבים והושלמו השכרות:", finishedRentalsArray.map(r => r.carID));
    } catch (error) {
      console.error("❌ שגיאה בעדכון רכבים והשכרות:", error);
    }
  };
  
  
export default Rental;

