import Button from '../../ui/Button';
import CreateBookingForm from './CreateBookingForm';
import Modal from '../../ui/Modal';

function AddBooking() {
  return (
    <div>
      <Modal>
        <Modal.Open opens="cabin-form">
          <Button>Add new booking</Button>
        </Modal.Open>
        <Modal.Window name="cabin-form">
          <CreateBookingForm />
        </Modal.Window>
      </Modal>
    </div>
  );
}

export default AddBooking;
