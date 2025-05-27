import mongoose from 'mongoose';

  const electricCarSchema = new mongoose.Schema({
    carID: String,
    stationID: Number,
    batteryAmount: Number,
    chargingRate: Number,
    imageUrl: String, 
    meterPerBattery: Number,
    model: String,
    numberOfPlaces: Number,
    pricePerMinute: Number,
    status: Boolean,
}, { collection: 'ElectricCars' });

 export const ElectricCar = mongoose.model('ElectricCars', electricCarSchema);


  //הוספת רכב חדש
    export const AddCar = async (req, res) => {
      try {
          const { idCars, model, status, pricePerMinute } = req.body; 
          const newCar = new ElectricCar({ idCars, model, status, pricePerMinute });
          await newCar.save();
          res.status(201).json({
              message: 'Car added successfully!',
              car: newCar
          });
      } catch (err) {
          console.error("Error occurred while adding car:", err.message);
          res.status(500).json({
              message: 'Failed to add car',
              error: err.message
          });
      }
  };

  export const GetAllCars = async (req, res) => {
      try{
          const ElectricCars = await ElectricCar.find(); // מחזיר את כל המשתמשים
          console.log(`INside the GetALLcARS FUNCTION: ${ElectricCars}`)
          console.log(ElectricCars);
           // החזרת התגובה ללקוח עם המידע שהתקבל
          res.status(200).json({
              message: 'Cars data received successfully!',
              ElectricCars : ElectricCars 
              });
  
          // החזרת התגובה ללקוח עם המידע שהתקבל
      } catch (err) {
          res.status(500).json({
            message: 'An error occurred',
            error: err.message
          });
      }
  };
  
  export const DeleteCar= async( req , res) => {
      try{
      const{carID}=req.body
      await ElectricCar.findOneAndDelete(carID);
      res.status(200).json({
      message: 'carID Deleted successfully!'})
  } catch (err) {
      // החזרת שגיאה אם משהו השתבש
      res.status(500).json({
          message: 'An error occurred',
          error: err.message
      });    
  }
  };
  
  export const UpdateCar = async (req, res) => {
      try{     
          const carID = req.body.carID;  
  
          const updateData = req.body;   
  
          const cars = await ElectricCar.findOnexAndUpdate( {carID: carID} , updateData, { new: true })
  
          console.log("Update data:", updateData);
          res.status(200).json({
              message: 'Updat successfully!',
              cars:cars
              });
  
          console.log("Update data:", updateData);
      } catch (err) {
          res.status(500).json({
              message: 'An error occurred',
              error: err.message
          });
      }
  };

  
 //פונקציה ששולפת רכבים לפי סינון של הלקוח
 //לפי שדה של סוג רכב , מספק מקומות ומחיר

  export const FillterCars = async(req , res) => {
    console.log('בקשה התקבלה')
    const {pricePerMinute , model , numberOfPlaces, cars} = req.body ;
    console.log("arye",{pricePerMinute , model , numberOfPlaces});
    try {
        const filteredCars =  cars.filter(car => {
          if (pricePerMinute && car.pricePerMinute > pricePerMinute) return false;
          if (model && car.model !== model) return false;
          if (numberOfPlaces && car.numberOfPlaces > numberOfPlaces) return false;
          return true;
        });
    console.log("filteredCars",filteredCars) 
        res.status(200).json(filteredCars);
      }catch (error) {
        console.error("Error fetching filtered cars:", error);
        res.status(500).json({ message: "שגיאה בשליפת הרכבים" });
      }
    };

    //פונקצייה שמחזירה רכבים לפי מזהה מיקום
    export const GetCarsByLocationID = async (req, res) => {
        try {
          const { LocationID } = req.params;
      
          const cars = await ElectricCar.find({
            LocationID: parseInt(LocationID), // <- ודא ששם השדה בטבלת רכבים הוא בדיוק LocationID
            status: true
          });
      
          if (!cars || cars.length === 0) {
            return res.status(404).json({ message: "No cars found for this LocationID" });
          }
      
          res.status(200).json(cars);
        } catch (err) {
          res.status(500).json({ message: "Error fetching cars", error: err.message });
        }
      };


  //export default Car;