import assert from "assert";
import { isPastTimeSlotForDate } from "../utils/timeSlots.js";

function run() {
  const today = new Date();
  const future = new Date(today);
  future.setHours(today.getHours() + 1, 0, 0, 0);

  const past = new Date(today);
  past.setHours(today.getHours() - 1, 0, 0, 0);

  const futureLabel = future.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const pastLabel = past.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const isoDate = today.toISOString().split("T")[0];

  assert.strictEqual(isPastTimeSlotForDate(new Date(isoDate), pastLabel), true);
  assert.strictEqual(isPastTimeSlotForDate(new Date(isoDate), futureLabel), false);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  assert.strictEqual(isPastTimeSlotForDate(tomorrow, pastLabel), false);

  console.log("timeSlotValidation tests passed");
}

run();

