import {
  pool,
  insertFarm,
  insertShed,
  insertBatch,
  insertMortality,
  insertFeed,
  insertWeight,
  insertCost,
  insertVaccination,
  insertAlert,
  insertSale,
  type Batch,
} from "@murgi-mitra/db";

async function clearAll() {
  await pool.query(
    "TRUNCATE TABLE alert_logs, sale_records, vaccination_logs, cost_entries, weight_logs, feed_logs, mortality_logs, batches, sheds, farms RESTART IDENTITY CASCADE",
  );
}

function daysAgo(n: number, hour = 7): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function seed() {
  console.log("Clearing existing data...");
  await clearAll();

  console.log("Seeding farms...");
  const farmTN = await insertFarm({
    name: "Selvam Poultry Farm",
    state: "Tamil Nadu",
    district: "Namakkal",
    village: "Pallipalayam",
    ownerName: "R. Selvam",
    latitude: 11.21,
    longitude: 77.74,
  });

  const farmTS = await insertFarm({
    name: "Sri Venkateshwara Broilers",
    state: "Telangana",
    district: "Ranga Reddy",
    village: "Shankarpalli",
    ownerName: "K. Venkat Rao",
    latitude: 17.34,
    longitude: 78.21,
  });

  const farmPB = await insertFarm({
    name: "Sandhu Mukti Farms",
    state: "Punjab",
    district: "Barnala",
    village: "Tapa",
    ownerName: "Gurmeet Singh Sandhu",
    latitude: 30.37,
    longitude: 75.55,
  });

  console.log("Seeding sheds...");
  const shedTN1 = await insertShed({ farmId: farmTN.id, name: "Shed A1", capacity: 8000, areaSqft: 8000 });
  const shedTN2 = await insertShed({ farmId: farmTN.id, name: "Shed A2", capacity: 6000, areaSqft: 6000 });
  const shedTS1 = await insertShed({ farmId: farmTS.id, name: "Shed 1", capacity: 10000, areaSqft: 10000 });
  await insertShed({ farmId: farmTS.id, name: "Shed 2", capacity: 10000, areaSqft: 10000 });
  const shedPB1 = await insertShed({ farmId: farmPB.id, name: "Block 1", capacity: 12000, areaSqft: 12000 });

  console.log("Seeding batches...");
  // Batch 1: TN, Day 28, healthy
  const batch1 = await insertBatch({
    batchCode: "B2604-NMK1",
    farmId: farmTN.id,
    shedId: shedTN1.id,
    startDate: daysAgo(28),
    targetSaleDate: daysAgo(-14),
    placementCount: 7500,
    chickSupplier: "Suguna Hatcheries",
    breed: "Cobb 500",
    contractType: "integrator",
    status: "active",
    notes: "Suguna integration batch — chicks healthy at placement",
  });

  // Batch 2: TN shed 2, Day 12, on track
  const batch2 = await insertBatch({
    batchCode: "B2604-NMK2",
    farmId: farmTN.id,
    shedId: shedTN2.id,
    startDate: daysAgo(12),
    targetSaleDate: daysAgo(-30),
    placementCount: 5800,
    chickSupplier: "Venky's Hatcheries",
    breed: "Cobb 500",
    contractType: "own",
    status: "active",
  });

  // Batch 3: TS, Day 35, slight underweight
  const batch3 = await insertBatch({
    batchCode: "B2603-RR1",
    farmId: farmTS.id,
    shedId: shedTS1.id,
    startDate: daysAgo(35),
    targetSaleDate: daysAgo(-7),
    placementCount: 9800,
    chickSupplier: "Sneha Farms",
    breed: "Cobb 500",
    contractType: "own",
    status: "active",
    notes: "Heat stress monitoring — district peaked 41C last week",
  });

  // Batch 4: PB, Day 6, just placed
  const batch4 = await insertBatch({
    batchCode: "B2604-BNL1",
    farmId: farmPB.id,
    shedId: shedPB1.id,
    startDate: daysAgo(6),
    targetSaleDate: daysAgo(-36),
    placementCount: 11500,
    chickSupplier: "IB Group",
    breed: "Cobb 500",
    contractType: "integrator",
    status: "active",
  });

  console.log("Seeding mortality...");
  async function seedMortality(batch: Batch, shedId: string, profile: "good" | "average" | "stress") {
    const start = new Date(batch.startDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const dayCount = Math.floor((today.getTime() - start.getTime()) / 86400000);
    const baseRate = profile === "good" ? 0.0006 : profile === "average" ? 0.0011 : 0.0019;
    for (let d = 0; d < dayCount; d++) {
      const dayDate = new Date(start);
      dayDate.setDate(dayDate.getDate() + d);
      const factor = d < 3 ? 2.5 : d > dayCount - 3 ? 1.4 : 1; // first-week mortality bump
      const morning = Math.max(1, Math.round(batch.placementCount * baseRate * factor * (0.55 + Math.random() * 0.4)));
      const evening = Math.max(0, Math.round(batch.placementCount * baseRate * factor * (0.35 + Math.random() * 0.3)));
      if (morning > 0) {
        const m = new Date(dayDate); m.setHours(7, 0, 0, 0);
        const cause = profile === "stress" && d > 14 ? (Math.random() > 0.5 ? "heat_stress" : "respiratory") : (Math.random() > 0.7 ? "respiratory" : "unknown");
        await insertMortality({ batchId: batch.id, shedId, date: m, shift: "morning", count: morning, cause });
      }
      if (evening > 0) {
        const e = new Date(dayDate); e.setHours(18, 0, 0, 0);
        await insertMortality({ batchId: batch.id, shedId, date: e, shift: "evening", count: evening, cause: "unknown" });
      }
    }
  }

  await seedMortality(batch1, shedTN1.id, "good");
  await seedMortality(batch2, shedTN2.id, "average");
  await seedMortality(batch3, shedTS1.id, "stress");
  await seedMortality(batch4, shedPB1.id, "good");

  console.log("Seeding feed...");
  function feedPerBirdForDay(d: number): number {
    if (d < 7) return 0.025 + d * 0.005; // pre-starter / starter
    if (d < 14) return 0.06 + (d - 7) * 0.01;
    if (d < 24) return 0.13 + (d - 14) * 0.01;
    return 0.22 + (d - 24) * 0.005;
  }
  function feedTypeForDay(d: number): string {
    if (d < 10) return "starter";
    if (d < 21) return "grower";
    return "finisher";
  }

  async function seedFeed(batch: Batch, shedId: string, currentFlock: number) {
    const start = new Date(batch.startDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const dayCount = Math.floor((today.getTime() - start.getTime()) / 86400000);
    for (let d = 0; d < dayCount; d++) {
      const dayDate = new Date(start);
      dayDate.setDate(dayDate.getDate() + d);
      const perBird = feedPerBirdForDay(d);
      const totalKg = perBird * currentFlock;
      const morning = totalKg * 0.55;
      const evening = totalKg * 0.45;
      const ftype = feedTypeForDay(d);
      const m = new Date(dayDate); m.setHours(7, 30, 0, 0);
      const e = new Date(dayDate); e.setHours(17, 30, 0, 0);
      await insertFeed({
        batchId: batch.id, shedId, date: m, shift: "morning",
        feedType: ftype, feedBrand: "Godrej Real Good", bagNumber: `B${1000 + d}`,
        kgGiven: Number((morning * 1.05).toFixed(1)),
        kgReturned: Number((morning * 0.05).toFixed(1)),
      });
      await insertFeed({
        batchId: batch.id, shedId, date: e, shift: "evening",
        feedType: ftype, feedBrand: "Godrej Real Good", bagNumber: `B${1000 + d}`,
        kgGiven: Number((evening * 1.05).toFixed(1)),
        kgReturned: Number((evening * 0.05).toFixed(1)),
      });
    }
  }

  await seedFeed(batch1, shedTN1.id, 7350);
  await seedFeed(batch2, shedTN2.id, 5740);
  await seedFeed(batch3, shedTS1.id, 9450);
  await seedFeed(batch4, shedPB1.id, 11410);

  console.log("Seeding weights...");
  const cobb: Record<number, number> = {
    7: 0.184, 14: 0.499, 21: 1.068, 28: 1.928, 35: 3.035, 42: 4.27,
  };
  async function seedWeights(batch: Batch, shedId: string, deviationPct: number) {
    const start = new Date(batch.startDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const dayCount = Math.floor((today.getTime() - start.getTime()) / 86400000);
    for (const day of [7, 14, 21, 28, 35]) {
      if (day > dayCount) break;
      const dayDate = new Date(start);
      dayDate.setDate(dayDate.getDate() + day);
      dayDate.setHours(8, 0, 0, 0);
      const sample = 50;
      const avg = cobb[day] * (1 + deviationPct / 100);
      await insertWeight({
        batchId: batch.id, shedId, date: dayDate,
        sampleSize: sample, totalWeightKg: Number((avg * sample).toFixed(2)),
        avgWeightKg: Number(avg.toFixed(3)),
      });
    }
  }
  await seedWeights(batch1, shedTN1.id, 2);     // 2% above
  await seedWeights(batch2, shedTN2.id, 0);     // on track
  await seedWeights(batch3, shedTS1.id, -6);    // 6% below (heat stress)
  await seedWeights(batch4, shedPB1.id, 1);

  console.log("Seeding costs...");
  async function seedCosts(batch: Batch) {
    const start = new Date(batch.startDate);
    const today = new Date();
    const dayCount = Math.floor((today.getTime() - start.getTime()) / 86400000);
    // Chick cost
    await insertCost({
      batchId: batch.id, category: "chick", subCategory: "Day-old chicks",
      amount: batch.placementCount * 38, quantity: batch.placementCount, unit: "birds",
      date: start, note: "Placement cost @ ₹38/bird",
    });
    // Feed costs - one entry every 3 days
    for (let d = 0; d < dayCount; d += 3) {
      const dayDate = new Date(start); dayDate.setDate(dayDate.getDate() + d);
      const perBird = (d < 7 ? 0.04 : d < 14 ? 0.085 : d < 24 ? 0.18 : 0.24);
      const kg = perBird * batch.placementCount * 3;
      const cost = kg * 38; // ₹38/kg feed
      await insertCost({
        batchId: batch.id, category: "feed", subCategory: "Compound feed",
        amount: Number(cost.toFixed(0)), quantity: kg, unit: "kg", date: dayDate,
        note: "Godrej Real Good",
      });
    }
    // Medicine
    await insertCost({
      batchId: batch.id, category: "medicine", subCategory: "Vaccines & vitamins",
      amount: batch.placementCount * 4, date: new Date(start.getTime() + 2 * 86400000),
      note: "Initial vaccination & tonics",
    });
    if (dayCount > 14) {
      await insertCost({
        batchId: batch.id, category: "medicine", subCategory: "Antibiotic course",
        amount: batch.placementCount * 2.5, date: new Date(start.getTime() + 14 * 86400000),
        note: "Preventive medication",
      });
    }
    // Labor (weekly)
    for (let w = 1; w <= Math.ceil(dayCount / 7); w++) {
      const weekDate = new Date(start); weekDate.setDate(weekDate.getDate() + w * 7);
      await insertCost({
        batchId: batch.id, category: "labor", subCategory: `Week ${w} wages`,
        amount: 4500, date: weekDate, note: "Farm worker payment",
      });
    }
    // Utilities
    await insertCost({
      batchId: batch.id, category: "utilities", subCategory: "Electricity & gas",
      amount: 8500, date: new Date(start.getTime() + 7 * 86400000),
    });
  }
  await seedCosts(batch1);
  await seedCosts(batch2);
  await seedCosts(batch3);
  await seedCosts(batch4);

  console.log("Seeding vaccinations...");
  async function seedVaccinations(batch: Batch) {
    const start = new Date(batch.startDate);
    const today = new Date();
    const dayCount = Math.floor((today.getTime() - start.getTime()) / 86400000);
    const schedule = [
      { name: "Marek's Disease", day: 1, route: "Subcutaneous" },
      { name: "Newcastle Disease (B1)", day: 5, route: "Eye drop" },
      { name: "Infectious Bronchitis (IB)", day: 7, route: "Drinking water" },
      { name: "Infectious Bursal Disease (IBD-1)", day: 12, route: "Drinking water" },
      { name: "Infectious Bursal Disease (IBD-2)", day: 18, route: "Drinking water" },
      { name: "Newcastle Disease (LaSota)", day: 21, route: "Drinking water" },
    ];
    for (const v of schedule) {
      if (v.day > dayCount) break;
      const date = new Date(start); date.setDate(date.getDate() + v.day);
      await insertVaccination({
        batchId: batch.id, vaccineName: v.name, doseDate: date,
        doseNumber: 1, cost: batch.placementCount * 0.4, route: v.route,
        administeredBy: "Dr. Suresh Kumar",
      });
    }
  }
  await seedVaccinations(batch1);
  await seedVaccinations(batch2);
  await seedVaccinations(batch3);
  await seedVaccinations(batch4);

  console.log("Seeding alerts...");
  await insertAlert({
    batchId: batch3.id, alertType: "weight_deviation", severity: "warning",
    messageEn: "Average weight is 6% below Cobb 500 standard at day 35. Heat stress likely cause.",
    messageHi: "औसत वज़न दिन 35 पर Cobb 500 मानक से 6% कम है। गर्मी का तनाव संभव कारण है।",
    recommendation: "Add electrolytes to drinking water, run foggers between 11am-4pm, increase fan capacity.",
    createdAt: daysAgo(2, 9),
  });
  await insertAlert({
    batchId: batch3.id, alertType: "mortality_spike", severity: "critical",
    messageEn: "Mortality spike: 38 birds today, double the 14-day average.",
    messageHi: "मृत्यु में उछाल: आज 38 पक्षी, 14-दिन के औसत से दोगुना।",
    recommendation: "Inspect for respiratory signs immediately. Consider postmortem on 2-3 birds. Call your vet.",
    createdAt: daysAgo(0, 11),
  });
  await insertAlert({
    batchId: batch1.id, alertType: "vaccine_due", severity: "info",
    messageEn: "IB Booster vaccine due in 2 days (Day 28).",
    messageHi: "IB बूस्टर वैक्सीन 2 दिनों में बाकी है (दिन 28)।",
    recommendation: "Prepare drinking water lines, withhold water 2 hours prior.",
    createdAt: daysAgo(1, 8),
  });
  await insertAlert({
    batchId: batch2.id, alertType: "feed_drop", severity: "info",
    messageEn: "Feed intake yesterday was 8% below the 3-day average.",
    messageHi: "कल का फ़ीड सेवन 3-दिन के औसत से 8% कम था।",
    recommendation: "Check feeder height, water availability, and shed temperature.",
    createdAt: daysAgo(0, 7),
  });

  // Sale for an older closed batch concept — add a partial sale on batch3 (early harvest)
  await insertSale({
    batchId: batch3.id,
    saleDate: daysAgo(1, 10),
    birdsSold: 800,
    totalWeightKg: 2120,
    pricePerKg: 112,
    buyer: "Hyderabad Live Bird Mandi",
  });

  console.log("Seed complete.");
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
