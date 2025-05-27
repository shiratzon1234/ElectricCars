import { AddCar, DeleteCar, GetAllCars , UpdateCar , FillterCars , GetCarsByLocationID} from '../CarsManagement.js';  // ייבוא של הפונקציה GetAll
import {Router} from 'express';
const router = Router();

//יצירת נתיב של הוספת רכב חדש
router.post('/addCar' , AddCar);

//יצירת נתיב להצגת כל הרכבים
router.get('/getCar' , GetAllCars);

//יצירת נתיב למחיקת רכב
router.delete('/deleteCar' , DeleteCar);

//יצירת נתיב לעדכון רכב
router.patch('/updateCar' , UpdateCar);

router.post("/filter", FillterCars);

router.get('/getCarsByLocationID/:LocationID', GetCarsByLocationID);

export default router ;