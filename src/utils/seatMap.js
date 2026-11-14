function rowLabel(index) {
  let label = "";
  let value = index + 1;
  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }
  return label;
}

export function createSeatIds(totalSeats, seatsPerRow = 10) {
  return Array.from({ length: totalSeats }, (_, index) => (
    `${rowLabel(Math.floor(index / seatsPerRow))}${(index % seatsPerRow) + 1}`
  ));
}
