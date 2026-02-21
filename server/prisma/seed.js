import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const doctorPassword = await bcrypt.hash("Doctor@123", 10);
  const patientPassword = await bcrypt.hash("Patient@123", 10);

  const cardiology = await prisma.department.upsert({
    where: { name: "Cardiology" },
    update: {},
    create: {
      name: "Cardiology",
    },
  });

  const pediatrics = await prisma.department.upsert({
    where: { name: "Pediatrics" },
    update: {},
    create: {
      name: "Pediatrics",
    },
  });

  const neurology = await prisma.department.upsert({
    where: { name: "Neurology" },
    update: {},
    create: {
      name: "Neurology",
    },
  });

  const orthopedics = await prisma.department.upsert({
    where: { name: "Orthopedics" },
    update: {},
    create: {
      name: "Orthopedics",
    },
  });

  const dermatology = await prisma.department.upsert({
    where: { name: "Dermatology" },
    update: {},
    create: {
      name: "Dermatology",
    },
  });

  const generalMedicine = await prisma.department.upsert({
    where: { name: "General Medicine" },
    update: {},
    create: {
      name: "General Medicine",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@smarthealth.com" },
    update: {
      name: "System Admin",
      phone: "9000000000",
      role: "admin",
      languagePreference: "en",
      isApproved: true,
      dateOfBirth: new Date("1980-01-15T00:00:00Z"),
      gender: "other",
      blocked: false,
    },
    create: {
      name: "System Admin",
      email: "admin@smarthealth.com",
      phone: "9000000000",
      passwordHash: adminPassword,
      role: "admin",
      languagePreference: "en",
      isApproved: true,
      dateOfBirth: new Date("1980-01-15T00:00:00Z"),
      gender: "other",
      blocked: false,
    },
  });

  await prisma.user.upsert({
    where: { email: "doctor1@smarthealth.com" },
    update: {
      name: "Dr. Alice Heart",
      phone: "9000000001",
      languagePreference: "en",
      isApproved: true,
      dateOfBirth: new Date("1975-03-10T00:00:00Z"),
      gender: "female",
      doctor: {
        upsert: {
          update: {
            departmentId: cardiology.id,
            licenseId: "LC-10001",
            availabilitySchedule: "Mon-Fri 10:00-16:00",
            approvalStatus: "approved",
            degrees: "MBBS, MD (Cardiology)",
            approvalDocumentPath: null,
          },
          create: {
            departmentId: cardiology.id,
            licenseId: "LC-10001",
            availabilitySchedule: "Mon-Fri 10:00-16:00",
            approvalStatus: "approved",
            degrees: "MBBS, MD (Cardiology)",
            approvalDocumentPath: null,
          },
        },
      },
    },
    create: {
      name: "Dr. Alice Heart",
      email: "doctor1@smarthealth.com",
      phone: "9000000001",
      passwordHash: doctorPassword,
      role: "doctor",
      languagePreference: "en",
      isApproved: true,
      dateOfBirth: new Date("1975-03-10T00:00:00Z"),
      gender: "female",
      doctor: {
        create: {
          departmentId: cardiology.id,
          licenseId: "LC-10001",
          availabilitySchedule: "Mon-Fri 10:00-16:00",
          approvalStatus: "approved",
          degrees: "MBBS, MD (Cardiology)",
          approvalDocumentPath: null,
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: "doctor2@smarthealth.com" },
    update: {
      name: "Dr. Brian Child",
      phone: "9000000002",
      languagePreference: "en",
      isApproved: true,
      dateOfBirth: new Date("1980-07-22T00:00:00Z"),
      gender: "male",
      doctor: {
        upsert: {
          update: {
            departmentId: pediatrics.id,
            licenseId: "LC-10002",
            availabilitySchedule: "Mon-Fri 09:00-15:00",
            approvalStatus: "approved",
            degrees: "MBBS, MD (Pediatrics)",
            approvalDocumentPath: null,
          },
          create: {
            departmentId: pediatrics.id,
            licenseId: "LC-10002",
            availabilitySchedule: "Mon-Fri 09:00-15:00",
            approvalStatus: "approved",
            degrees: "MBBS, MD (Pediatrics)",
            approvalDocumentPath: null,
          },
        },
      },
    },
    create: {
      name: "Dr. Brian Child",
      email: "doctor2@smarthealth.com",
      phone: "9000000002",
      passwordHash: doctorPassword,
      role: "doctor",
      languagePreference: "en",
      isApproved: true,
      dateOfBirth: new Date("1980-07-22T00:00:00Z"),
      gender: "male",
      doctor: {
        create: {
          departmentId: pediatrics.id,
          licenseId: "LC-10002",
          availabilitySchedule: "Mon-Fri 09:00-15:00",
          approvalStatus: "approved",
          degrees: "MBBS, MD (Pediatrics)",
          approvalDocumentPath: null,
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: "doctor3@smarthealth.com" },
    update: {
      name: "Dr. Clara Brain",
      phone: "9000000003",
      languagePreference: "en",
      isApproved: true,
      dateOfBirth: new Date("1972-11-05T00:00:00Z"),
      gender: "female",
      doctor: {
        upsert: {
          update: {
            departmentId: neurology.id,
            licenseId: "LC-10003",
            availabilitySchedule: "Mon-Fri 11:00-17:00",
            approvalStatus: "approved",
            degrees: "MBBS, DM (Neurology)",
            approvalDocumentPath: null,
          },
          create: {
            departmentId: neurology.id,
            licenseId: "LC-10003",
            availabilitySchedule: "Mon-Fri 11:00-17:00",
            approvalStatus: "approved",
            degrees: "MBBS, DM (Neurology)",
            approvalDocumentPath: null,
          },
        },
      },
    },
    create: {
      name: "Dr. Clara Brain",
      email: "doctor3@smarthealth.com",
      phone: "9000000003",
      passwordHash: doctorPassword,
      role: "doctor",
      languagePreference: "en",
      isApproved: true,
      dateOfBirth: new Date("1972-11-05T00:00:00Z"),
      gender: "female",
      doctor: {
        create: {
          departmentId: neurology.id,
          licenseId: "LC-10003",
          availabilitySchedule: "Mon-Fri 11:00-17:00",
          approvalStatus: "approved",
          degrees: "MBBS, DM (Neurology)",
          approvalDocumentPath: null,
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: "doctor4@smarthealth.com" },
    update: {
      name: "Dr. David Bones",
      phone: "9000000004",
      languagePreference: "en",
      isApproved: true,
      dateOfBirth: new Date("1983-09-18T00:00:00Z"),
      gender: "male",
      doctor: {
        upsert: {
          update: {
            departmentId: orthopedics.id,
            licenseId: "LC-10004",
            availabilitySchedule: "Tue-Sat 10:00-16:00",
            approvalStatus: "approved",
            degrees: "MBBS, MS (Orthopedics)",
            approvalDocumentPath: null,
          },
          create: {
            departmentId: orthopedics.id,
            licenseId: "LC-10004",
            availabilitySchedule: "Tue-Sat 10:00-16:00",
            approvalStatus: "approved",
            degrees: "MBBS, MS (Orthopedics)",
            approvalDocumentPath: null,
          },
        },
      },
    },
    create: {
      name: "Dr. David Bones",
      email: "doctor4@smarthealth.com",
      phone: "9000000004",
      passwordHash: doctorPassword,
      role: "doctor",
      languagePreference: "en",
      isApproved: true,
      dateOfBirth: new Date("1983-09-18T00:00:00Z"),
      gender: "male",
      doctor: {
        create: {
          departmentId: orthopedics.id,
          licenseId: "LC-10004",
          availabilitySchedule: "Tue-Sat 10:00-16:00",
          approvalStatus: "approved",
          degrees: "MBBS, MS (Orthopedics)",
          approvalDocumentPath: null,
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: "doctor5@smarthealth.com" },
    update: {
      name: "Dr. Emma Skin",
      phone: "9000000005",
      languagePreference: "en",
      isApproved: true,
      dateOfBirth: new Date("1987-02-28T00:00:00Z"),
      gender: "female",
      doctor: {
        upsert: {
          update: {
            departmentId: dermatology.id,
            licenseId: "LC-10005",
            availabilitySchedule: "Mon-Thu 12:00-18:00",
            approvalStatus: "approved",
            degrees: "MBBS, DDVL (Dermatology)",
            approvalDocumentPath: null,
          },
          create: {
            departmentId: dermatology.id,
            licenseId: "LC-10005",
            availabilitySchedule: "Mon-Thu 12:00-18:00",
            approvalStatus: "approved",
            degrees: "MBBS, DDVL (Dermatology)",
            approvalDocumentPath: null,
          },
        },
      },
    },
    create: {
      name: "Dr. Emma Skin",
      email: "doctor5@smarthealth.com",
      phone: "9000000005",
      passwordHash: doctorPassword,
      role: "doctor",
      languagePreference: "en",
      isApproved: true,
      dateOfBirth: new Date("1987-02-28T00:00:00Z"),
      gender: "female",
      doctor: {
        create: {
          departmentId: dermatology.id,
          licenseId: "LC-10005",
          availabilitySchedule: "Mon-Thu 12:00-18:00",
          approvalStatus: "approved",
          degrees: "MBBS, DDVL (Dermatology)",
          approvalDocumentPath: null,
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: "doctor6@smarthealth.com" },
    update: {
      name: "Dr. Frank General",
      phone: "9000000006",
      languagePreference: "en",
      isApproved: true,
      dateOfBirth: new Date("1978-06-12T00:00:00Z"),
      gender: "male",
      doctor: {
        upsert: {
          update: {
            departmentId: generalMedicine.id,
            licenseId: "LC-10006",
            availabilitySchedule: "Mon-Fri 08:00-14:00",
            approvalStatus: "approved",
            degrees: "MBBS, MD (General Medicine)",
            approvalDocumentPath: null,
          },
          create: {
            departmentId: generalMedicine.id,
            licenseId: "LC-10006",
            availabilitySchedule: "Mon-Fri 08:00-14:00",
            approvalStatus: "approved",
            degrees: "MBBS, MD (General Medicine)",
            approvalDocumentPath: null,
          },
        },
      },
    },
    create: {
      name: "Dr. Frank General",
      email: "doctor6@smarthealth.com",
      phone: "9000000006",
      passwordHash: doctorPassword,
      role: "doctor",
      languagePreference: "en",
      isApproved: true,
      dateOfBirth: new Date("1978-06-12T00:00:00Z"),
      gender: "male",
      doctor: {
        create: {
          departmentId: generalMedicine.id,
          licenseId: "LC-10006",
          availabilitySchedule: "Mon-Fri 08:00-14:00",
          approvalStatus: "approved",
          degrees: "MBBS, MD (General Medicine)",
          approvalDocumentPath: null,
        },
      },
    },
  });

  const doctor7User = await prisma.user.upsert({
    where: { email: "doctor7@smarthealth.com" },
    update: {
      name: "Dr. Grace Ward",
      phone: "9000000007",
      languagePreference: "en",
      isApproved: true,
      doctor: {
        upsert: {
          update: {
            departmentId: cardiology.id,
            licenseId: "LC-10007",
            availabilitySchedule: "Mon, Wed, Fri 10:00-16:00",
            approvalStatus: "approved",
            degrees: "MBBS, MD (Cardiology)",
            approvalDocumentPath: null,
          },
          create: {
            departmentId: cardiology.id,
            licenseId: "LC-10007",
            availabilitySchedule: "Mon, Wed, Fri 10:00-16:00",
            approvalStatus: "approved",
            degrees: "MBBS, MD (Cardiology)",
            approvalDocumentPath: null,
          },
        },
      },
    },
    create: {
      name: "Dr. Grace Ward",
      email: "doctor7@smarthealth.com",
      phone: "9000000007",
      passwordHash: doctorPassword,
      role: "doctor",
      languagePreference: "en",
      isApproved: true,
      doctor: {
        create: {
          departmentId: cardiology.id,
          licenseId: "LC-10007",
          availabilitySchedule: "Mon, Wed, Fri 10:00-16:00",
          approvalStatus: "approved",
          degrees: "MBBS, MD (Cardiology)",
          approvalDocumentPath: null,
        },
      },
    },
    include: {
      doctor: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "doctor8@smarthealth.com" },
    update: {
      name: "Dr. Henry Kids",
      phone: "9000000008",
      languagePreference: "en",
      isApproved: true,
      doctor: {
        upsert: {
          update: {
            departmentId: pediatrics.id,
            licenseId: "LC-10008",
            availabilitySchedule: "Mon-Fri 13:00-19:00",
            approvalStatus: "approved",
            degrees: "MBBS, MD (Pediatrics)",
            approvalDocumentPath: null,
          },
          create: {
            departmentId: pediatrics.id,
            licenseId: "LC-10008",
            availabilitySchedule: "Mon-Fri 13:00-19:00",
            approvalStatus: "approved",
            degrees: "MBBS, MD (Pediatrics)",
            approvalDocumentPath: null,
          },
        },
      },
    },
    create: {
      name: "Dr. Henry Kids",
      email: "doctor8@smarthealth.com",
      phone: "9000000008",
      passwordHash: doctorPassword,
      role: "doctor",
      languagePreference: "en",
      isApproved: true,
      doctor: {
        create: {
          departmentId: pediatrics.id,
          licenseId: "LC-10008",
          availabilitySchedule: "Mon-Fri 13:00-19:00",
          approvalStatus: "approved",
          degrees: "MBBS, MD (Pediatrics)",
          approvalDocumentPath: null,
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: "doctor9@smarthealth.com" },
    update: {
      name: "Dr. Ivy Spine",
      phone: "9000000009",
      languagePreference: "en",
      isApproved: true,
      dateOfBirth: new Date("1984-10-09T00:00:00Z"),
      gender: "female",
      doctor: {
        upsert: {
          update: {
            departmentId: orthopedics.id,
            licenseId: "LC-10009",
            availabilitySchedule: "Mon-Fri 16:00-20:00",
            approvalStatus: "approved",
            degrees: "MBBS, MS (Spine Surgery)",
            approvalDocumentPath: null,
          },
          create: {
            departmentId: orthopedics.id,
            licenseId: "LC-10009",
            availabilitySchedule: "Mon-Fri 16:00-20:00",
            approvalStatus: "approved",
            degrees: "MBBS, MS (Spine Surgery)",
            approvalDocumentPath: null,
          },
        },
      },
    },
    create: {
      name: "Dr. Ivy Spine",
      email: "doctor9@smarthealth.com",
      phone: "9000000009",
      passwordHash: doctorPassword,
      role: "doctor",
      languagePreference: "en",
      isApproved: true,
      dateOfBirth: new Date("1984-10-09T00:00:00Z"),
      gender: "female",
      doctor: {
        create: {
          departmentId: orthopedics.id,
          licenseId: "LC-10009",
          availabilitySchedule: "Mon-Fri 16:00-20:00",
          approvalStatus: "approved",
          degrees: "MBBS, MS (Spine Surgery)",
          approvalDocumentPath: null,
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: "doctor10@smarthealth.com" },
    update: {
      name: "Dr. Jack Allergy",
      phone: "9000000010",
      languagePreference: "en",
      isApproved: true,
      dateOfBirth: new Date("1976-12-01T00:00:00Z"),
      gender: "male",
      doctor: {
        upsert: {
          update: {
            departmentId: generalMedicine.id,
            licenseId: "LC-10010",
            availabilitySchedule: "Sat-Sun 10:00-16:00",
            approvalStatus: "approved",
            degrees: "MBBS, MD (Internal Medicine)",
            approvalDocumentPath: null,
          },
          create: {
            departmentId: generalMedicine.id,
            licenseId: "LC-10010",
            availabilitySchedule: "Sat-Sun 10:00-16:00",
            approvalStatus: "approved",
            degrees: "MBBS, MD (Internal Medicine)",
            approvalDocumentPath: null,
          },
        },
      },
    },
    create: {
      name: "Dr. Jack Allergy",
      email: "doctor10@smarthealth.com",
      phone: "9000000010",
      passwordHash: doctorPassword,
      role: "doctor",
      languagePreference: "en",
      isApproved: true,
      dateOfBirth: new Date("1976-12-01T00:00:00Z"),
      gender: "male",
      doctor: {
        create: {
          departmentId: generalMedicine.id,
          licenseId: "LC-10010",
          availabilitySchedule: "Sat-Sun 10:00-16:00",
          approvalStatus: "approved",
          degrees: "MBBS, MD (Internal Medicine)",
          approvalDocumentPath: null,
        },
      },
    },
  });

  const departments = [
    cardiology,
    pediatrics,
    neurology,
    orthopedics,
    dermatology,
    generalMedicine,
  ];

  const unassignedDoctors = await prisma.doctor.findMany({
    where: {
      departmentId: null,
    },
    orderBy: {
      id: "asc",
    },
  });

  for (let i = 0; i < unassignedDoctors.length; i++) {
    const doctor = unassignedDoctors[i];
    const department = departments[i % departments.length];

    await prisma.doctor.update({
      where: { id: doctor.id },
      data: {
        departmentId: department.id,
        approvalStatus: "approved",
      },
    });
  }

  const patient1 = await prisma.user.upsert({
    where: { email: "patient1@smarthealth.com" },
    update: {
      name: "Patient One",
      phone: "8000000001",
      languagePreference: "en",
      isApproved: true,
      dateOfBirth: new Date("1990-04-20T00:00:00Z"),
      gender: "female",
    },
    create: {
      name: "Patient One",
      email: "patient1@smarthealth.com",
      phone: "8000000001",
      passwordHash: patientPassword,
      role: "patient",
      languagePreference: "en",
      isApproved: true,
      dateOfBirth: new Date("1990-04-20T00:00:00Z"),
      gender: "female",
    },
  });

  const patient2 = await prisma.user.upsert({
    where: { email: "patient2@smarthealth.com" },
    update: {
      name: "Patient Two",
      phone: "8000000002",
      languagePreference: "en",
      isApproved: true,
      dateOfBirth: new Date("1988-09-15T00:00:00Z"),
      gender: "male",
    },
    create: {
      name: "Patient Two",
      email: "patient2@smarthealth.com",
      phone: "8000000002",
      passwordHash: patientPassword,
      role: "patient",
      languagePreference: "en",
      isApproved: true,
      dateOfBirth: new Date("1988-09-15T00:00:00Z"),
      gender: "male",
    },
  });

  const patient3 = await prisma.user.upsert({
    where: { email: "patient3@smarthealth.com" },
    update: {
      name: "Patient Three",
      phone: "8000000003",
      languagePreference: "en",
      isApproved: true,
      dateOfBirth: new Date("1995-01-08T00:00:00Z"),
      gender: "female",
    },
    create: {
      name: "Patient Three",
      email: "patient3@smarthealth.com",
      phone: "8000000003",
      passwordHash: patientPassword,
      role: "patient",
      languagePreference: "en",
      isApproved: true,
      dateOfBirth: new Date("1995-01-08T00:00:00Z"),
      gender: "female",
    },
  });

  const patient4 = await prisma.user.upsert({
    where: { email: "patient4@smarthealth.com" },
    update: {
      name: "Patient Four",
      phone: "8000000004",
      languagePreference: "en",
      isApproved: true,
      dateOfBirth: new Date("1970-11-30T00:00:00Z"),
      gender: "male",
    },
    create: {
      name: "Patient Four",
      email: "patient4@smarthealth.com",
      phone: "8000000004",
      passwordHash: patientPassword,
      role: "patient",
      languagePreference: "en",
      isApproved: true,
      dateOfBirth: new Date("1970-11-30T00:00:00Z"),
      gender: "male",
    },
  });

  const patient5 = await prisma.user.upsert({
    where: { email: "patient5@smarthealth.com" },
    update: {
      name: "Patient Five",
      phone: "8000000005",
      languagePreference: "en",
      isApproved: true,
      dateOfBirth: new Date("2000-05-05T00:00:00Z"),
      gender: "other",
    },
    create: {
      name: "Patient Five",
      email: "patient5@smarthealth.com",
      phone: "8000000005",
      passwordHash: patientPassword,
      role: "patient",
      languagePreference: "en",
      isApproved: true,
      dateOfBirth: new Date("2000-05-05T00:00:00Z"),
      gender: "other",
    },
  });

  const doctor7Id = doctor7User.doctor?.id;

  if (doctor7Id) {
    await prisma.appointment.deleteMany({
      where: { doctorId: doctor7Id },
    });

    const now = new Date();

    const todayMorning = new Date(now);
    todayMorning.setHours(9, 0, 0, 0);

    const todayLateMorning = new Date(now);
    todayLateMorning.setHours(11, 0, 0, 0);

    const todayAfternoon = new Date(now);
    todayAfternoon.setHours(14, 0, 0, 0);

    const tomorrowMorning = new Date(now);
    tomorrowMorning.setDate(now.getDate() + 1);
    tomorrowMorning.setHours(10, 0, 0, 0);

    const yesterdayMorning = new Date(now);
    yesterdayMorning.setDate(now.getDate() - 1);
    yesterdayMorning.setHours(9, 30, 0, 0);

    await prisma.appointment.createMany({
      data: [
        {
          patientId: patient1.id,
          doctorId: doctor7Id,
          date: todayMorning,
          timeSlot: "09:00 AM",
          status: "booked",
          queueNumber: 1,
          isEmergency: false,
          reasonForVisit: "Routine check-up and blood pressure review",
        },
        {
          patientId: patient2.id,
          doctorId: doctor7Id,
          date: todayLateMorning,
          timeSlot: "11:00 AM",
          status: "completed",
          queueNumber: 2,
          isEmergency: false,
          reasonForVisit: "Follow-up visit for ECG results",
        },
        {
          patientId: patient3.id,
          doctorId: doctor7Id,
          date: todayAfternoon,
          timeSlot: "02:00 PM",
          status: "cancelled",
          queueNumber: 3,
          isEmergency: false,
          reasonForVisit: "Chest discomfort consultation (cancelled by patient)",
        },
        {
          patientId: patient4.id,
          doctorId: doctor7Id,
          date: tomorrowMorning,
          timeSlot: "10:00 AM",
          status: "booked",
          queueNumber: 4,
          isEmergency: true,
          reasonForVisit: "Acute chest pain, high priority emergency",
        },
        {
          patientId: patient5.id,
          doctorId: doctor7Id,
          date: yesterdayMorning,
          timeSlot: "09:30 AM",
          status: "completed",
          queueNumber: 5,
          isEmergency: false,
          reasonForVisit: "Post-ECG review and medication adjustment",
        },
      ],
    });

    const verifiedDoctor7 = await prisma.user.findUnique({
      where: { email: "doctor7@smarthealth.com" },
      include: {
        doctor: {
          include: {
            appointments: true,
          },
        },
      },
    });

    console.log(
      JSON.stringify(
        {
          seedVerification: {
            doctor7Exists: !!verifiedDoctor7,
            doctor7UserId: verifiedDoctor7?.id,
            doctor7ProfileId: verifiedDoctor7?.doctor?.id,
            appointmentCount: verifiedDoctor7?.doctor?.appointments.length ?? 0,
            appointmentStatuses:
              verifiedDoctor7?.doctor?.appointments.map((a) => a.status) ?? [],
          },
        },
        null,
        2,
      ),
    );
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
