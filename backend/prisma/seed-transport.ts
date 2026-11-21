// ---------------------------------------------------------------
// Smart Transportation — Cairo Metro & Bus Transport Seed Script
// ---------------------------------------------------------------
// NOTE: This dataset is sample data for demonstration and testing purposes,
// not official transport authority data.
//
// Idempotent: uses upserts to ensure repeated runs do not duplicate records.
// Interchanges (verified against official Cairo Metro map):
//   - Sadat (Line 1 + Line 2)
//   - Al-Shohadaa (Line 1 + Line 2)
//   - Attaba (Line 2 + Line 3)
//   - Nasser (Line 1 + Line 3)
//   - Cairo University (Line 2 + Line 3 — Cairo University Branch)
// Notes:
//   - "Rod El-Farag" (Line 2) and "Rod El-Farag Corridor" (Line 3) are two
//     completely separate stations (NOT an interchange).
//   - Kit Kat is Line 3's western branching hub, splitting into:
//       1. Rod El-Farag Corridor Branch (Sudan -> Rod El-Farag Corridor)
//       2. Cairo University Branch (Tawfikia -> Cairo University)
// ---------------------------------------------------------------

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface StationData {
  nameEn: string;
  lat: number;
  lng: number;
  branch?: string | null;
}

interface BusStopData {
  nameEn: string;
  lat: number;
  lng: number;
}

// ------------------------------------------------------------------
// Cairo Metro Data
// ------------------------------------------------------------------

// Line 1: Helwan -> New El-Marg (35 stations)
const line1Stations: StationData[] = [
  { nameEn: 'Helwan', lat: 29.8490, lng: 31.3340 },
  { nameEn: 'Ain Helwan', lat: 29.8620, lng: 31.3280 },
  { nameEn: 'Helwan University', lat: 29.8690, lng: 31.3200 },
  { nameEn: 'Wadi Hof', lat: 29.8800, lng: 31.3130 },
  { nameEn: 'Hadayek Helwan', lat: 29.8970, lng: 31.3050 },
  { nameEn: 'El-Maasara', lat: 29.9070, lng: 31.3000 },
  { nameEn: 'Tora El-Asmant', lat: 29.9280, lng: 31.2890 },
  { nameEn: 'Kozzika', lat: 29.9360, lng: 31.2850 },
  { nameEn: 'Tora El-Balad', lat: 29.9480, lng: 31.2780 },
  { nameEn: 'Sakanat El-Maadi', lat: 29.9530, lng: 31.2630 },
  { nameEn: 'Maadi', lat: 29.9580, lng: 31.2580 },
  { nameEn: 'Hadayek El-Maadi', lat: 29.9710, lng: 31.2510 },
  { nameEn: 'Dar El-Salam', lat: 29.9870, lng: 31.2420 },
  { nameEn: 'El-Zahraa', lat: 30.0050, lng: 31.2310 },
  { nameEn: 'Mar Girgis', lat: 30.0065, lng: 31.2300 },
  { nameEn: 'El-Malek El-Saleh', lat: 30.0175, lng: 31.2315 },
  { nameEn: 'Al-Sayeda Zeinab', lat: 30.0298, lng: 31.2360 },
  { nameEn: 'Saad Zaghloul', lat: 30.0366, lng: 31.2378 },
  { nameEn: 'Sadat', lat: 30.0444, lng: 31.2357 }, // Interchange L1 + L2
  { nameEn: 'Nasser', lat: 30.0531, lng: 31.2396 }, // Interchange L1 + L3
  { nameEn: 'Orabi', lat: 30.0570, lng: 31.2425 },
  { nameEn: 'Al-Shohadaa', lat: 30.0614, lng: 31.2464 }, // Interchange L1 + L2
  { nameEn: 'Ghamra', lat: 30.0688, lng: 31.2655 },
  { nameEn: 'El-Demerdash', lat: 30.0772, lng: 31.2778 },
  { nameEn: 'Manshiet El-Sadr', lat: 30.0825, lng: 31.2862 },
  { nameEn: 'Kobri El-Qobba', lat: 30.0871, lng: 31.2934 },
  { nameEn: 'Hammamat El-Qobba', lat: 30.0907, lng: 31.3023 },
  { nameEn: 'Saray El-Qobba', lat: 30.0988, lng: 31.3117 },
  { nameEn: 'Hadayek El-Zaitoun', lat: 30.1062, lng: 31.3168 },
  { nameEn: 'Helmeyat El-Zaitoun', lat: 30.1147, lng: 31.3151 },
  { nameEn: 'Matareya', lat: 30.1213, lng: 31.3130 },
  { nameEn: 'Ain Shams', lat: 30.1310, lng: 31.3195 },
  { nameEn: 'Ezbet El-Nakhl', lat: 30.1396, lng: 31.3248 },
  { nameEn: 'El-Marg', lat: 30.1521, lng: 31.3354 },
  { nameEn: 'New El-Marg', lat: 30.1633, lng: 31.3387 },
];

// Line 2: Shubra El-Kheima -> El-Mounib (20 stations)
const line2Stations: StationData[] = [
  { nameEn: 'Shubra El-Kheima', lat: 30.1226, lng: 31.2444 },
  { nameEn: 'Kolleyyet El-Zeraa', lat: 30.1141, lng: 31.2497 },
  { nameEn: 'El-Mazallat', lat: 30.1065, lng: 31.2476 },
  { nameEn: 'El-Khalafawy', lat: 30.1002, lng: 31.2458 },
  { nameEn: 'St. Teresa', lat: 30.0898, lng: 31.2451 },
  { nameEn: 'Rod El-Farag', lat: 30.0809, lng: 31.2456 }, // Line 2 only (distinct from L3 Rod El-Farag Corridor)
  { nameEn: 'Massara', lat: 30.0711, lng: 31.2459 },
  { nameEn: 'Al-Shohadaa', lat: 30.0614, lng: 31.2464 }, // Interchange L1 + L2
  { nameEn: 'Attaba', lat: 30.0525, lng: 31.2471 }, // Interchange L2 + L3
  { nameEn: 'Mohamed Naguib', lat: 30.0456, lng: 31.2440 },
  { nameEn: 'Sadat', lat: 30.0444, lng: 31.2357 }, // Interchange L1 + L2
  { nameEn: 'Opera', lat: 30.0421, lng: 31.2255 },
  { nameEn: 'Dokki', lat: 30.0384, lng: 31.2119 },
  { nameEn: 'El-Bohoth', lat: 30.0359, lng: 31.2001 },
  { nameEn: 'Cairo University', lat: 30.0263, lng: 31.2008 },
  { nameEn: 'Faisal', lat: 30.0173, lng: 31.2040 },
  { nameEn: 'Giza', lat: 30.0106, lng: 31.2069 },
  { nameEn: 'Omm El-Masryeen', lat: 30.0052, lng: 31.2084 },
  { nameEn: 'Sakiat Mekki', lat: 29.9961, lng: 31.2090 },
  { nameEn: 'El-Mounib', lat: 29.9813, lng: 31.2053 },
];

// Line 3: Adly Mansour -> Kit Kat -> Rod El-Farag Branch & Cairo University Branch (34 stations)
const line3Stations: StationData[] = [
  // Main trunk (Adly Mansour -> Kit Kat, orders 1..23)
  { nameEn: 'Adly Mansour', lat: 30.1472, lng: 31.4206 },
  { nameEn: 'El-Haykestep', lat: 30.1432, lng: 31.3995 },
  { nameEn: 'Omar Ibn El-Khattab', lat: 30.1387, lng: 31.3855 },
  { nameEn: 'Qobaa', lat: 30.1302, lng: 31.3712 },
  { nameEn: 'Hesham Barakat', lat: 30.1256, lng: 31.3601 },
  { nameEn: 'El-Nozha', lat: 30.1170, lng: 31.3488 },
  { nameEn: 'El-Shams Club', lat: 30.1105, lng: 31.3411 },
  { nameEn: 'Alf Maskan', lat: 30.1189, lng: 31.3375 },
  { nameEn: 'Heliopolis', lat: 30.1082, lng: 31.3283 },
  { nameEn: 'Haroun', lat: 30.1011, lng: 31.3262 },
  { nameEn: 'Al-Ahram', lat: 30.0917, lng: 31.3268 },
  { nameEn: 'Koleyet El-Banat', lat: 30.0841, lng: 31.3298 },
  { nameEn: 'Stadium', lat: 30.0734, lng: 31.3204 },
  { nameEn: 'Fair Zone', lat: 30.0739, lng: 31.3008 },
  { nameEn: 'Abbassiya', lat: 30.0682, lng: 31.2829 },
  { nameEn: 'Abdou Pasha', lat: 30.0648, lng: 31.2741 },
  { nameEn: 'El-Geish', lat: 30.0617, lng: 31.2668 },
  { nameEn: 'Bab El-Shaariya', lat: 30.0543, lng: 31.2568 },
  { nameEn: 'Attaba', lat: 30.0525, lng: 31.2471 }, // Interchange L2 + L3
  { nameEn: 'Nasser', lat: 30.0531, lng: 31.2396 }, // Interchange L1 + L3
  { nameEn: 'Maspero', lat: 30.0558, lng: 31.2325 },
  { nameEn: 'Safaa Hegazy', lat: 30.0615, lng: 31.2212 },
  { nameEn: 'Kit Kat', lat: 30.0635, lng: 31.2132 }, // Line 3 branching hub

  // North-West Branch from Kit Kat -> Rod El-Farag Corridor (orders 24..29)
  { nameEn: 'Sudan', lat: 30.0691, lng: 31.2062, branch: 'Rod El-Farag Corridor Branch' },
  { nameEn: 'Imbaba', lat: 30.0760, lng: 31.2052, branch: 'Rod El-Farag Corridor Branch' },
  { nameEn: 'El-Bohi', lat: 30.0825, lng: 31.2078, branch: 'Rod El-Farag Corridor Branch' },
  { nameEn: 'El-Qawmia', lat: 30.0910, lng: 31.2091, branch: 'Rod El-Farag Corridor Branch' },
  { nameEn: 'Ring Road', lat: 30.0988, lng: 31.2098, branch: 'Rod El-Farag Corridor Branch' },
  { nameEn: 'Rod El-Farag Corridor', lat: 30.1015, lng: 31.1846, branch: 'Rod El-Farag Corridor Branch' }, // Line 3 terminus only (distinct from L2 Rod El-Farag)

  // South Branch from Kit Kat -> Cairo University (orders 30..34)
  { nameEn: 'Tawfikia', lat: 30.0652, lng: 31.2025, branch: 'Cairo University Branch' },
  { nameEn: 'Wadi El-Nile', lat: 30.0583, lng: 31.2011, branch: 'Cairo University Branch' },
  { nameEn: 'Gamaat El-Dowal', lat: 30.0508, lng: 31.1997, branch: 'Cairo University Branch' },
  { nameEn: 'Boulak El-Dakrour', lat: 30.0361, lng: 31.1965, branch: 'Cairo University Branch' },
  { nameEn: 'Cairo University', lat: 30.0263, lng: 31.2008, branch: 'Cairo University Branch' }, // Interchange L2 + L3
];

// ------------------------------------------------------------------
// Bus Routes Data (5 sample routes)
// ------------------------------------------------------------------

interface BusRouteData {
  code: string;
  nameEn: string;
  stops: BusStopData[];
}

const busRoutes: BusRouteData[] = [
  {
    code: 'BUS-101',
    nameEn: 'Tahrir - Nasr City - New Cairo',
    stops: [
      { nameEn: 'Abdel Moneim Riad Terminal', lat: 30.0485, lng: 31.2335 },
      { nameEn: 'Tahrir Square Stop', lat: 30.0444, lng: 31.2357 },
      { nameEn: 'Ramses Railway Stop', lat: 30.0630, lng: 31.2485 },
      { nameEn: 'Abbassiya Square Stop', lat: 30.0682, lng: 31.2829 },
      { nameEn: 'Cairo Stadium West', lat: 30.0715, lng: 31.3150 },
      { nameEn: 'Abbas El-Akkad', lat: 30.0570, lng: 31.3415 },
      { nameEn: 'Makram Ebeid Intersection', lat: 30.0535, lng: 31.3480 },
      { nameEn: 'New Cairo AUC Terminal', lat: 30.0195, lng: 31.4990 },
    ],
  },
  {
    code: 'BUS-102',
    nameEn: 'Giza Square - Dokki - Heliopolis',
    stops: [
      { nameEn: 'Giza Square Bus Stand', lat: 30.0106, lng: 31.2069 },
      { nameEn: 'Cairo University Gate', lat: 30.0260, lng: 31.2090 },
      { nameEn: 'Dokki Square Stop', lat: 30.0384, lng: 31.2119 },
      { nameEn: 'Cairo Opera Stop', lat: 30.0421, lng: 31.2255 },
      { nameEn: 'Ramses Station North', lat: 30.0614, lng: 31.2464 },
      { nameEn: 'Roxy Heliopolis', lat: 30.0930, lng: 31.3175 },
      { nameEn: 'El-Korba Heritage Stop', lat: 30.0905, lng: 31.3250 },
      { nameEn: 'Triumph Square Terminal', lat: 30.0965, lng: 31.3380 },
    ],
  },
  {
    code: 'BUS-103',
    nameEn: 'Maadi Grand Mall - Sayeda Zeinab - Ramses',
    stops: [
      { nameEn: 'Degla Maadi Hub', lat: 29.9620, lng: 31.2790 },
      { nameEn: 'Maadi Grand Mall Terminal', lat: 29.9695, lng: 31.2820 },
      { nameEn: 'Zahraa El-Maadi Stop', lat: 29.9740, lng: 31.2910 },
      { nameEn: 'Dar El-Salam Bridge', lat: 29.9870, lng: 31.2420 },
      { nameEn: 'Al-Sayeda Zeinab Mosque', lat: 30.0298, lng: 31.2360 },
      { nameEn: 'Lazoghly Square', lat: 30.0410, lng: 31.2390 },
      { nameEn: 'Tahrir Mugamma Stop', lat: 30.0435, lng: 31.2345 },
      { nameEn: 'Ramses Interchange Stop', lat: 30.0620, lng: 31.2470 },
    ],
  },
  {
    code: 'BUS-104',
    nameEn: 'Shubra - Zamalek - Mohandessin',
    stops: [
      { nameEn: 'Shubra El-Kheima Terminal', lat: 30.1226, lng: 31.2444 },
      { nameEn: 'Rod El-Farag Central', lat: 30.0809, lng: 31.2456 },
      { nameEn: 'Kit Kat Square Bus Stop', lat: 30.0635, lng: 31.2132 },
      { nameEn: 'Zamalek 26th July', lat: 30.0600, lng: 31.2200 },
      { nameEn: 'Sphinx Square Mohandessin', lat: 30.0575, lng: 31.2055 },
      { nameEn: 'Lebanon Square Terminal', lat: 30.0540, lng: 31.1980 },
      { nameEn: 'Mustafa Mahmoud Square', lat: 30.0480, lng: 31.2010 },
    ],
  },
  {
    code: 'BUS-105',
    nameEn: 'Ring Road Express (Helwan - Maadi - 5th Settlement)',
    stops: [
      { nameEn: 'Helwan Metro Bus Terminal', lat: 29.8490, lng: 31.3340 },
      { nameEn: 'Wadi Hof Bridge Stop', lat: 29.8800, lng: 31.3130 },
      { nameEn: 'Autostrad Maadi Stop', lat: 29.9710, lng: 31.2850 },
      { nameEn: 'Carrefour Maadi Interchange', lat: 29.9850, lng: 31.3050 },
      { nameEn: 'Ring Road New Maadi', lat: 29.9980, lng: 31.3250 },
      { nameEn: 'Police Academy Junction', lat: 30.0270, lng: 31.4420 },
      { nameEn: 'Downtown Katameya Mall', lat: 30.0150, lng: 31.4280 },
      { nameEn: '90th Street North Terminal', lat: 30.0250, lng: 31.4850 },
    ],
  },
];

async function main(): Promise<void> {
  // 0. Remove erroneous link between Line 3 and Line 2's "Rod El-Farag" if present
  const line3Existing = await prisma.metroLine.findUnique({ where: { number: 3 } });
  const line2RodElFarag = await prisma.station.findUnique({ where: { nameEn: 'Rod El-Farag' } });
  if (line3Existing && line2RodElFarag) {
    await prisma.metroLineStation.deleteMany({
      where: {
        lineId: line3Existing.id,
        stationId: line2RodElFarag.id,
      },
    });
  }

  // 1. Seed Metro Lines
  const metroLinesConfig = [
    { number: 1, nameEn: 'Line 1 (Helwan - New El-Marg)', color: '#1565C0', stations: line1Stations },
    { number: 2, nameEn: 'Line 2 (Shubra El-Kheima - El-Mounib)', color: '#D32F2F', stations: line2Stations },
    { number: 3, nameEn: 'Line 3 (Adly Mansour - Rod El-Farag Corridor / Cairo University)', color: '#2E7D32', stations: line3Stations },
  ];

  for (const lineConfig of metroLinesConfig) {
    const line = await prisma.metroLine.upsert({
      where: { number: lineConfig.number },
      create: {
        number: lineConfig.number,
        nameEn: lineConfig.nameEn,
        color: lineConfig.color,
      },
      update: {
        nameEn: lineConfig.nameEn,
        color: lineConfig.color,
      },
    });

    for (let i = 0; i < lineConfig.stations.length; i++) {
      const s = lineConfig.stations[i];
      const order = i + 1;

      // Upsert station by nameEn (shared interchange stations will be updated/reused)
      const station = await prisma.station.upsert({
        where: { nameEn: s.nameEn },
        create: {
          nameEn: s.nameEn,
          lat: s.lat,
          lng: s.lng,
        },
        update: {
          lat: s.lat,
          lng: s.lng,
        },
      });

      // Upsert MetroLineStation link
      await prisma.metroLineStation.upsert({
        where: {
          lineId_stationId: {
            lineId: line.id,
            stationId: station.id,
          },
        },
        create: {
          lineId: line.id,
          stationId: station.id,
          order,
          branch: s.branch ?? null,
        },
        update: {
          order,
          branch: s.branch ?? null,
        },
      });
    }
  }

  // 2. Seed Bus Routes and Stops
  for (const routeConfig of busRoutes) {
    const route = await prisma.busRoute.upsert({
      where: { code: routeConfig.code },
      create: {
        code: routeConfig.code,
        nameEn: routeConfig.nameEn,
      },
      update: {
        nameEn: routeConfig.nameEn,
      },
    });

    for (let i = 0; i < routeConfig.stops.length; i++) {
      const stopData = routeConfig.stops[i];
      const order = i + 1;

      // Find or create BusStop
      let busStop = await prisma.busStop.findFirst({
        where: { nameEn: stopData.nameEn },
      });

      if (!busStop) {
        busStop = await prisma.busStop.create({
          data: {
            nameEn: stopData.nameEn,
            lat: stopData.lat,
            lng: stopData.lng,
          },
        });
      } else {
        busStop = await prisma.busStop.update({
          where: { id: busStop.id },
          data: {
            lat: stopData.lat,
            lng: stopData.lng,
          },
        });
      }

      // Upsert BusRouteStop
      await prisma.busRouteStop.upsert({
        where: {
          routeId_stopId: {
            routeId: route.id,
            stopId: busStop.id,
          },
        },
        create: {
          routeId: route.id,
          stopId: busStop.id,
          order,
        },
        update: {
          order,
        },
      });
    }
  }

  // 3. Clean up any orphan stations not linked to any metro line
  const orphanResult = await prisma.station.deleteMany({
    where: {
      lineStations: {
        none: {},
      },
    },
  });
  if (orphanResult.count > 0) {
    console.log(`Cleaned up ${orphanResult.count} orphan station row(s).`);
  }

  // Row counts reporting
  const metroLinesCount = await prisma.metroLine.count();
  const stationsCount = await prisma.station.count();
  const metroLineStationsCount = await prisma.metroLineStation.count();
  const busRoutesCount = await prisma.busRoute.count();
  const busStopsCount = await prisma.busStop.count();
  const busRouteStopsCount = await prisma.busRouteStop.count();

  console.log('Seed summary (row counts):');
  console.log(`- MetroLine: ${metroLinesCount}`);
  console.log(`- Station: ${stationsCount}`);
  console.log(`- MetroLineStation: ${metroLineStationsCount}`);
  console.log(`- BusRoute: ${busRoutesCount}`);
  console.log(`- BusStop: ${busStopsCount}`);
  console.log(`- BusRouteStop: ${busRouteStopsCount}`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
