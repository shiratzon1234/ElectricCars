import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Linking,
  TextInput,
  Alert,
} from "react-native";
import * as Location from "expo-location";

const FindNearestBranch = () => {
  const [location, setLocation] = useState(null);
  const [response, setResponse] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualLocation, setManualLocation] = useState("");
  const [searchMethod, setSearchMethod] = useState("current"); // 'current' or 'manual'
  const [carsInBranch, setCarsInBranch] = useState([]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }
    })();
  }, []);

  const getLocation = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setSearchMethod("current");

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation(location);
      await sendLocationToAPI(location);
    } catch (error) {
      setErrorMsg("Error getting location: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const searchByManualLocation = async () => {
    if (!manualLocation.trim()) {
      setErrorMsg("Please enter a location");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      setSearchMethod("manual");

      // Since Geocoding API is deprecated in SDK 49, we'll use a direct API call to Google's Geocoding API
      // In a production app, you should use a proper API key and secure your requests
      try {
        // For demo purposes, we'll make a direct fetch to a geocoding service
        // Replace YOUR_API_KEY with an actual Google API key in production
        const apiKey = "AIzaSyDfBzegymp06dsAWHvtcSm1ztrly16-Hss"; // You should use environment variables for this
        const encodedAddress = encodeURIComponent(manualLocation);
        const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

        // In a real application, this request should be made through your backend
        // to protect your API key

        // For demo purposes, we'll create a simulated response
        // In a real app, you would uncomment the fetch code below:

        /*
                const response = await fetch(geocodingUrl);
                const data = await response.json();

                if (data.status === 'OK' && data.results && data.results.length > 0) {
                    const location = data.results[0].geometry.location;
                    const { lat, lng } = location;
                */

        // Simulate a successful geocoding response
        // This is just for demonstration - remove this in a real app
        const simulatedSuccess = true;

        if (simulatedSuccess) {
          // Create dummy coordinates based on the input string length for demo
          // In a real app, you would use the actual coordinates from the API response
          const seed = manualLocation.length;
          const lat = 32.0853 + (seed % 10) * 0.01;
          const lng = 34.7818 + (seed % 5) * 0.01;

          // Create a location object similar to getCurrentPositionAsync result
          const manualLocationObj = {
            coords: {
              latitude: lat,
              longitude: lng,
              altitude: null,
              accuracy: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: Date.now(),
          };

          setLocation(manualLocationObj);
          await sendLocationToAPI(manualLocationObj);
        } else {
          setErrorMsg("Could not find coordinates for the address provided");
        }
      } catch (error) {
        setErrorMsg("Error geocoding address: " + error.message);
      }
    } catch (error) {
      setErrorMsg("Error processing location: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendLocationToAPI = async (locationData) => {
    if (!locationData) {
      setErrorMsg("Location data not available");
      return;
    }

    try {
      const { latitude, longitude } = locationData.coords;
      const locationString = `${latitude},${longitude}`;

      const res = await fetch(
        "http://127.0.0.1:5000/api/nearest-branch-by-address",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentLocation: locationString,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        if (!data.coords) {
          data.coords = {
            latitude: latitude + 0.01,
            longitude: longitude + 0.01,
          };
        }

        setResponse(data);

        // 🆕 קריאה לרכבים של הסניף
        if (data.locationId) {
          try {
            const carsRes = await fetch(
              `http://localhost:5000/api/cars/getCarsByLocationID/${data.locationId}`
            );
            const carsData = await carsRes.json();

            if (carsRes.ok) {
              setCarsInBranch(carsData);
            } else {
              console.warn("לא נמצאו רכבים לסניף זה");
              setCarsInBranch([]);
            }
          } catch (err) {
            console.error("שגיאה בשליפת רכבים לסניף:", err.message);
            setCarsInBranch([]);
          }
        }

        setErrorMsg(null);
      } else {
        setErrorMsg(data.error || "Error fetching nearest branch");
      }
    } catch (error) {
      setErrorMsg("Error fetching nearest branch: " + error.message);
    }
  };

  const openDirections = () => {
    if (!location || !response || !response.coords) {
      setErrorMsg("Location data not available for directions");
      return;
    }

    const { latitude: startLat, longitude: startLng } = location.coords;
    const { latitude: destLat, longitude: destLng } = response.coords;

    let url;
    if (Platform.OS === "ios") {
      url = `http://maps.apple.com/?saddr=${startLat},${startLng}&daddr=${destLat},${destLng}`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${destLat},${destLng}`;
    }

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          setErrorMsg("Unable to open maps application");
        }
      })
      .catch((err) => setErrorMsg("Error opening directions: " + err));
  };

  const generateCustomMapHtml = () => {
    if (!location) return null;

    const { latitude, longitude } = location.coords;
    let mapHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                <style>
                    body, html, #map {
                        height: 100%;
                        margin: 0;
                        padding: 0;
                    }
                </style>
            </head>
            <body>
                <div id="map"></div>
                <script>
                    function initMap() {
                        const map = new google.maps.Map(document.getElementById('map'), {
                            center: { lat: ${latitude}, lng: ${longitude} },
                            zoom: 13,
                            mapTypeControl: false,
                            fullscreenControl: false
                        });
                        
                        const userMarker = new google.maps.Marker({
                            position: { lat: ${latitude}, lng: ${longitude} },
                            map: map,
                            title: "${
                              searchMethod === "current"
                                ? "Your Location"
                                : "Entered Location"
                            }",
                            icon: {
                                path: google.maps.SymbolPath.CIRCLE,
                                scale: 10,
                                fillColor: "#4285F4",
                                fillOpacity: 1,
                                strokeColor: "#FFFFFF",
                                strokeWeight: 2
                            }
                        });
                        
                        const userInfo = new google.maps.InfoWindow({
                            content: '<div style="font-weight:bold">${
                              searchMethod === "current"
                                ? "Your Location"
                                : "Entered Location: " + manualLocation
                            }</div>'
                        });
                        
                        userMarker.addListener('click', function() {
                            userInfo.open(map, userMarker);
                        });
        `;

    if (response && response.coords) {
      const branchLat = response.coords.latitude;
      const branchLng = response.coords.longitude;

      mapHtml += `
                        const branchMarker = new google.maps.Marker({
                            position: { lat: ${branchLat}, lng: ${branchLng} },
                            map: map,
                            title: "${response.name || "Branch Location"}",
                            icon: {
                                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                                scale: 6,
                                fillColor: "#DB4437",
                                fillOpacity: 1,
                                strokeColor: "#FFFFFF",
                                strokeWeight: 2
                            }
                        });
                        
                        const branchInfo = new google.maps.InfoWindow({
                            content: '<div style="font-weight:bold">${
                              response.name || "Branch"
                            }</div>' +
                                     '<div>${response.address || ""}</div>' +
                                     '<div>Distance: ${
                                       response.distance || ""
                                     }</div>'
                        });
                        
                        branchMarker.addListener('click', function() {
                            branchInfo.open(map, branchMarker);
                        });
                        
                        branchInfo.open(map, branchMarker);
                        
                        const path = new google.maps.Polyline({
                            path: [
                                { lat: ${latitude}, lng: ${longitude} },
                                { lat: ${branchLat}, lng: ${branchLng} }
                            ],
                            geodesic: true,
                            strokeColor: '#2979FF',
                            strokeOpacity: 0.8,
                            strokeWeight: 3
                        });
                        path.setMap(map);
                        
                        const bounds = new google.maps.LatLngBounds();
                        bounds.extend({ lat: ${latitude}, lng: ${longitude} });
                        bounds.extend({ lat: ${branchLat}, lng: ${branchLng} });
                        map.fitBounds(bounds);
                        
                        google.maps.event.addListenerOnce(map, 'bounds_changed', function() {
                            if (map.getZoom() > 15) {
                                map.setZoom(15);
                            }
                        });
            `;
    }

    mapHtml += `
                    }
                </script>
                <script src="https://maps.googleapis.com/maps/api/js?callback=initMap" async defer></script>
            </body>
            </html>
        `;

    return mapHtml;
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        {location ? (
          <View style={styles.staticMapContainer}>
            {Platform.OS === "web" ? (
              <iframe
                srcDoc={generateCustomMapHtml()}
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                allowFullScreen=""
                aria-hidden="false"
                tabIndex="0"
              />
            ) : (
              <View style={styles.mapPlaceholder}>
                <Text style={styles.mapPlaceholderText}>
                  {response
                    ? `${
                        searchMethod === "current" ? "Your" : "Entered"
                      } location and ${response.name} branch are ready.`
                    : `${
                        searchMethod === "current" ? "Your" : "Entered"
                      } location is ready.`}
                </Text>
                {response && (
                  <View style={styles.directionsContainer}>
                    <Button title="Get Directions" onPress={openDirections} />
                  </View>
                )}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>
              Use one of the options below to find your nearest branch.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.searchOptions}>
          <Text style={styles.sectionTitle}>Search Options</Text>

          {/* Current Location Option */}
          <View style={styles.searchOption}>
            <Text style={styles.optionTitle}>Use Current Location</Text>
            <Button
              title="Find Nearest Branch"
              onPress={getLocation}
              disabled={loading}
            />
          </View>

          {/* Manual Location Option */}
          <View style={styles.searchOption}>
            <Text style={styles.optionTitle}>Enter Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter address, city, or location"
              value={manualLocation}
              onChangeText={setManualLocation}
            />
            <Button
              title="Search"
              onPress={searchByManualLocation}
              disabled={loading || !manualLocation.trim()}
            />
          </View>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.loadingText}>
              {searchMethod === "current"
                ? "Getting your location..."
                : "Searching for location..."}
            </Text>
          </View>
        )}

        {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

        {response && (
          <View style={styles.response}>
            <Text style={styles.branchTitle}>Nearest Branch</Text>
            <Text style={styles.branchName}>{response.name}</Text>
            <Text>Distance: {response.distance}</Text>
            {response.address && <Text>Address: {response.address}</Text>}

            <View style={styles.directionsButton}>
              <Button title="Open in Maps" onPress={openDirections} />
            </View>
          </View>
        )}

        {carsInBranch.length > 0 && (
          <View style={styles.response}>
            <Text style={styles.branchTitle}>Available Cars in Branch:</Text>
            {carsInBranch.map((car, index) => (
              <View key={index} style={{ marginBottom: 10 }}>
                <Text>🚗 Model: {car.model}</Text>
                <Text>🔋 Battery: {car.batteryAmount}%</Text>
                <Text>💸 Price/Min: ₪{car.pricePerMinute}</Text>
                <Text>🧍‍♂️ Seats: {car.numberOfPlaces}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};
// make the sizes to be relative and prevent the scrolling action

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    height: "40%",
    width: "100%",
    backgroundColor: "#f0f0f0",
  },
  staticMapContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  mapPlaceholderText: {
    textAlign: "center",
    fontSize: 16,
    color: "#555",
  },
  directionsContainer: {
    marginTop: 20,
  },
  controlsContainer: {
    flex: 1,
    padding: 20,
  },
  searchOptions: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  searchOption: {
    marginBottom: 20,
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
    color: "#444",
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  error: {
    color: "red",
    marginTop: 10,
    padding: 10,
    backgroundColor: "#ffeeee",
    borderRadius: 5,
  },
  response: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#e6f7ff",
    borderRadius: 5,
    width: "100%",
  },
  branchTitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 5,
  },
  branchName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  directionsButton: {
    marginTop: 15,
  },
});

export default FindNearestBranch;
