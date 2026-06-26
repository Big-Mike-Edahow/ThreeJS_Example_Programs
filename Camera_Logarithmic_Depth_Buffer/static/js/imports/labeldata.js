// labeldata.js

// Generate a number of text labels, from 1µm in size up to 100,000,000 light years
// Try to use some descriptive real-world examples of objects at each scale

export const labeldata = [
  { size: 0.01, scale: 0.0001, label: "microscopic (1µm)" }, // FIXME - triangulating text fails at this size, so we scale instead
  { size: 0.01, scale: 0.1, label: "minuscule (1mm)" },
  { size: 0.01, scale: 1.0, label: "tiny (1cm)" },
  { size: 1, scale: 1.0, label: "child-sized (1m)" },
  { size: 10, scale: 1.0, label: "tree-sized (10m)" },
  { size: 100, scale: 1.0, label: "building-sized (100m)" },
  { size: 1000, scale: 1.0, label: "medium (1km)" },
  { size: 10000, scale: 1.0, label: "city-sized (10km)" },
  { size: 3400000, scale: 1.0, label: "moon-sized (3,400 Km)" },
  { size: 12000000, scale: 1.0, label: "planet-sized (12,000 km)" },
  { size: 1400000000, scale: 1.0, label: "sun-sized (1,400,000 km)" },
  { size: 7.47e12, scale: 1.0, label: "solar system-sized (50Au)" },
  { size: 9.4605284e15, scale: 1.0, label: "gargantuan (1 light year)" },
  { size: 3.08567758e16, scale: 1.0, label: "ludicrous (1 parsec)" },
  { size: 1e19, scale: 1.0, label: "mind boggling (1000 light years)" },
];
