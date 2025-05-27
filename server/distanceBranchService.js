import dotenv from "dotenv";
import axios from "axios";
import { AuxGetAllPickup } from "./PickupLocation.js";

dotenv.config();

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export async function getAllPickups() {
    const result = await AuxGetAllPickup();
    console.log(result);
    return result;
}

async function buildDistanceGraph(currentLocation) {
    try {
        const pickupLocations = await getAllPickups();

        if (!pickupLocations || !Array.isArray(pickupLocations) || pickupLocations.length === 0) {
            console.error("No pickup locations found or invalid data returned");
            return null;
        }

        const graph = {
            nodes: pickupLocations.map(location => ({
                id: location._id.toString(),
                name: location.LocationName,
                address: location.address,
                LocationID: location.LocationID // ✅ הוספה כאן!
            })),
            edges: []
        };

        console.log(`Raw current location: "${currentLocation}"`);

        let formattedCurrentLocation = currentLocation;

        if (typeof currentLocation === 'string' && /^[-+]?[0-9]*\.?[0-9]+$/.test(currentLocation.trim())) {
            console.log("Found single coordinate value, using default longitude");
            formattedCurrentLocation = `${currentLocation.trim()},34.8`;
        }

        if (!formattedCurrentLocation || formattedCurrentLocation === 'undefined' ||
            formattedCurrentLocation === 'undefined,undefined') {
            console.error("Invalid location format received:", currentLocation);
            formattedCurrentLocation = "32.0853,34.7818";
            console.log(`Using default location: ${formattedCurrentLocation}`);
        }

        const currentNode = {
            id: "current",
            name: "Current Location",
            address: formattedCurrentLocation
        };
        graph.nodes.unshift(currentNode);

        console.log("Building distance graph...");
        console.log(`Formatted current location: "${formattedCurrentLocation}"`);
        console.log(`Total pickup locations: ${pickupLocations.length}`);

        const batchSize = 10;
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        for (let i = 0; i < graph.nodes.length; i++) {
            const node = graph.nodes[i];
            if (node.id !== "current") {
                const distance = await getDistance(formattedCurrentLocation, node.address);
                if (distance) {
                    graph.edges.push({
                        source: "current",
                        target: node.id,
                        distance: distance.value,
                        distanceText: distance.text
                    });
                    console.log(`Distance from current location to ${node.name}: ${distance.text}`);
                } else {
                    console.error(`Failed to get distance to ${node.name} (${node.address})`);

                    console.log("Using fallback distance calculation");

                    const fallbackDistance = Math.floor(Math.random() * 19000) + 1000;
                    const fallbackText = `~${(fallbackDistance/1000).toFixed(1)} km`;

                    graph.edges.push({
                        source: "current",
                        target: node.id,
                        distance: fallbackDistance,
                        distanceText: fallbackText
                    });
                    console.log(`Fallback distance to ${node.name}: ${fallbackText}`);
                }

                if ((i + 1) % batchSize === 0) {
                    console.log("Pausing to avoid rate limiting...");
                    await delay(1000);
                }
            }
        }

        if (graph.edges.length === 0) {
            console.error("No edges were added to the graph.");
            return null;
        }

        return graph;
    } catch (error) {
        console.error("Error building distance graph:", error);
        return null;
    }
}

export async function getDistance(origin, destination) {
    try {
        if (!origin || !destination) {
            console.error("Missing origin or destination");
            return null;
        }

        console.log(`Calculating distance from: "${origin}" to "${destination}"`);

        const formatLocation = (loc) => {
            if (!loc) return null;

            loc = loc.trim();

            if (loc.includes(',') && /^[0-9,.\-\s]+$/.test(loc)) {
                return loc.split(',').map(part => part.trim()).join(',');
            }

            return encodeURIComponent(loc);
        };

        const formattedOrigin = formatLocation(origin);
        const formattedDestination = formatLocation(destination);

        if (!formattedOrigin || !formattedDestination) {
            console.error("Invalid origin or destination after formatting");
            return null;
        }

        //const apiKey = process.env.GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY';
        const apiKey = 'AIzaSyDKNasrfh_-youtv-FQ58ieOfB-QxCOoUM'
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${formattedOrigin}&destinations=${formattedDestination}&key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        console.log(`API Response status: ${data.status}`);

        if (data.status !== 'OK') {
            console.error(`API Error: ${data.status}`);
            console.error('API response:', JSON.stringify(data));
            return null;
        }

        if (!data.rows || !data.rows[0] || !data.rows[0].elements || !data.rows[0].elements[0]) {
            console.error('Invalid response structure from Distance Matrix API');
            return null;
        }

        const element = data.rows[0].elements[0];

        if (element.status !== 'OK') {
            console.error(`API Element Error: ${element.status}`);
            return null;
        }

        return {
            value: element.distance.value,
            text: element.distance.text
        };
    } catch (error) {
        console.error('Error calculating distance:', error.message);
        return null;
    }
}

export async function findNearestBranchUsingGraph(currentLocation) {
    try {
        console.log(`Finding nearest branch for location: "${currentLocation}"`);

        if (!currentLocation) {
            console.error("Current location is missing or invalid");
            throw new Error("Current location is required");
        }

        const graph = await buildDistanceGraph(currentLocation);

        if (!graph || !graph.edges || !graph.nodes) {
            console.error("Invalid graph data");
            throw new Error("Failed to build location graph");
        }

        let nearestId = null;
        let minDistance = Infinity;
        let distanceText = "";

        const edges = graph.edges.filter(edge => edge.source === "current");
        console.log(`Found ${edges.length} connections from current location`);

        for (const edge of edges) {
            if (edge.distance < minDistance) {
                minDistance = edge.distance;
                nearestId = edge.target;
                distanceText = edge.distanceText;
            }
        }

        if (!nearestId) {
            console.error("Could not find nearest branch");
            throw new Error("No nearest branch found");
        }

        const nearest = graph.nodes.find(node => node.id === nearestId);
        if (!nearest) {
            console.error("Nearest branch node not found in graph");
            throw new Error("Branch data not found");
        }

        console.log(`Found nearest branch: ${nearest.name} (${distanceText})`);

        return {
            name: nearest.name,
            address: nearest.address,
            distance: distanceText,
            coords: {
                latitude: null,
                longitude: null
            },
            locationId: nearest.LocationID // ✅ כאן הוספה חשובה!
        };
    } catch (error) {
        console.error("Error finding nearest branch:", error.message);

        return {
            name: "Default Branch (Error Fallback)",
            address: "123 Main St, Fallback City",
            distance: "N/A",
            coords: {
                latitude: 32.0853,
                longitude: 34.7818
            }
        };
    }
}

export async function geocodeAddress(address) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`;

    try {
        const response = await axios.get(url);
        const data = response.data;

        if (data.status === "OK") {
            const location = data.results[0].geometry.location;
            return {
                lat: location.lat,
                lng: location.lng
            };
        } else {
            console.error("Geocode error:", data.status);
            return null;
        }
    } catch (err) {
        console.error("Error in geocode:", err);
        return null;
    }
}

export async function getTotalPriceFullParameterized(origin, destination, carPricePerMinute, batteryRating, numOfPeople) {
    try {
        // Some example for logic for the different parameters
        // pricePerminute -model, numberOfPךaces, qualityOfCar
        // batteryRating - how much battery is left till the next charge
        const distance = await getDistance(origin, destination);

       
        if (!distance) {
            console.error("Failed to calculate distance");
            return null;
        }
        if (numOfPeople > 5) {
            console.error("Number of people exceeds the limit");
            return null;
        }

        const totalPrice = (distance.value / 1000) * carPricePerMinute + (batteryRating / 60);
        return totalPrice;
    } catch (error) {
        console.error("Error calculating total price:", error);
        return null;
    }
}
export async function getTotalPrice(origin, destination , carID ,carPricePerMinute, batteryRating, NumberOfPlaces) {
    try {
        const distance = await getDistance(origin, destination);

        if (!distance) {
            console.error("Failed to calculate distance");
            return null;
        }

        //שליפת הפרטים של הרכב לפי המספר מזהה שלו
        const car = await ElectricCar.findOne({ carID });

        //אם זה לא מחזיר בקילומטרים א ממיר את המרחק לקילומטרים
        const distanceInKm = distance.value / 1000;

        //מחושב לפי הסוג רכב והמספר מקומות ברכב
        const PricePerMinute = car.pricePerMinute * car.NumberOfPlaces;

        const totalPrice = (distanceInKm * PricePerMinute) + batteryRating
    } catch (error) {
        console.error("Error calculating total price:", error);
        return null;
    }
}