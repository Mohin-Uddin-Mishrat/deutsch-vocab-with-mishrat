import { Router } from 'express';
import auth from '../../middlewares/auth';
import RequestValidator from '../../middlewares/request_validator';
import { paragraph_controllers } from './paragraph.controller';
import { paragraph_validation } from './paragraph.validation';

const paragraphRoute = Router();

paragraphRoute.use(auth('ADMIN', 'USER'));
paragraphRoute.get('/categories', paragraph_controllers.get_category_list);
paragraphRoute.get('/categories/:categoryId', paragraph_controllers.get_specific_category);
paragraphRoute.post('/categories', auth('ADMIN'), RequestValidator(paragraph_validation.createCategory), paragraph_controllers.create_category);
paragraphRoute.post('/categories/:categoryId/paragraphs', auth('ADMIN'), RequestValidator(paragraph_validation.createParagraph), paragraph_controllers.create_paragraph);
paragraphRoute.delete('/categories/:categoryId/paragraphs/:paragraphIndex', auth('ADMIN'), paragraph_controllers.delete_paragraph);

export default paragraphRoute;
