import { Router } from 'express';
import auth from '../../middlewares/auth';
import RequestValidator from '../../middlewares/request_validator';
import { vocabulary_controllers } from './vocabulary.controller';
import { vocabulary_validation } from './vocabulary.validation';

const vocabularyRoute = Router();
vocabularyRoute.use(auth('ADMIN', 'USER'));
vocabularyRoute.post('/categories', RequestValidator(vocabulary_validation.createCategory), vocabulary_controllers.create_category);
vocabularyRoute.get('/categories', vocabulary_controllers.get_category_list);
vocabularyRoute.get('/categories/:categoryId', vocabulary_controllers.get_specific_category);
vocabularyRoute.delete('/categories/:categoryId', vocabulary_controllers.delete_category);
vocabularyRoute.post('/categories/:categoryId/vocabularies', RequestValidator(vocabulary_validation.uploadVocabulary), vocabulary_controllers.upload_vocabulary);

export default vocabularyRoute;
