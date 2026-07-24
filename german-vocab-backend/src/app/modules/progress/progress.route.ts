import { Router } from 'express';
import auth from '../../middlewares/auth';
import { progress_controllers } from './progress.controller';

const progressRoute = Router();

progressRoute.get('/', auth('ADMIN', 'USER'), progress_controllers.get_progress);

export default progressRoute;
