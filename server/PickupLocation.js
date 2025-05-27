import mongoose from 'mongoose';

const PickupLocationSchema = new mongoose.Schema({
    address: String ,
    LocationID: Number ,
    LocationName: String ,
    city: String ,
    idCar: Number
}, { collection: 'Pickup Locations' });

//הצגת כל הנקודות איסוף 
export const GetAllPickup = async (req, res) => {
    try{
        const pickupLocation = await PickupLocation.find(); 
        console.log(pickupLocation);
        res.status(200).json({
            message: 'PickupLocation data received successfully!',
            pickupLocation: pickupLocation
            });

    } catch (err) {
        res.status(500).json({
            message: 'An error occurred',
            error: err.message
        });
    }
};

export const AddPickupLocation = async (req , res) => {
    try{
        const { Address ,LocationID ,LocationName, city } = req.body; // שליפת נתונים מבקשת POST
        console.log(req.body)
        const newPickupLocation = new PickupLocation({ Address ,LocationID ,LocationName, city });
        await newPickupLocation.save();
        console.log(newPickupLocation)
        res.status(201).json({
            message: 'newPickupLocation added successfully!',
            pickupLocation: newPickupLocation
    });
    }catch(err) {
    console.error("Error occurred while adding pickupLocation:", err.message);
    res.status(500).json({
        message: 'Failed to add user',
        error: err.message
    });
}};

export const AuxGetAllPickup = async () => {
    try {
        // Get data directly from the database
        const pickupLocations = await PickupLocation.find().lean();

        console.log(`Retrieved ${pickupLocations.length} pickup locations locally`);
        return pickupLocations;
    } catch (err) {
        console.error("Error retrieving pickup locations:", err.message);
        throw err;
    }
};

//מציאת רכבים לפי הנקודת איסוף
export const GetCarsByPickupLocation = async (req, res) => {
    try {
       const { locationID  } = req.params;
       // using charging stations schema instead of pickuplocation
        const pickupLocations = await PickupLocation.find({ LocationID: locationID});

        if (!pickupLocations || pickupLocations.length === 0) {
           return res.status(404).json({ message: "No pickup locations found for this name" });
        }
        const carIds = pickupLocations.map(loc => loc.idCar);
        const cars = await ElectricCar.find({ carID: { $in: carIds } });

        res.status(200).json(cars);
    } catch (err) {
        res.status(500).json({ message: "Error fetching cars for pickup location", error: err.message });
    }
};







// יצירת המודל של נקודת איסוף
 // יצירת מודל מבוסס על הסכימה
const PickupLocation = mongoose.model('PickupLocation', PickupLocationSchema);
export default PickupLocation;
``











