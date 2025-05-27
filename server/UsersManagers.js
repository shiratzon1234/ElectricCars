import mongoose from 'mongoose';

// הגדרת הסכימה למשתמש
const userSchema = new mongoose.Schema({
    userID: String,
    fullName: String ,
    password: Number,
    age: Number , 
    email : String,
    phone: String ,
}, { collection: 'Users'});

  //הוספה של משתמש חדש
  export const AddUser = async (req, res) => {
    try {
        const { userID, fullName, password, age , email , phone } = req.body; // שליפת נתונים מבקשת POST
        console.log(req.body)
        const newUser = new User({ userID, fullName, password , age , email , phone });
        await newUser.save();
        console.log(newUser)
        res.status(201).json({
            message: 'User added successfully!',
            user: newUser
        });
    } catch (err) {
        console.error("Error occurred while adding user:", err.message);
        res.status(500).json({
            message: 'Failed to add user',
            error: err.message
        });
    }
};


// פונקציה להצגת כל המשתמשים
export const GetAll = async (req, res) => {
    try{
         // שימוש ב-User.find() לשליפת כל המשתמשים
        // קריאת כל המשתמשים מתוך מאגר הנתונים
        const Users = await User.find(); // מחזיר את כל המשתמשים
        console.log(Users);
         // החזרת התגובה ללקוח עם המידע שהתקבל
        res.status(200).json({
            message: 'User data received successfully!',
            Users: Users
            });

        // החזרת התגובה ללקוח עם המידע שהתקבל
    } catch (err) {
        // החזרת שגיאה אם משהו השתבש
        res.status(500).json({
            message: 'An error occurred',
            error: err.message
        });
    }
};


//פונקציה למחיקת כל המשתמשים
export const DeleteUser = async( req , res) => {
    try{
    const{userID}=req.body
    await User.findOneAndDelete(userID);
    res.status(200).json({
    message: 'userID Deleted successfully!'})
} catch (err) {
    // החזרת שגיאה אם משהו השתבש
    res.status(500).json({
        message: 'An error occurred',
        error: err.message
    });    
}
};

//פונקציה של עדכון משתמש
export const UpdateUser = async (req, res) => {
    try{     
        const userId = req.body.userID; 

        const updateData = req.body;  

        const Users = await User.findOnexAndUpdate( {userID: userId} , updateData, { new: true })

        console.log("Update data:", updateData);
        res.status(200).json({
            message: 'Updat successfully!',
            Users:Users
            });

        console.log("Update data:", updateData);

    } catch (err) {
        res.status(500).json({
            message: 'An error occurred',
            error: err.message
        });
    }
};

//פונקציה לבדיקת משתמש לפי התעודת זהות והסיסמה
export const GetUserById = async (req , res) => {
    
        const { userID, password } = req.body;
        console.log('Received data:', { userID, password }, 'password type', typeof password);
        console.log(userID, password);
        
        try{
        const user = await User.findOne({ userID });
        console.log(user);
        if (!user) {
            console.log("User not found");
            return res.status(401).json({ success: false, message: "משתמש לא נמצא" });
        }
        console.log(user.password);
        console.log(password);

        // בדיקת סיסמה (בהשוואה ישירה או עם hash אם מדובר בסיסמה מוצפנת)
        if (user.password !== Number(password)) {
            return res.status(401).json({ success: false, message: "סיסמה שגויה" });
        }
    
        res.json({ success: true, message: "התחברות מוצלחת", user });
        console.log(typeof password);
        console.log(typeof user.password);

    } catch (error) {
        console.error("❌ שגיאה בהתחברות:", error);
        res.status(500).json({ success: false, message: "שגיאת שרת" });
    }
};

//בדיקה לפני ההרשמה אם התעודת זהות כבר כתובה במערכת
export const CheckIfUserExists = async (req, res) => {
    const { userID } = req.body;
    console.log('🔍 Checking if userID exists:', userID);

    try {
        const existingUser = await User.findOne({ userID });

        if (existingUser) {
            console.log("⚠️ userID already exists");
            return res.status(409).json({
                success: false,
                message: "תעודת זהות כבר קיימת במערכת",
            });
        }

        res.status(200).json({
            success: true,
            message: "ניתן להירשם עם תעודת זהות זו",
        });

    } catch (error) {
        console.error("❌ שגיאה בבדיקת תעודת זהות:", error);
        res.status(500).json({
            success: false,
            message: "שגיאת שרת",
        });
    }
};


// יצירת המודל של המשתמש
 // יצירת מודל מבוסס על הסכימה
const User = mongoose.model('User', userSchema);
export default User;
``











