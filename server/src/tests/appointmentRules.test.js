import assert from "assert";
import { checkBookingRules } from "../validators/appointmentRules.js";

function run() {
  const r1 = checkBookingRules({ hasSameDept: false, hasSameTime: false });
  assert.strictEqual(r1.allowed, true);

  const r2 = checkBookingRules({ hasSameDept: true, hasSameTime: false });
  assert.strictEqual(r2.allowed, false);
  assert.strictEqual(r2.code, "DUP_DEPARTMENT");

  const r3 = checkBookingRules({ hasSameDept: false, hasSameTime: true });
  assert.strictEqual(r3.allowed, false);
  assert.strictEqual(r3.code, "DUP_TIME");

  const r4 = checkBookingRules({ hasSameDept: true, hasSameTime: true });
  assert.strictEqual(r4.allowed, false);
  assert.strictEqual(r4.code, "DUP_DEPARTMENT");
}

run();
console.log("appointmentRules tests passed");
