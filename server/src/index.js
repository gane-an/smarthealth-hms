import http from "http";
import app from "./app.js";
import { PORT } from "./config.js";
import { initRealtime } from "./realtime.js";
import { startAppointmentLifecycleScheduler } from "./appointmentLifecycle.js";

const server = http.createServer(app);

initRealtime(server);
startAppointmentLifecycleScheduler();

server.listen(PORT, () => {
  console.log(`SmartHealth server running on port ${PORT}`);
});
