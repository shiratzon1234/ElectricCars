import {Router} from 'express';
import { AddRental , IfDatesAvailableFunction , updateFinishedRentals , calculateRentalCost} from '../RentalManagement.js'; //ייבוא של כל הפונקציות
const router = Router();

//יצירת נתיב להוספת השכרה חדשה
router.post('/addRental', AddRental);

//יצירת נתיב לבדוק אם התאריכים פנויים
router.post('/IfDatesAvailable' , IfDatesAvailableFunction);

router.patch('/updateFinishedRentals' , updateFinishedRentals);

router.post('/calculateCost' , calculateRentalCost);

export default router;