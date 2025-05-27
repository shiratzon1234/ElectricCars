import Address from 'ipaddr.js';
import mongoose from 'mongoose';

const ChargingStationsSchema = new mongoose.Schema({
    stationID: Number,
    address: String,
    coords: Object,
    city: String,
    isPickupPoint: Boolean,
}, { collection: 'ChargingStation' });

 export const ChargingStation = mongoose.model('ChargingStation', ChargingStationsSchema);