import { getToday } from '../utils/helpers';
import supabase from './supabase';
import { PAGE_SIZE } from '../utils/constants';
import { isFuture, isPast, isToday } from 'date-fns';
import { subtractDates } from '../utils/helpers';
import { getCabinById } from './apiCabins';

// booking
// {
//   created_at: fromToday(-20, true),
//   startDate: fromToday(0),
//   endDate: fromToday(7),
//   cabinId: "1",
//   guestId: "2",
//   hasBreakfast: true,
//   observations:
//     'I have a gluten allergy and would like to request a gluten-free breakfast.',
//   numGuests: "1",
// },

export async function createBooking(booking) {
  // const cabin = cabins.at(booking.cabinId - 1);
  let numGuests = Number(booking.numGuests);
  const isPaid = false;
  const cabin = await getCabinById(booking.cabinId);
  console.log(cabin);
  const numNights = subtractDates(booking.endDate, booking.startDate);
  const cabinPrice = numNights * (cabin.regularPrice - cabin.discount);
  const extraPrice = booking.hasBreakfast
    ? numNights * 15 * booking.numGuests
    : 0; // hardcoded breakfast price
  const totalPrice = cabinPrice + extraPrice;

  let status;
  if (isPast(new Date(booking.endDate)) && !isToday(new Date(booking.endDate)))
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

  const finalBooking = {
    ...booking,
    numNights,
    cabinPrice,
    extraPrice,
    totalPrice,
    status,
    isPaid,
  };

  const { error } = await supabase.from('bookings').insert(finalBooking);
  if (error) console.log(error.message);
}

export async function getBookings({ filter, sortBy, page }) {
  let query = supabase
    .from('bookings')
    .select(
      'id, created_at, startDate, endDate, numNights, numGuests, status, totalPrice, cabins(name), guests(fullName, email)',
      { count: 'exact' }
    );

  // FILTER
  if (filter) query = query[filter.method || 'eq'](filter.field, filter.value);

  // SORT
  if (sortBy)
    query = query.order(sortBy.field, {
      ascending: sortBy.direction === 'asc',
    });

  if (page) {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error(error);
    throw new Error('Bookings could not be loaded');
  }

  return { data, count };
}

export async function getBooking(id) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, cabins(*), guests(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error(error);
    throw new Error('Booking not found');
  }

  return data;
}

// Returns all BOOKINGS that are were created after the given date. Useful to get bookings created in the last 30 days, for example.
export async function getBookingsAfterDate(date) {
  const { data, error } = await supabase
    .from('bookings')
    .select('created_at, totalPrice, extraPrice')
    .gte('created_at', date)
    .lte('created_at', getToday({ end: true }));

  if (error) {
    console.error(error);
    throw new Error('Bookings could not get loaded');
  }

  return data;
}

// Returns all STAYS that are were created after the given date
export async function getStaysAfterDate(date) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, guests(fullName)')
    .gte('startDate', date)
    .lte('startDate', getToday());

  if (error) {
    console.error(error);
    throw new Error('Bookings could not get loaded');
  }

  return data;
}

// Activity means that there is a check in or a check out today
export async function getStaysTodayActivity() {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, guests(fullName, nationality, countryFlag)')
    .or(
      `and(status.eq.unconfirmed,startDate.eq.${getToday()}),and(status.eq.checked-in,endDate.eq.${getToday()})`
    )
    .order('created_at');

  //相当于
  // (stay.status === 'unconfirmed' && isToday(new Date(stay.startDate))) ||
  // (stay.status === 'checked-in' && isToday(new Date(stay.endDate)))

  if (error) {
    console.error(error);
    throw new Error('Bookings could not get loaded');
  }
  return data;
}

export async function updateBooking(id, obj) {
  const { data, error } = await supabase
    .from('bookings')
    .update(obj)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(error);
    throw new Error('Booking could not be updated');
  }
  return data;
}

export async function deleteBooking(id) {
  // REMEMBER RLS POLICIES
  const { data, error } = await supabase.from('bookings').delete().eq('id', id);

  if (error) {
    console.error(error);
    throw new Error('Booking could not be deleted');
  }
  return data;
}
