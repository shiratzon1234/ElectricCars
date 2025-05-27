import {AddUser , GetAll, DeleteUser , UpdateUser , GetUserById , CheckIfUserExists} from '../UsersManagers.js'; //ייבוא של כל הפונקציות
import {Router} from 'express';
const router = Router();


// יצירת נתיב להצגת כל המשתמשים
router.get ('/getUser' , GetAll);

//יצירת נתיב של הוספת משתמש חדש
router.post('/addUser' , AddUser);

//יצירת נתיב למחיקת משתמש
router.delete('/deleteUser', DeleteUser);

//עדכון משתמש חדש
router.patch('/updateUser' , UpdateUser);

//פונקציה לחיפוש משתמש האם קיים או לא
router.post('/GetUserById' , GetUserById) ;

router.post('/CheckIfUserExists' , CheckIfUserExists) ;

export default router ;