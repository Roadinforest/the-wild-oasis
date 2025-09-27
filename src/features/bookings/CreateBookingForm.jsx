import { useForm } from 'react-hook-form';

import Input from '../../ui/Input';
import Form from '../../ui/Form';
import Button from '../../ui/Button';
import Textarea from '../../ui/Textarea';
import FormRow from '../../ui/FormRow';
import { useCabins } from '../cabins/useCabins';

import { useCreateBooking } from './useCreateBooking';
import { useGuests } from '../guests/useGuests';
import Spinner from '../../ui/Spinner';

function CreateBookingForm({ bookingToEdit = {}, onCloseModal }) {
  const { isCreating, createBooking } = useCreateBooking();
  const {
    cabins,
    error: loadCabinError,
    isLoading: isLoadingCabins,
  } = useCabins();

  const {
    data,
    error: loadGuestsError,
    isLoading: isLoadingGuests,
  } = useGuests();

  const isWorking = isCreating;

  const { id: editId, ...editValues } = bookingToEdit;

  const { register, handleSubmit, reset, getValues, formState } = useForm({
    defaultValues: {},
  });
  const { errors } = formState;

  if (isLoadingCabins || isLoadingGuests) {
    return <Spinner />;
  }

  const guests = data.data;
  // console.log(guests);
  // console.log(cabins);

  function onSubmit(data) {
    console.log(data);

    createBooking(
      { ...data},
      {
        onSuccess: (data) => {
          reset();
          onCloseModal?.();
        },
      }
    );
  }

  function onError(errors) {
    console.log(errors);
  }

  return (
    <Form
      onSubmit={handleSubmit(onSubmit, onError)}
      type={onCloseModal ? 'modal' : 'regular'}
    >

      <FormRow label="Num of guests" error={errors?.numGuests?.message}>
        <Input
          type="number"
          id="numGuests"
          {...register('numGuests', {
            required: 'This field is required',
          })}
        />
      </FormRow>


      <FormRow label="StartDate" error={errors?.startDate?.message}>
        <Input
          type="date"
          id="startDate"
          {...register('startDate', {
            required: 'This field is required',
          })}
        />
      </FormRow>

      <FormRow label="EndDate" error={errors?.endDate?.message}>
        <Input
          type="date"
          id="endDate"
          {...register('endDate', {
            required: 'This field is required',
          })}
        />
      </FormRow>

      <FormRow label="Select your cabin" error={errors?.cabinId?.message}>
        <select
          id="cabin-select"
          {...register('cabinId', {
            required: 'This field is required',
          })}
          required
        >
          {cabins.map((cabin) => (
            <option value={cabin.id} key={cabin.id}>
              {cabin.name}
            </option>
          ))}
        </select>
      </FormRow>

      <FormRow label="Select your guests" error={errors?.guestId?.message}>
        <select
          id="guest-select"
          {...register('guestId', {
            required: 'This field is required',
          })}
        >
          {guests.map((guest) => (
            <option value={guest.id} key={guest.id}>
              {guest.fullName}
            </option>
          ))}
        </select>
      </FormRow>

      <FormRow label="Has breakfast" error={errors?.hasBreakfast?.message}>
        <div style={{ display: 'flex', gap: '25%' }}>
          <div style={{ display: 'flex', gap: '25%' }}>
            <label htmlFor="radio-yes">Yes</label>
            <input
              type="radio"
              id="radio-yes"
              value="true"
              {...register('hasBreakfast', {
                required: 'This field is required',
              })}
            />
          </div>
          <div style={{ display: 'flex', gap: '25%' }}>
            <label htmlFor="radio-no">No</label>
            <input
              type="radio"
              id="radio-no"
              value="false"
              {...register('hasBreakfast', {
                required: 'This field is required',
              })}
            />
          </div>
        </div>
      </FormRow>

      <FormRow label="Observations" error={errors?.observations?.message}>
        <Textarea {...register('observations')} />
      </FormRow>

      <FormRow>
        <Button
          variation="secondary"
          type="reset"
          onClick={() => onCloseModal?.()}
        >
          Cancel
        </Button>
        <Button disabled={isWorking}>{'Create new booking'}</Button>
      </FormRow>
    </Form>
  );
}

export default CreateBookingForm;
