import { useState } from 'react';
import { isFuture, isPast, isToday } from 'date-fns';
import supabase from '../services/supabase';
import Button from '../ui/Button';
import { subtractDates } from '../utils/helpers';

import { bookings } from './data-bookings';
import { cabins } from './data-cabins';
import { guests } from './data-guests';
import Heading from '../ui/Heading';
import toast from 'react-hot-toast';

// const originalSettings = {
//   minBookingLength: 3,
//   maxBookingLength: 30,
//   maxGuestsPerBooking: 10,
//   breakfastPrice: 15,
// };

async function deleteGuests() {
  const { error } = await supabase.from('guests').delete().gt('id', 0);
  if (error) {
    console.error('Failed to delete guests:', error.message);
    throw new Error(`Failed to delete guests: ${error.message}`);
  }
  console.log('Guests deleted successfully');
}

async function deleteCabins() {
  const { error } = await supabase.from('cabins').delete().gt('id', 0);
  if (error) {
    console.error('Failed to delete cabins:', error.message);
    throw new Error(`Failed to delete cabins: ${error.message}`);
  }
  console.log('Cabins deleted successfully');
}

async function deleteBookings() {
  const { error } = await supabase.from('bookings').delete().gt('id', 0);
  if (error) {
    console.error('Failed to delete bookings:', error.message);
    throw new Error(`Failed to delete bookings: ${error.message}`);
  }
  console.log('Bookings deleted successfully');
}

async function createGuests() {
  const { error } = await supabase.from('guests').insert(guests);
  if (error) console.log(error.message);
}

async function createCabins() {
  const { error } = await supabase.from('cabins').insert(cabins);
  if (error) console.log(error.message);
}

async function createBookings() {
  // Bookings need a guestId and a cabinId. We can't tell Supabase IDs for each object, it will calculate them on its own. So it might be different for different people, especially after multiple uploads. Therefore, we need to first get all guestIds and cabinIds, and then replace the original IDs in the booking data with the actual ones from the DB
  const { data: guestsIds } = await supabase
    .from('guests')
    .select('id')
    .order('id');
  const allGuestIds = guestsIds.map((cabin) => cabin.id);
  const { data: cabinsIds } = await supabase
    .from('cabins')
    .select('id')
    .order('id');
  const allCabinIds = cabinsIds.map((cabin) => cabin.id);

  const finalBookings = bookings.map((booking) => {
    // Here relying on the order of cabins, as they don't have and ID yet
    const cabin = cabins.at(booking.cabinId - 1);
    const numNights = subtractDates(booking.endDate, booking.startDate);
    const cabinPrice = numNights * (cabin.regularPrice - cabin.discount);
    const extraPrice = booking.hasBreakfast
      ? numNights * 15 * booking.numGuests
      : 0; // hardcoded breakfast price
    const totalPrice = cabinPrice + extraPrice;

    let status;
    if (
      isPast(new Date(booking.endDate)) &&
      !isToday(new Date(booking.endDate))
    )
      status = 'checked-out';
    if (
      isFuture(new Date(booking.startDate)) ||
      isToday(new Date(booking.startDate))
    )
      status = 'unconfirmed';
    if (
      (isFuture(new Date(booking.endDate)) ||
        isToday(new Date(booking.endDate))) &&
      isPast(new Date(booking.startDate)) &&
      !isToday(new Date(booking.startDate))
    )
      status = 'checked-in';

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

  const { error } = await supabase.from('bookings').insert(finalBookings);
  if (error) console.log(error.message);
}

function Uploader() {
  const [isLoading, setIsLoading] = useState({ status: false, which: null });

  async function uploadAll() {
    setIsLoading({ status: true, which: 'All' });

    try {
      // Bookings need to be deleted FIRST
      await deleteBookings();
      await deleteGuests();
      await deleteCabins();

      // Bookings need to be created LAST
      await createGuests();
      await createCabins();
      await createBookings();

      toast.success('Upload success!');
    } catch (uploadError) {
      toast.error(uploadError);
    }

    setIsLoading({ status: false, which: 'All' });
  }

  async function uploadBookings() {
    setIsLoading({ status: true, which: 'Bookings' });
    try {
      await deleteBookings();
      await createBookings();
      toast.success('Upload success!');
    } catch (uploadError) {
      toast.error(uploadError);
    }
    setIsLoading({ status: false, which: 'Bookings' });
  }

  return (
    <div
      style={{
        marginTop: 'auto',
        backgroundColor: 'var(--color-grey-200)',
        padding: '8px',
        borderRadius: '5px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        position: 'fixed',
        top: '60vh',
      }}
    >
      <Heading as="h3">SAMPLE DATA</Heading>

      <Button onClick={uploadAll} disabled={isLoading.status}>
        {isLoading.status && isLoading.which === 'All'
          ? 'Uploading...'
          : 'Upload ALL'}
      </Button>

      <Button onClick={uploadBookings} disabled={isLoading.status}>
        {isLoading.status && isLoading.which === 'Bookings'
          ? 'Uploading...'
          : 'Upload bookings ONLY'}
      </Button>
    </div>
  );
}

export default Uploader;
