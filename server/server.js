import Users_router from "./routers/users_router.js"
import Cars_router from "./routers/Cars_router.js"
import PickupLocation_router from "./routers/PickupLocation_router.js"
import Rental_router from "./routers/Rental_router.js"
import ChargingStation_router from "./routers/ChargingStation_router.js"
import { IfDatesAvailableFunction } from './RentalManagement.js'; // Import the function to check date availability
import { updateFinishedRentals } from './RentalManagement.js';
//import { findNearestBranchUsingGraph } from './distanceBranchService.js';
import { geocodeAddress , findNearestBranchUsingGraph } from './distanceBranchService.js'; // אם הגדרת אותה שם
import cors from 'cors';
import mongoose from 'mongoose';
import express from 'express';
const app = express();

console.log('Test')

// let users = []
// משתנה סביבה לכתובת החיבור
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/Cars';

// התחברות ל-MongoDB
mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB', err));

// Middleware
//JSON מאפשר לעבד נתונים בפורמט
app.use(express.json());
app.use(cors());

// 👉 הגשת קבצים סטטיים מתיקיית images
import path from 'path';
import { fileURLToPath } from 'url';
import {
    fetchAvailableCarsByPickupPoint,
    getClosestPickupPoint,
    GEToriginAnddest,
    updateCarStatus
} from "./algorithm.js";
import { faListSquares } from "@fortawesome/free-solid-svg-icons/faListSquares";
import { ChargingStation } from "./ChargingStationsManagement.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// תמונות שמאוחסנות בשרת יהיו זמינות דרך /images
app.use('/images', express.static(path.join(__dirname, 'images')));

// דוגמה לנתיב בדיקה
app.get('/', (req, res) => {
    res.send('Server is running and connected to MongoDB!');
});



app.post('/api/test-algo', async (req, res) => {

});

// נתיב חדש שמקבל כתובת ומחזיר את הסניף הקרוב
app.post('/api/nearest-branch-by-address', async (req, res) => {
    console.log('🚀 התקבלה קריאה לנתיב /api/nearest-branch-by-address');
    console.log(`req.body: ${JSON.stringify(req.body)}`);
    const { currentLocation } = req.body;

    console.log('📥 מיקום נוכחי שהתקבל:', currentLocation);

    if (!currentLocation) {
        return res.status(400).json({ message: "מיקום נוכחי לא סופק" });
    }

    try {
        /*const [latitude, longitude] = currentLocation.split(',').map(Number);
        console.log('📍 הקואורדינטות שהתקבלו:', { latitude, longitude });

        const nearestBranch = await findNearestBranchUsingGraph(latitude, longitude);
        console.log('🏢 הסניף שנמצא:', nearestBranch);*/

        // Test Algo
        const nearestBranch = await findNearestBranchUsingGraph(currentLocation);
        console.log('🏢 הסניף שנמצא:', nearestBranch);

        if (!nearestBranch) {
            return res.status(404).json({ message: "לא נמצא סניף קרוב" });
        }

        res.json(nearestBranch);
    } catch (error) {
        console.error("❌ שגיאה בשרת:", error);
        res.status(500).json({ message: "שגיאת שרת", error: error.message });
    }
});


app.post('/api/get-optimize-path', async (req, res) => {
    try {
        const { source, dest, destName, filters, carId } = req.body;

        if (!source || !dest) {
            return res.status(400).json({
                success: false,
                message: 'נדרשים נקודת מוצא ויעד'
            });
        }

        console.log('Request received:', JSON.stringify({ source, dest, filters }, null, 2));

        // Safe access to filters with fallbacks
        const safeFilters = filters || {};

        // המרת מבנה הסינון לפורמט הנדרש עבור האלגוריתם
        const userPreferences = {
            // Create carRequirements object with safe property access
            carRequirements: safeFilters.carRequirements ? {
                carType: safeFilters.carRequirements.carType || null,
                minPassengers: safeFilters.carRequirements.minPassengers || null,
                maxPricePerMinute: safeFilters.carRequirements.maxPricePerMinute || null
            } : null,

            // העברת שאר הפרמטרים עם ברירות מחדל
            allowCarSwitch: safeFilters.allowCarSwitch !== undefined ? safeFilters.allowCarSwitch : true,
            maxWaitTime: safeFilters.maxWaitTime ? parseInt(safeFilters.maxWaitTime) : 15,
            forceRoute: safeFilters.forceRoute !== undefined ? safeFilters.forceRoute : true
        };

        // Check for empty or null carRequirements values
        if (userPreferences.carRequirements) {
            const hasValues = Object.values(userPreferences.carRequirements).some(val => val !== null);
            if (!hasValues) {
                userPreferences.carRequirements = null;
            }
        }

        console.log("User preferences for algorithm:", JSON.stringify(userPreferences, null, 2));

        // קריאה לפונקציה הראשית של האלגוריתם
        const result = await GEToriginAnddest(source, dest,destName, userPreferences, carId);

        if (result && result.success && result.route) {
            // If the route was successfully found, return it without updating the car status yet
            // This allows the user to confirm the route first
            return res.json({
                success: true,
                route: result.route,
                selectedCar: result.selectedCar
            });
        } else {
            return res.status(404).json({
                success: false,
                message: result?.message || 'לא נמצא מסלול מתאים'
            });
        }
    } catch (error) {
        console.error('שגיאה בחישוב המסלול:', error);
        res.status(500).json({
            success: false,
            message: `שגיאת שרת: ${error.message}`
        });
    }
});

// New endpoint to confirm the route and update car status
app.post('/api/confirm-route', async (req, res) => {
    try {
        const { carId } = req.body;

        if (!carId) {
            return res.status(400).json({
                success: false,
                message: 'מזהה רכב נדרש'
            });
        }

        // Update the car status in the database
        const updated = await updateCarStatus(carId);

        if (updated) {
            return res.json({
                success: true,
                message: 'הרכב סומן כלא זמין בהצלחה'
            });
        } else {
            return res.status(500).json({
                success: false,
                message: 'לא ניתן היה לעדכן את סטטוס הרכב'
            });
        }
    } catch (error) {
        console.error('שגיאה בעדכון סטטוס הרכב:', error);
        res.status(500).json({
            success: false,
            message: `שגיאת שרת: ${error.message}`
        });
    }
});

app.post('/api/get-available-cars', async (req, res) => {
   const { stationId, carRequirement, forceRoute } = req.body;

    if (!stationId) {
        return res.status(400).json({ message: 'Missing stationId' });
    }

    try {
        // Call the function to get available cars
        const availableCars = await fetchAvailableCarsByPickupPoint(stationId, carRequirement, forceRoute);

        if (availableCars) {
            res.json(availableCars);
        } else {
            res.status(404).json({ message: 'No available cars found' });
        }
    } catch (error) {
        console.error('Error fetching available cars:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/get-closest-pickup', async (req, res) => {

    console.log('Inside get-closest-pickup endpoint');
    const { latitude, longitude } = req.body;

    // Validate required parameters
    if (!latitude || !longitude) {
        return res.status(400).json({
            success: false,
            message: 'Missing required parameters: latitude and longitude'
        });
    }

    try {
        // Parse coordinates to ensure they are numbers
        const userLocation = {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude)
        };

        // Validate parsed coordinates
        if (isNaN(userLocation.latitude) || isNaN(userLocation.longitude)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coordinates: latitude and longitude must be valid numbers'
            });
        }

        // Call the function to get the closest pickup point
        const result = await getClosestPickupPoint(userLocation);
        console.log(result);
        // Check if a pickup point was found
        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'No pickup points found'
            });
        }
        // Format the response
        const response = {
            success: true,
            pickupPoint: {
                id: result.point.stationID || result.point._id,
                name: result.point.StationName || "Unnamed Station",
                coords: {
                    latitude: result.point.coords.latitude || result.point.coords.lat,
                    longitude: result.point.coords.longitude || result.point.coords.lng
                },
                distance: {
                    meters: result.distance,
                    kilometers: (result.distance / 1000).toFixed(2)
                },
                // Include any other relevant station information
                address: result.point.address || "",
                isPickupPoint: result.point.isPickupPoint || true
            }
        };

        res.json(response);
    } catch (error) {
        console.error('Error finding closest pickup point:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

app.post('/api/is-dates-available', async (req, res) => {
    const { startDate, endDate, carId } = req.body;

    if (!startDate || !endDate || !carId) {

        return res.status(400).json({ message: 'Missing required parameters' });
    }

    try {
        const isAvailable = await IfDatesAvailableFunction(startDate, endDate, carId);
        res.json({ isAvailable });
    } catch (error) {
        console.error('Error checking availability:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// Cשn you provide me some input for this function as test the endpoint only ?
const testInput = {
    startDate: '2023-10-01T10:00:00Z',
    endDate: '2023-10-02T10:00:00Z',
    carID: '12345'
};



updateFinishedRentals()
  .then(() => console.log("✅ סיום השכרות עברו עיבוד בהצלחה בעת עליית השרת"))
  .catch((error) => console.error("❌ שגיאה בהרצת updateFinishedRentals:", error));
  
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);


});


app.use('/api/users' , Users_router);
app.use('/api/cars' , Cars_router);
app.use('/api/chargingStation' , ChargingStation_router);
app.use('/api/rental' , Rental_router);

app.use('/api/pickupLocation' ,PickupLocation_router);