// Indian States and Union Territories with Lok Sabha and Vidhan Sabha Seats
export const INDIAN_STATES_AND_UTS = [
  { name: 'Uttar Pradesh', seats: 80, vidhanSabhaSeats: 403, type: 'state' },
  { name: 'Maharashtra', seats: 48, vidhanSabhaSeats: 288, type: 'state' },
  { name: 'West Bengal', seats: 42, vidhanSabhaSeats: 294, type: 'state' },
  { name: 'Bihar', seats: 40, vidhanSabhaSeats: 243, type: 'state' },
  { name: 'Tamil Nadu', seats: 39, vidhanSabhaSeats: 234, type: 'state' },
  { name: 'Karnataka', seats: 28, vidhanSabhaSeats: 224, type: 'state' },
  { name: 'Gujarat', seats: 26, vidhanSabhaSeats: 182, type: 'state' },
  { name: 'Rajasthan', seats: 25, vidhanSabhaSeats: 200, type: 'state' },
  { name: 'Andhra Pradesh', seats: 25, vidhanSabhaSeats: 175, type: 'state' },
  { name: 'Odisha', seats: 21, vidhanSabhaSeats: 147, type: 'state' },
  { name: 'Telangana', seats: 17, vidhanSabhaSeats: 119, type: 'state' },
  { name: 'Kerala', seats: 20, vidhanSabhaSeats: 140, type: 'state' },
  { name: 'Madhya Pradesh', seats: 29, vidhanSabhaSeats: 230, type: 'state' },
  { name: 'Jharkhand', seats: 14, vidhanSabhaSeats: 81, type: 'state' },
  { name: 'Assam', seats: 14, vidhanSabhaSeats: 126, type: 'state' },
  { name: 'Punjab', seats: 13, vidhanSabhaSeats: 117, type: 'state' },
  { name: 'Haryana', seats: 10, vidhanSabhaSeats: 90, type: 'state' },
  { name: 'Delhi', seats: 7, vidhanSabhaSeats: 70, type: 'ut' },
  { name: 'Chhattisgarh', seats: 11, vidhanSabhaSeats: 90, type: 'state' },
  { name: 'Jammu & Kashmir', seats: 5, vidhanSabhaSeats: 90, type: 'ut' },
  { name: 'Uttarakhand', seats: 5, vidhanSabhaSeats: 70, type: 'state' },
  { name: 'Himachal Pradesh', seats: 4, vidhanSabhaSeats: 68, type: 'state' },
  { name: 'Tripura', seats: 2, vidhanSabhaSeats: 60, type: 'state' },
  { name: 'Meghalaya', seats: 2, vidhanSabhaSeats: 60, type: 'state' },
  { name: 'Manipur', seats: 2, vidhanSabhaSeats: 60, type: 'state' },
  { name: 'Nagaland', seats: 1, vidhanSabhaSeats: 60, type: 'state' },
  { name: 'Goa', seats: 2, vidhanSabhaSeats: 40, type: 'state' },
  { name: 'Arunachal Pradesh', seats: 2, vidhanSabhaSeats: 60, type: 'state' },
  { name: 'Mizoram', seats: 1, vidhanSabhaSeats: 40, type: 'state' },
  { name: 'Sikkim', seats: 1, vidhanSabhaSeats: 32, type: 'state' },
  { name: 'Andaman & Nicobar Islands', seats: 1, vidhanSabhaSeats: null, type: 'ut' },
  { name: 'Dadra & Nagar Haveli and Daman & Diu', seats: 2, vidhanSabhaSeats: null, type: 'ut' },
  { name: 'Lakshadweep', seats: 1, vidhanSabhaSeats: null, type: 'ut' },
  { name: 'Puducherry', seats: 1, vidhanSabhaSeats: 30, type: 'ut' }
]

// Get state names only (for dropdowns)
export const STATE_NAMES = INDIAN_STATES_AND_UTS.map(state => state.name)

// Get state by name
export function getStateByName(name) {
  return INDIAN_STATES_AND_UTS.find(state => state.name === name)
}

// Get states only (excluding UTs)
export const STATES_ONLY = INDIAN_STATES_AND_UTS.filter(state => state.type === 'state')

// Get Union Territories only
export const UNION_TERRITORIES_ONLY = INDIAN_STATES_AND_UTS.filter(state => state.type === 'ut')

