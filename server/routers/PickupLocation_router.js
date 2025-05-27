import {GetAllPickup , AddPickupLocation , GetCarsByPickupLocation} from  '../PickupLocation.js';
import {Router} from 'express';
const router = Router();

router.get('/getpickupLocation' , GetAllPickup);

router.post('/AddpickupLocation' , AddPickupLocation) ;

router.get('/getCarsByPickupLocatuin' , GetCarsByPickupLocation);

export default router ;