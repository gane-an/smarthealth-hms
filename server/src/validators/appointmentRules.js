export function checkBookingRules(input) {
  const hasSameDept = !!input && !!input.hasSameDept;
  const hasSameTime = !!input && !!input.hasSameTime;
  if (hasSameDept) {
    return {
      allowed: false,
      code: "DUP_DEPARTMENT",
      message: "You already have an appointment in this department on this date",
    };
  }
  if (hasSameTime) {
    return {
      allowed: false,
      code: "DUP_TIME",
      message: "You already have an appointment at this time on this date",
    };
  }
  return { allowed: true };
}
