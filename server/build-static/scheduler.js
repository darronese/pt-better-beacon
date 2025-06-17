// builds static data every 24 hours
import { combineStatic } from "./combineStatic.js";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

async function refresh() {
  try {
    await combineStatic();
    console.log("Static data built at", new Date().toLocaleString());
  } catch (err) {
    console.log("Failed to build static data");
  }
}

export function startStaticScheduler() {
  refresh();
  setInterval(refresh, ONE_DAY_MS);
}
