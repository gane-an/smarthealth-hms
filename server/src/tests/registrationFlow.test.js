import http from "http";

function postJson(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);

    const request = http.request(
      {
        hostname: "localhost",
        port: 4000,
        path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (response) => {
        let raw = "";

        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          raw += chunk;
        });
        response.on("end", () => {
          let parsed = raw;
          try {
            parsed = JSON.parse(raw);
          } catch {
          }
          resolve({ status: response.statusCode, body: parsed });
        });
      },
    );

    request.on("error", (error) => {
      reject(error);
    });

    request.write(body);
    request.end();
  });
}

async function run() {
  const uniqueEmail = `test.patient.${Date.now()}@example.com`;

  const payload = {
    name: "Test Patient",
    email: uniqueEmail,
    phone: "1234567890",
    password: "StrongPass123",
    role: "patient",
    languagePreference: "en",
    dateOfBirth: "1990-01-01",
    gender: "male",
  };

  try {
    const result = await postJson("/api/auth/register", payload);

    if (result.status !== 201) {
      console.error("Registration test failed with status", result.status);
      console.error("Response body:", result.body);
      process.exit(1);
    }

    if (!result.body || typeof result.body !== "object" || !result.body.token || !result.body.user) {
      console.error("Registration response does not contain expected fields");
      console.error("Response body:", result.body);
      process.exit(1);
    }

    console.log("Registration test passed");
    console.log("Registered user:", result.body.user);
    process.exit(0);
  } catch (error) {
    console.error("Registration test encountered an error");
    console.error(error);
    process.exit(1);
  }
}

run();

