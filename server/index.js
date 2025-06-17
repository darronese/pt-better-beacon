import { rawBusSocket } from "./web-socket/rawBusSocket.js";
import { processRawData } from "./web-socket/processRawData.js";
import { startStaticScheduler } from "./build-static/scheduler.js";
// catch error
run().catch((err) => console.log(err));

// function to get data
async function run() {
  // build static data every 24 hours
  startStaticScheduler();
  // run our raw bus socket
  rawBusSocket();
  // process it
  processRawData();
}

run().catch(err => console.error(err));
