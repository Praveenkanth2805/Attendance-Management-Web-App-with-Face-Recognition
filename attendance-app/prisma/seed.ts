import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const classNames = ["CSE-A", "CSE-B", "IT-A", "ECE-A"];
  const classes = await Promise.all(
    classNames.map((name) =>
      prisma.class.upsert({ where: { name }, update: {}, create: { name } })
    )
  );
  console.log(`   ✓ Classes: ${classNames.join(", ")}`);

  const yearNames = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
  const years = await Promise.all(
    yearNames.map((name) =>
      prisma.year.upsert({ where: { name }, update: {}, create: { name } })
    )
  );
  console.log(`   ✓ Years: ${yearNames.join(", ")}`);

  const studentsData: {
    registerNumber: string;
    name: string;
    gender: "MALE" | "FEMALE" | "OTHER";
    classIdx: number;
    yearIdx: number;
  }[] = [
    // CSE-A · 3rd Year
    { registerNumber: "CS2021001", name: "Arun Kumar",      gender: "MALE",   classIdx: 0, yearIdx: 2 },
    { registerNumber: "CS2021002", name: "Divya Sharma",    gender: "FEMALE", classIdx: 0, yearIdx: 2 },
    { registerNumber: "CS2021003", name: "Karthik Raja",    gender: "MALE",   classIdx: 0, yearIdx: 2 },
    { registerNumber: "CS2021004", name: "Meena Lakshmi",   gender: "FEMALE", classIdx: 0, yearIdx: 2 },

    // CSE-B · 3rd Year
    { registerNumber: "CS2021011", name: "Naveen Kumar",    gender: "MALE",   classIdx: 1, yearIdx: 2 },
    { registerNumber: "CS2021012", name: "Priya Dharshini", gender: "FEMALE", classIdx: 1, yearIdx: 2 },
    { registerNumber: "CS2021013", name: "Rahul Verma",     gender: "MALE",   classIdx: 1, yearIdx: 2 },

    // IT-A · 2nd Year
    { registerNumber: "IT2022001", name: "Sanjay Balaji",   gender: "MALE",   classIdx: 2, yearIdx: 1 },
    { registerNumber: "IT2022002", name: "Sneha Reddy",     gender: "FEMALE", classIdx: 2, yearIdx: 1 },
    { registerNumber: "IT2022003", name: "Vikram Anand",    gender: "MALE",   classIdx: 2, yearIdx: 1 },

    // ECE-A · 1st Year
    { registerNumber: "EC2024001", name: "Aishwarya R",     gender: "FEMALE", classIdx: 3, yearIdx: 0 },
    { registerNumber: "EC2024002", name: "Hari Prasad",     gender: "MALE",   classIdx: 3, yearIdx: 0 },

    // CSE-A · 4th Year
    { registerNumber: "CS2020001", name: "Deepak Raj",      gender: "MALE",   classIdx: 0, yearIdx: 3 },
    { registerNumber: "CS2020002", name: "Lakshmi Narayan", gender: "FEMALE", classIdx: 0, yearIdx: 3 },
  ];

  for (const s of studentsData) {
    await prisma.student.upsert({
      where: { registerNumber: s.registerNumber },
      update: { gender: s.gender },   // ensure gender backfills if you re-seed after adding the field
      create: {
        registerNumber: s.registerNumber,
        name: s.name,
        gender: s.gender,
        classId: classes[s.classIdx].id,
        yearId: years[s.yearIdx].id,
      },
    });
  }
  console.log(`   ✓ Students: ${studentsData.length}`);

  console.log("\n✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });