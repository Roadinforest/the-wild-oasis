import supabase from './supabase';

export async function getGuests() {

  const { data, error, count } = await supabase.from('guests').select('*');

  if (error) {
    console.error(error);
    throw new Error('Guests could not be loaded');
  }

  return { data, count ,error};
}

export async function getGuestById(guestId) {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('id', guestId)
    .single();

  if (error) {
    console.error('Error fetching guest:', error.message);
    throw new Error(`Failed to fetch guest with ID ${guestId}: ${error.message}`);
  }
  return data;
}