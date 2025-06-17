import fs from "fs/promises";
import haversine from "haversine-distance";

async function loadStaticData() {
  // get file and return it parsed
  try {
    const data = await fs.readFile("./mergedStatic.json", "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading merged static file", err);
    return null;
  }
}

function formatEta(sec) {
  if (!isFinite(sec)) return "-";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export async function calculateAllEta(busPositions) {
  /*
  // get the first bus position for testing
  // stop PAR_T16 (temp)
  const tempLatitudeBus = busPositions[0].position.latitude;
  const tempLongitudeBus = busPositions[0].position.longitude;
  */

  // call our load static data function to get an object of our json
  const entries = await loadStaticData();
  if (!entries) {
    return [];
  }

  // group stops by trip_id
  const stopsByTrip = entries.reduce((acc, [, route]) => {
    const { trip_id, stop_id, stop_name, stop_lat, stop_lon } = route;
    if (!acc[trip_id]) acc[trip_id] = [];
    acc[trip_id].push({
      stopId: stop_id,
      name: stop_name,
      lat: parseFloat(stop_lat),
      lon: parseFloat(stop_lon),
    });
    return acc;
  }, {});

  // console.log("stopsByTrip =", JSON.stringify(stopsByTrip, null, 2));

  // for each live bus calculate the distance for every stop on its track
  const results = busPositions.map(bus => {
    const stops = stopsByTrip[bus.tripId] || [];
    const { latitude: bLat, longitude: bLon, speed } = bus.position;
    // change km/h -> mps if needed
    const mps = speed > 50 ? speed * (1000 / 3600) : speed;
    const etas = stops.map(stop => {
      const d = haversine(
        { latitude: bLat, longitude: bLon },
        { latitude: stop.lat, longitude: stop.lon },
      );
      const etaSec = mps > 0 ? Math.round(d/ mps) : Infinity;
      return {
        stopId: stop.stopId,
        name: stop.name,
        distance: Math.round(d),
        etaSec: Math.round(etaSec),
        eta: formatEta(Math.round(etaSec)),
      };
    }).sort((a, b) => a.etaSec - b.etaSec);

    console.log(`Bus ${bus.id} (trip ${bus.tripId}) next 3 ETAs:`);
    console.table(etas.slice(0, 3), ["stopId", "name", "distance", "eta"]);

    return {
      busId: bus.id,
      tripId: bus.tripId,
      etas,
    };
  });
  /*
  // debugging step: printing all bus positions and id
  console.log("\nLive Bus Positions:");
  busPositions.forEach((bus, index) => {
    console.log(`\nBus #${index + 1} (ID: ${bus.id}) (Trip ID: ${bus.tripId})`);
    console.log("  Timestamp:", bus.timestamp);
    console.log("  Latitude: ", bus.position.latitude);
    console.log("  Longitude:", bus.position.longitude);
    console.log("  Bearing:  ", bus.position.bearing);
    console.log("  Speed:    ", bus.position.speed);
  });
  */
  return results;
}
