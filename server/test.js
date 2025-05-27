import mongoose from 'mongoose';

const carSchema = new mongoose.Schema({
    carID: Number,
    Model: String,
    Status: Boolean,
    PricePerMinute: Number
});

// Create a model based on the schema
const Car = mongoose.model('Cars', carSchema);

// Function to fetch all cars
export const GetAllCars = async (req, res) => {
    try {
        // Retrieve all cars from the collection
        const cars = await Car.find();

        // Log the results for debugging purposes
        console.log(cars);

        // Return the response to the client
        
    } catch (err) {
        // Handle any errors
        console.log('inside exception block')
        console.log(err)
    }
};

await GetAllCars()

export default Car;
