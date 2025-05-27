import fetch from 'node-fetch';
import { } from 'dotenv/config';
import googleMaps from '@google/maps'
import dotenv from "dotenv";
import mongodb from 'mongodb';

const { ObjectId } = mongodb;
dotenv.config();
const API_KEY = 'AIzaSyDfBzegymp06dsAWHvtcSm1ztrly16-Hss';

const googleMapsClient = googleMaps.createClient({
    key: API_KEY,
});

console.log("Google Maps API Key:", process.env.GOOGLE_MAPS_API_KEY);

const MongoClient = mongodb.MongoClient;

const url = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = 'Cars';
const TravelSpeedKamesh = 80;
const MaxTime = 15;


function calculateTravelTimeToPickup(distanceInMeters, speedKmh = 50) {
    const distanceKm = distanceInMeters / 1000;

    const timeHours = distanceKm / speedKmh;
    const timeMinutes = timeHours * 60;

    return Math.round(timeMinutes);
}
function getComprehensiveTripTiming(route, userToPickupDistance, averageSpeed = 50) {
    const timing = {
        userToPickupTime: 0,
        routeTravelTime: 0,
        totalChargingTime: 0,
        totalTripTime: 0,
        chargingBreakdown: []
    };

    if (userToPickupDistance > 0) {
        timing.userToPickupTime = calculateTravelTimeToPickup(userToPickupDistance, averageSpeed);
    }

    if (route) {
        // Use the separated charging time from the route if available
        if (route.ChargingTime !== undefined) {
            timing.totalChargingTime = route.ChargingTime;
        } else {
            // Fallback to regex parsing if needed
            const description = route.Description || '';
            const chargingMatches = description.match(/זמן טעינה: (\d+) דקות/g);

            if (chargingMatches) {
                timing.totalChargingTime = chargingMatches.reduce((total, match) => {
                    const minutes = parseInt(match.match(/(\d+)/)[1]);
                    return total + minutes;
                }, 0);
            }
        }

        // Use separated travel time if available
        if (route.TravelTime !== undefined) {
            timing.routeTravelTime = route.TravelTime;
        } else {
            timing.routeTravelTime = Math.max(0, (route.TotalTime || 0) - timing.totalChargingTime);
        }

        // Add charging breakdown if available
        if (route.ChargingStops) {
            timing.chargingBreakdown = route.ChargingStops;
        }

        timing.totalTripTime = timing.userToPickupTime + timing.routeTravelTime + timing.totalChargingTime;
    }

    return timing;
}

function formatTripTime(totalMinutes) {
    if (totalMinutes < 60) {
        return `${totalMinutes} דקות`;
    } else {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (minutes === 0) {
            return `${hours} שעות`;
        } else {
            return `${hours} שעות ו-${minutes} דקות`;
        }
    }
}



function calculateTotalRouteDistance(route, userToPickupDistance = 0) {
    if (!route) return 0;

    let totalDistance = route.Distance || 0;

    if (userToPickupDistance > 0 && route.BestPath && route.BestPath[0] !== 'userLocation') {
        totalDistance += userToPickupDistance;
    }

    return totalDistance;
}

async function findCarById(carId) {
    const client = new MongoClient(process.env.MONGO_URI || 'mongodb://localhost:27017');
    try {
        await client.connect();
        const database = client.db(dbName);
        const collection = database.collection('ElectricCars');

        const allCars = await collection.find({}).toArray();

        const car = allCars.find(car =>
            (car._id.toString() === carId.toString()) ||
            (car.carID && car.carID.toString() === carId.toString())
        );

        if (!car || !car.status) {
            console.log(`Car with ID ${carId} is not available`);
            return {
                success: false,
                message: "הרכב המבוקש אינו זמין."
            };
        }
        return car;
    } catch (error) {
        console.error(`Error finding car: ${error.message}`);
        return {
            success: false,
            message: "אירעה שגיאה בחיפוש הרכב."
        };
    } finally {
        await client.close();
    }
}

export const GEToriginAnddest = async (origin, destination, destName, userPreferences = {}, carId = null) => {
    try {
        const preferences = {
            carRequirements: userPreferences.carRequirements || null,
            forceRoute: userPreferences.forceRoute !== undefined ? userPreferences.forceRoute : true,
            allowCarSwitch: userPreferences.allowCarSwitch !== undefined ? userPreferences.allowCarSwitch : true,
            maxWaitTime: userPreferences.maxWaitTime || 15
        };

        console.log("User preferences:", preferences);

        let result = await getPickupPoints(origin, destination);
        if (!result) {
            console.log("No pickup points found in range");
            return {
                success: false,
                message: "לא נמצאו נקודות איסוף בטווח מתאים."
            };
        }

        let newOrigin = result.origin;
        let pickupPointsInRange = result.pickupPointsInRange;
        let distance = result.distance;
        let userToPickupDistance = result.userToPickupDistance || 0;

        console.log(`Found ${pickupPointsInRange.length} pickup points in range`);
        console.log(`Total distance from origin to destination: ${distance/1000} km`);
        console.log(`Distance from user to pickup point: ${userToPickupDistance/1000} km`);

        let bestCar = null;
        let availableCars;

        if(!carId){
            console.log(`The constraints before fetchAvailableCars: ${JSON.stringify(preferences)}, ${newOrigin}`);
            availableCars = await fetchAvailableCarsByPickupPoint(
                newOrigin.stationID || newOrigin._id,
                preferences.carRequirements,
                preferences.forceRoute
            );

            if (!availableCars || availableCars.length === 0) {
                console.log("No suitable cars available at the selected pickup point");
                return {
                    success: false,
                    message: "לא נמצאו רכבים מתאימים בנקודת האיסוף הקרובה לפי הדרישות שלך."
                };
            }
            console.log(`Found ${availableCars.length} suitable cars at pickup point`);
            bestCar = selectBestCar(availableCars, distance);
        } else {
            bestCar = await findCarById(carId);
            if (!bestCar.success && bestCar.success !== undefined) {
                return bestCar; // Return the error from findCarById
            }
        }

        console.log(`Selected best car with ID: ${bestCar.carID || bestCar._id}, Battery: ${bestCar.batteryAmount}%`);

        const routeResult = await createGraph(
            newOrigin,
            pickupPointsInRange,
            destination,
            destName,
            bestCar,
            preferences.maxWaitTime,
            preferences.allowCarSwitch
        );

        if (!routeResult) {
            return {
                success: false,
                message: `לא נמצא מסלול תקין עם זמן טעינה מתחת ל-${preferences.maxWaitTime} דקות. אנא נסה להגדיל את זמן ההמתנה המקסימלי או אפשר החלפת רכבים.`
            };
        }

        const totalDistance = calculateTotalRouteDistance(routeResult, userToPickupDistance);

        // Calculate proper timing with the enhanced function
        const userToPickupTravelTime = calculateTravelTimeToPickup(userToPickupDistance);
        const comprehensiveTiming = getComprehensiveTripTiming(routeResult, userToPickupDistance);

        console.log("=== DISTANCE CALCULATION ===");
        console.log(`Distance from user to pickup point: ${userToPickupDistance/1000} km`);
        console.log(`Distance from pickup to destination (route): ${routeResult.Distance/1000} km`);
        console.log(`TOTAL DISTANCE: ${totalDistance/1000} km`);

        console.log("=== TIME CALCULATION ===");
        console.log(`Time from user to pickup point: ${comprehensiveTiming.userToPickupTime} minutes`);
        console.log(`Route travel time: ${comprehensiveTiming.routeTravelTime} minutes`);
        console.log(`Total charging time: ${comprehensiveTiming.totalChargingTime} minutes`);
        console.log(`TOTAL TRIP TIME: ${comprehensiveTiming.totalTripTime} minutes (${formatTripTime(comprehensiveTiming.totalTripTime)})`);

        // Validate that charging time is within limits
        if (comprehensiveTiming.totalChargingTime > preferences.maxWaitTime) {
            return {
                success: false,
                message: `זמן הטעינה הנדרש (${comprehensiveTiming.totalChargingTime} דקות) עולה על המגבלה (${preferences.maxWaitTime} דקות).`
            };
        }

        // Update the route result with proper timing
        routeResult.Distance = totalDistance;
        routeResult.DistanceKm = (totalDistance/1000).toFixed(2);
        routeResult.TotalTime = comprehensiveTiming.totalTripTime;
        routeResult.TotalTimeFormatted = formatTripTime(comprehensiveTiming.totalTripTime);
        routeResult.TimingBreakdown = comprehensiveTiming;

        return {
            success: true,
            route: routeResult,
            selectedCar: bestCar,
            timing: comprehensiveTiming,
            chargingInfo: {
                totalChargingTime: comprehensiveTiming.totalChargingTime,
                maxAllowedTime: preferences.maxWaitTime,
                chargingStops: comprehensiveTiming.chargingBreakdown || []
            }
        };
    } catch (err) {
        console.error("Error in GEToriginAnddest:", err);
        return {
            success: false,
            message: "אירעה שגיאה בחיפוש מסלול: " + err.message
        };
    }
};

export async function updateCarStatus(carId) {
    const client = new MongoClient(process.env.MONGO_URI || 'mongodb://localhost:27017');

    try {
        await client.connect();
        console.log(`Connecting to database to update car status for car ${carId}`);

        const database = client.db(dbName);
        const collection = database.collection('Electric Cars');

        const car = await collection.findOne({
            $or: [
                { _id: carId },
                { carID: carId }
            ]
        });

        if (!car) {
            console.error(`Car with ID ${carId} not found in database`);
            return false;
        }

        const updateResult = await collection.updateOne(
            {
                $or: [
                    { _id: carId },
                    { carID: carId }
                ]
            },
            { $set: { status: false } }
        );

        if (updateResult.modifiedCount === 1) {
            console.log(`Successfully updated status to false for car ${carId}`);
            return true;
        } else {
            console.error(`Failed to update status for car ${carId}`);
            return false;
        }
    } catch (error) {
        console.error(`Error updating car status: ${error.message}`);
        return false;
    } finally {
        await client.close();
    }
}

function selectBestCar(availableCars, distance, isAllowCarSwitch = true, maxWaitTime = 15) {
    const suitableCars = availableCars.filter(car => car.batteryAmount * car.meterPerBattery > distance);

    if((maxWaitTime === 0 && !isAllowCarSwitch) || suitableCars.length === 0){
        const maxCar = availableCars.reduce((maxCar, currentCar) => {
            return (currentCar.batteryAmount * currentCar.meterPerBattery) > (maxCar.batteryAmount * maxCar.meterPerBattery) ? currentCar : maxCar;
        });
        return maxCar;
    }

    const bestCar = suitableCars.reduce((best, car) =>
        car.batteryAmount < best.batteryAmount ? car : best
    );

    return bestCar;
}

const createGraph = async (originLocation, nodes, destination, destName, car, maxWaitTime = 300, allowCarSwitch = true) => {
    let destinationsLocations = [originLocation.coords, ...nodes.map(n => n.coords), destination];
    let nodeMap = [originLocation, ...nodes, { coords: destination, isPickupPoint: false, destinationName: destName }];

    let graph = [];

    for (let i = 0; i < destinationsLocations.length; i++) {
        for (let j = 0; j < destinationsLocations.length; j++) {
            if (i === j) continue;
            let origin = `${destinationsLocations[i].lat || destinationsLocations[i].latitude},${destinationsLocations[i].lng || destinationsLocations[i].longitude}`;
            let target = `${destinationsLocations[j].lat || destinationsLocations[j].latitude},${destinationsLocations[j].lng || destinationsLocations[j].longitude}`;
            await delay(300);
            let response = await getDistance(origin, target);
            if (response && response.json.rows[0].elements[0].status === 'OK') {
                let distance = response.json.rows[0].elements[0].distance.value;
                let time = Math.round(response.json.rows[0].elements[0].duration_in_traffic.value / 60);
                graph.push({ origin: i, destination: j, distance, travelTime: time });
            }
            await delay(300);
        }
    }

    const allPaths = await getAllPaths(graph, 0, destinationsLocations.length - 1);

    let shortestPath = null;
    let minTime = Infinity;

    for (const path of allPaths) {
        let distanceSum = 0;
        let totalTravelTime = 0;
        let totalChargeTime = 0;
        let currentCar = {
            ...car,
            ChargingRate: car.ChargingRate || 0.02
        };
        let steps = [];
        let chargingStops = [];
        let valid = true;
        let battery = currentCar.batteryAmount;

        for (let i = 0; i < path.length - 1; i++) {
            const from = path[i], to = path[i + 1];
            const edge = graph.find(e => e.origin === from && e.destination === to);
            if (!edge) {
                valid = false;
                break;
            }

            const batteryRange = battery * currentCar.meterPerBattery;
            const minBatteryReserve = 5; // Minimum battery reserve percentage

            if (batteryRange >= edge.distance && battery > minBatteryReserve) {
                battery -= Math.ceil(edge.distance / currentCar.meterPerBattery);
                distanceSum += edge.distance;
                totalTravelTime += edge.travelTime;
               // steps.push(`${nodeMap[from].stationID || "Unknown"} ->`);
               const label = nodeMap[from].address || nodeMap[from].stationID || "תחנה לא ידועה";
               steps.push(`${label} ->`);
            } else {
                const point = nodeMap[from];
                const requiredBattery = Math.ceil((edge.distance / currentCar.meterPerBattery) + minBatteryReserve);
                const missingBattery = requiredBattery - battery;
                const batteryToAdd = Math.min(100 - battery, Math.max(missingBattery, 0));
                const timeToCharge = Math.round(batteryToAdd / currentCar.ChargingRate);

                // Check if adding this charging time would exceed maxWaitTime
                if (totalChargeTime + timeToCharge > maxWaitTime) {
                    if (allowCarSwitch && from !== 0 && point.isPickupPoint) {
                        const newCars = await fetchAvailableCarsByPickupPoint(point.stationID || point._id);
                        const newCar = newCars?.find(c => c.batteryAmount * c.meterPerBattery >= edge.distance);
                        if (newCar) {
                            steps.push(`החלפת רכב לרכב ${newCar.carID || newCar._id} ->`);
                            currentCar = {
                                ...newCar,
                                ChargingRate: newCar.ChargingRate || 0.02
                            };
                            battery = currentCar.batteryAmount;
                            battery -= Math.ceil(edge.distance / currentCar.meterPerBattery);
                            distanceSum += edge.distance;
                            totalTravelTime += edge.travelTime;
                            continue;
                        } else {
                            // No suitable car for switch, this path is invalid
                            valid = false;
                            break;
                        }
                    } else {
                        // Can't switch cars and charging time exceeds limit, path is invalid
                        valid = false;
                        break;
                    }
                }

                // Add charging stop
                chargingStops.push({
                    location: point.address || point.stationID || "Unknown",
                    batteryAdded: batteryToAdd,
                    timeToCharge: timeToCharge
                });

                steps.push(`טעינה של ${batteryToAdd}% בנקודה ${point.address || "Unknown"} (זמן טעינה: ${timeToCharge} דקות) ->`);

                battery += batteryToAdd;
                totalChargeTime += timeToCharge;
                totalTravelTime += edge.travelTime;

                battery -= Math.ceil(edge.distance / currentCar.meterPerBattery);
                distanceSum += edge.distance;
            }
        }

        const totalTime = totalTravelTime + totalChargeTime;

        // Only accept paths where total charging time is within limit
        if (valid && totalTime < minTime && totalChargeTime <= maxWaitTime) {
            shortestPath = {
                path,
                totalDistance: distanceSum,
                steps,
                totalTravelTime,
                totalChargeTime,
                totalTime,
                chargingStops
            };
            minTime = totalTime;
        }
    }

    if (shortestPath) {
        console.log("========================")
        console.log(nodeMap[shortestPath.path.at(-1)].destinationName)
        //const readablePath = shortestPath.steps.join(" ") + (nodeMap[shortestPath.path.at(-1)].destinationName.destinationLocation || "יעד");
        const lastPoint = nodeMap[shortestPath.path.at(-1)];
        const destinationLabel = lastPoint.address || lastPoint.destinationName?.destinationLocation || "יעד";
        const readablePath = shortestPath.steps.join(" ") + destinationLabel;   
        console.log("המסלול הקצר ביותר שנבחר:", readablePath);
        console.log("מרחק כולל:", (shortestPath.totalDistance / 1000).toFixed(2), "ק\"מ");
        console.log("זמן נסיעה:", shortestPath.totalTravelTime, "דקות");
        console.log("זמן טעינה:", shortestPath.totalChargeTime, "דקות");
        console.log("זמן כולל:", shortestPath.totalTime, "דקות");

        return {
            graph,
            AllPaths: allPaths,
            BestPath: shortestPath.path,
            Distance: shortestPath.totalDistance,
            TravelTime: shortestPath.totalTravelTime,
            ChargingTime: shortestPath.totalChargeTime,
            TotalTime: shortestPath.totalTime,
            ChargingStops: shortestPath.chargingStops,
            Description: readablePath
        };
    } else {
        console.log("לא נמצא מסלול תקין עם זמן טעינה מתחת למגבלה.");
        return null;
    }
};

const getAllPaths = async (graph, sourceIndex, destinationIndex) => {
    const paths = [];
    const path = [sourceIndex];
    const visited = new Set();

    const dfs = async (nodeIndex) => {
        if (nodeIndex === destinationIndex) {
            paths.push([...path]);
            return;
        }

        visited.add(nodeIndex);
        for (const edge of graph) {
            if (edge.origin === nodeIndex && !visited.has(edge.destination)) {
                path.push(edge.destination);
                await dfs(edge.destination);
                path.pop();
            }
        }
        visited.delete(nodeIndex);
    };

    await dfs(sourceIndex);
    return paths;
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getDistance(origin, target) {
    return new Promise((resolve, reject) => {
        googleMapsClient.distanceMatrix(
            { origins: [origin], destinations: [target], mode: 'driving', departure_time: 'now', },
            (err, response) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(response);
                }
            }
        );
    });
}

async function getPickupPoints(userLocation, destinationLocation) {
    const client = new MongoClient(process.env.MONGO_URI || 'mongodb://localhost:27017');

    try {
        await client.connect();
        const database = client.db(dbName);
        const collection = database.collection('ChargingStations');

        const pickupPoints = await collection.find({ isPickupPoint: true }).toArray();

        console.log(`Found ${pickupPoints.length} total pickup points in database`);

        if (pickupPoints.length === 0) {
            console.log("לא נמצאו נקודות איסוף במסד הנתונים.");
            return null;
        }

        let closestPoint = null;
        let closestDistance = Infinity;

        for (const point of pickupPoints) {
            try {
                if (!point.coords || (!point.coords.latitude && !point.coords.lat)) {
                    console.log(`Skipping point ${point.stationID} - missing or invalid coordinates`);
                    continue;
                }

                const pointCoords = {
                    latitude: point.coords.latitude || point.coords.lat,
                    longitude: point.coords.longitude || point.coords.lng
                };

                const originCoords = `${userLocation.latitude},${userLocation.longitude}`;
                const pointCoordsStr = `${pointCoords.latitude},${pointCoords.longitude}`;

                const distanceFromOrigin = await getDistance(originCoords, pointCoordsStr);

                if (!distanceFromOrigin || !distanceFromOrigin.json ||
                    !distanceFromOrigin.json.rows || !distanceFromOrigin.json.rows[0] ||
                    !distanceFromOrigin.json.rows[0].elements || !distanceFromOrigin.json.rows[0].elements[0] ||
                    distanceFromOrigin.json.rows[0].elements[0].status !== 'OK') {
                    console.log(`Could not calculate distance for point ${point.stationID}`);
                    continue;
                }

                const distanceInMeters = distanceFromOrigin.json.rows[0].elements[0].distance.value;

                if (distanceInMeters < closestDistance) {
                    closestDistance = distanceInMeters;
                    closestPoint = point;
                }
            } catch (err) {
                console.error(`Error calculating distance for point ${point.stationID}:`, err);
            }

            await delay(300);
        }

        if (!closestPoint) {
            console.log("לא נמצאה נקודת איסוף קרובה.");
            return null;
        }

        console.log(`Closest pickup point: ${closestPoint.stationID} at distance: ${closestDistance}m`);
        const newOrigin = closestPoint;

        await delay(300);

        try {
            const originCoords = `${newOrigin.coords.latitude || newOrigin.coords.lat},${newOrigin.coords.longitude || newOrigin.coords.lng}`;
            const destCoords = `${destinationLocation.latitude},${destinationLocation.longitude}`;

            const distanceFromOriginToDestination = await getDistance(originCoords, destCoords);

            if (!distanceFromOriginToDestination ||
                !distanceFromOriginToDestination.json ||
                !distanceFromOriginToDestination.json.rows ||
                !distanceFromOriginToDestination.json.rows[0] ||
                !distanceFromOriginToDestination.json.rows[0].elements ||
                !distanceFromOriginToDestination.json.rows[0].elements[0] ||
                distanceFromOriginToDestination.json.rows[0].elements[0].status !== 'OK') {
                console.log("Could not calculate distance from origin to destination");
                return {
                    origin: newOrigin,
                    pickupPointsInRange: [],
                    distance: 0
                };
            }

            const distanceFromOriginToDestinationInMeters = distanceFromOriginToDestination.json.rows[0].elements[0].distance.value;
            console.log(`Distance from origin to destination: ${distanceFromOriginToDestinationInMeters/1000} km`);

            const pickupPointsInRange = [];

            const MAX_RANGE_FACTOR = 1.5;

            for (const point of pickupPoints) {
                if (point.stationID === newOrigin.stationID) {
                    continue;
                }

                try {
                    if (!point.coords || (!point.coords.latitude && !point.coords.lat)) {
                        continue;
                    }

                    const pointCoords = {
                        latitude: point.coords.latitude || point.coords.lat,
                        longitude: point.coords.longitude || point.coords.lng
                    };

                    await delay(300);

                    const originCoords = `${newOrigin.coords.latitude || newOrigin.coords.lat},${newOrigin.coords.longitude || newOrigin.coords.lng}`;
                    const pointCoordsStr = `${pointCoords.latitude},${pointCoords.longitude}`;

                    const distanceFromOrigin = await getDistance(originCoords, pointCoordsStr);

                    if (!distanceFromOrigin ||
                        !distanceFromOrigin.json ||
                        !distanceFromOrigin.json.rows ||
                        !distanceFromOrigin.json.rows[0] ||
                        !distanceFromOrigin.json.rows[0].elements ||
                        !distanceFromOrigin.json.rows[0].elements[0] ||
                        distanceFromOrigin.json.rows[0].elements[0].status !== 'OK') {
                        continue;
                    }

                    const distanceFromOriginInMeters = distanceFromOrigin.json.rows[0].elements[0].distance.value;

                    await delay(300);

                    const destCoords = `${destinationLocation.latitude},${destinationLocation.longitude}`;
                    const distanceFromDestination = await getDistance(pointCoordsStr, destCoords);

                    if (!distanceFromDestination ||
                        !distanceFromDestination.json ||
                        !distanceFromDestination.json.rows ||
                        !distanceFromDestination.json.rows[0] ||
                        !distanceFromDestination.json.rows[0].elements ||
                        !distanceFromDestination.json.rows[0].elements[0] ||
                        distanceFromDestination.json.rows[0].elements[0].status !== 'OK') {
                        continue;
                    }

                    const distanceFromDestinationInMeters = distanceFromDestination.json.rows[0].elements[0].distance.value;

                    console.log(`Point: ${pointCoords.latitude}, ${pointCoords.longitude}`);
                    console.log(`Distance from origin (new origin): ${distanceFromOriginInMeters} meters`);
                    console.log(`Distance from destination: ${distanceFromDestinationInMeters} meters`);
                    console.log(`Direct distance: ${distanceFromOriginToDestinationInMeters} meters`);

                    if (distanceFromOriginInMeters + distanceFromDestinationInMeters <=
                        distanceFromOriginToDestinationInMeters * MAX_RANGE_FACTOR) {
                        console.log(`Adding point ${point.stationID} to range`);
                        pickupPointsInRange.push(point);
                    }
                } catch (err) {
                    console.error(`Error processing point ${point.stationID}:`, err);
                }
            }

            console.log(`Found ${pickupPointsInRange.length} pickup points in range`);

            return {
                origin: newOrigin,
                pickupPointsInRange: pickupPointsInRange,
                distance: distanceFromOriginToDestinationInMeters,
                userToPickupDistance: closestDistance
            };

        } catch (err) {
            console.error("Error calculating distances:", err);
            return {
                origin: newOrigin,
                pickupPointsInRange: [],
                distance: 0
            };
        }

    } catch (err) {
        console.error("Error retrieving pickup points:", err);
        return null;
    } finally {
        await client.close();
    }
}

export async function fetchAvailableCarsByPickupPoint(pickupPointID, userRequirements = null, forceRoute = false) {
    const client = new MongoClient(process.env.MONGO_URI || 'mongodb://localhost:27017');

    try {
        await client.connect();
        const database = client.db(dbName);
        const collection = database.collection('ElectricCars');
        const allCars = await collection.find({}).toArray();

        const availableCars = await collection.find({ stationID: pickupPointID, status: true }).toArray();

        if (availableCars.length === 0) {
            console.log(`No available cars found at pickup point ${pickupPointID}`);
            return null;
        }

        if (!userRequirements) {
            console.log(`Returning all ${availableCars.length} available cars at pickup point ${pickupPointID}`);
            return availableCars;
        }

        const suitableCars = availableCars.filter(car => {
            if (userRequirements.minBatteryAmount && car.batteryAmount < userRequirements.minBatteryAmount) {
                return false;
            }

            if (userRequirements.carType && car.CarType !== userRequirements.carType) {
                return false;
            }

            if (userRequirements.minPassengers && car.PassengerCapacity < userRequirements.minPassengers) {
                return false;
            }

            return true;
        });

        if (suitableCars.length > 0) {
            console.log(`Found ${suitableCars.length} suitable cars matching user requirements at pickup point ${pickupPointID}`);
            return suitableCars;
        }else if(suitableCars.length  === 0) {
            console.log(`No cars matching requirements found at pickup point ${pickupPointID}`);
        }

        if (forceRoute) {
            console.log(`No cars matching requirements found, but user requested any available car. Returning all ${availableCars.length} available cars`);
            return availableCars;
        }

        console.log(`No cars matching requirements found at pickup point ${pickupPointID} and user didn't request force route`);
        return null;

    } catch (err) {
        console.error("Error fetching available cars:", err);
        return null;
    } finally {
        await client.close();
    }
}

export async function getClosestPickupPoint(userLocation) {
    const client = new MongoClient(process.env.MONGO_URI || 'mongodb://localhost:27017');

    try {
        await client.connect();
        const database = client.db(dbName);
        const collection = database.collection('ChargingStations');

        const pickupPoints = await collection.find({ isPickupPoint: true }).toArray();

        console.log(`Found ${pickupPoints.length} total pickup points in database`);

        if (pickupPoints.length === 0) {
            console.log("No pickup points found in the database.");
            return null;
        }

        let closestPoint = null;
        let closestDistance = Infinity;

        for (const point of pickupPoints) {
            try {
                if (!point.coords || (!point.coords.latitude && !point.coords.lat)) {
                    console.log(`Skipping point ${point.stationID} - missing or invalid coordinates`);
                    continue;
                }

                const pointCoords = {
                    latitude: point.coords.latitude || point.coords.lat,
                    longitude: point.coords.longitude || point.coords.lng
                };

                const originCoords = `${userLocation.latitude},${userLocation.longitude}`;
                const pointCoordsStr = `${pointCoords.latitude},${pointCoords.longitude}`;

                const distanceResponse = await getDistance(originCoords, pointCoordsStr);

                if (!distanceResponse || !distanceResponse.json ||
                    !distanceResponse.json.rows || !distanceResponse.json.rows[0] ||
                    !distanceResponse.json.rows[0].elements || !distanceResponse.json.rows[0].elements[0] ||
                    distanceResponse.json.rows[0].elements[0].status !== 'OK') {
                    console.log(`Could not calculate distance for point ${point.stationID}`);
                    continue;
                }

                const distanceInMeters = distanceResponse.json.rows[0].elements[0].distance.value;

                if (distanceInMeters < closestDistance) {
                    closestDistance = distanceInMeters;
                    closestPoint = point;
                }
            } catch (err) {
                console.error(`Error calculating distance for point ${point.stationID}:`, err);
            }

            await delay(300);
        }

        if (!closestPoint) {
            console.log("No accessible pickup point found.");
            return null;
        }

        console.log(`Closest pickup point: ${closestPoint.stationID} at distance: ${closestDistance}m`);

        return {
            point: closestPoint,
            distance: closestDistance
        };

    } catch (err) {
        console.error("Error retrieving pickup points:", err);
        return null;
    } finally {
        await client.close();
    }
}