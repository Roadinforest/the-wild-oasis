import { isFuture, isPast, isToday } from 'date-fns';
import { bookings } from './data-bookings.js';
import { cabins } from './data-cabins.js';
import { guests } from './data-guests.js';
import { createClient } from '@supabase/supabase-js';

// Create a supabase client for Node env
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log(supabaseUrl,supabaseKey);
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'SUPABASE_URL and SUPABASE_ANON_KEY must be set in the environment variables'
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to calculate the number of nights between two dates
function subtractDates(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const diffInMs = Math.abs(d2 - d1);
  // Convert milliseconds to days and round to the nearest whole number
  return Math.round(diffInMs / (1000 * 60 * 60 * 24));
}

// Function to delete all data from a specified table
async function deleteData(table) {
  console.log(`Deleting data from table: ${table}...`);
  // Delete all rows where the ID is greater than 0
  const { error } = await supabase.from(table).delete().gt('id', 0);
  if (error) {
    console.error(`Failed to delete data from table ${table}:`, error.message);
    process.exit(1); // Exit the process with an error code
  }
  console.log(`Successfully deleted data from table ${table}.`);
}

// Function to create new data by inserting into a specified table
async function createData(table, data) {
  console.log(`Creating data in table: ${table}...`);
  const { error } = await supabase.from(table).insert(data);
  if (error) {
    console.error(`Failed to create data in table ${table}:`, error.message);
    process.exit(1);
  }
  console.log(`Successfully created data in table ${table}.`);
}

// Special function to create bookings, as it requires retrieving foreign key IDs
async function createBookings() {
  console.log('Creating booking data...');
  // Get all guest IDs from the database, sorted by their original ID
  const { data: guestsIds } = await supabase
    .from('guests')
    .select('id')
    .order('id');
  const allGuestIds = guestsIds.map((guest) => guest.id);

  // Get all cabin IDs from the database, sorted by their original ID
  const { data: cabinsIds } = await supabase
    .from('cabins')
    .select('id')
    .order('id');
  const allCabinIds = cabinsIds.map((cabin) => cabin.id);

  // Map over the original bookings data to prepare it for insertion
  const finalBookings = bookings.map((booking) => {
    // Find the corresponding cabin based on the hardcoded cabinId (e.g., cabinId: 1 maps to index 0)
    const cabin = cabins.at(booking.cabinId - 1);
    const numNights = subtractDates(booking.endDate, booking.startDate);
    const cabinPrice = numNights * (cabin.regularPrice - cabin.discount);
    // Hardcoded breakfast price of 15
    const extraPrice = booking.hasBreakfast
      ? numNights * 15 * booking.numGuests
      : 0;
    const totalPrice = cabinPrice + extraPrice;

    // Determine the booking status based on the dates
    let status;
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);

    if (isPast(endDate) && !isToday(endDate)) {
      status = 'checked-out';
    } else if (isFuture(startDate) || isToday(startDate)) {
      status = 'unconfirmed';
    } else if (
      (isFuture(endDate) || isToday(endDate)) &&
      isPast(startDate) &&
      !isToday(startDate)
    ) {
      status = 'checked-in';
    } else {
      status = 'unconfirmed'; // Default status if none of the above conditions are met
    }

    // Return the final booking object with computed values and correct foreign key IDs
    return {
      ...booking,
      numNights,
      cabinPrice,
      extraPrice,
      totalPrice,
      guestId: allGuestIds.at(booking.guestId - 1),
      cabinId: allCabinIds.at(booking.cabinId - 1),
      status,
    };
  });

  // Insert the prepared booking data into the 'bookings' table
  const { error } = await supabase.from('bookings').insert(finalBookings);
  if (error) {
    console.error('Failed to create booking data:', error.message);
    process.exit(1);
  }
  console.log('Successfully created booking data!');
}

// Function to handle the "upload all" script command
async function uploadAll() {
  try {
    console.log('Starting full data upload...');
    // The order of deletion is crucial: bookings depend on guests and cabins
    await deleteData('bookings');
    await deleteData('guests');
    await deleteData('cabins');
    // The order of creation is also crucial
    await createData('guests', guests);
    await createData('cabins', cabins);
    await createBookings();
    console.log('All data upload complete!');
  } catch (error) {
    console.error('Upload failed:', error);
  } finally {
    process.exit(0); // Exit the process on success
  }
}

// Function to handle the "upload bookings only" script command
async function uploadBookings() {
  try {
    console.log('Starting bookings data upload...');
    await deleteData('bookings');
    await createBookings();
    console.log('Bookings data upload complete!');
  } catch (error) {
    console.error('Upload failed:', error);
  } finally {
    process.exit(0);
  }
}

// Main execution block: checks for command-line arguments to determine which function to run
const scriptName = process.argv[2];

if (scriptName === 'all') {
  uploadAll();
} else if (scriptName === 'bookings') {
  uploadBookings();
} else {
  console.log('Usage: node scripts/upload-data.js [all|bookings]');
  process.exit(1); // Exit with an error if the argument is invalid
}
