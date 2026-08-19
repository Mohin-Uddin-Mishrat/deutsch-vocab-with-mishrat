import httpStatus from 'http-status';
import catchAsync from '../../utils/catch_async';
import manageResponse from '../../utils/manage_response';
import { vocabulary_services } from './vocabulary.service';

const create_category = catchAsync(async (req, res) => {
    const result = await vocabulary_services.create_category_into_db(req.body.name, req.user!);
    manageResponse(res, { success: true, statusCode: httpStatus.CREATED, message: 'Category created successfully', data: result });
});

const upload_vocabulary = catchAsync(async (req, res) => {
    const result = await vocabulary_services.upload_vocabulary_into_category(req.params.categoryId, req.body.input, req.user!);
    manageResponse(res, { success: true, statusCode: httpStatus.CREATED, message: 'Vocabulary uploaded successfully', data: result });
});

const update_vocabulary_bangla = catchAsync(async (req, res) => {
    const result = await vocabulary_services.update_vocabulary_bangla_in_category(
        req.params.categoryId,
        req.params.vocabularyIndex,
        req.body.bangla,
        req.user!,
    );
    manageResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Bangla meaning updated successfully', data: result });
});

const delete_category = catchAsync(async (req, res) => {
    await vocabulary_services.delete_category_from_db(req.params.categoryId, req.user!);
    manageResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Category deleted successfully', data: null });
});

const get_specific_category = catchAsync(async (req, res) => {
    const result = await vocabulary_services.get_specific_category_from_db(req.params.categoryId, req.user!);
    manageResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Category fetched successfully', data: result });
});

const get_category_list = catchAsync(async (req, res) => {
    const result = await vocabulary_services.get_category_list_from_db(req.user!);
    manageResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Category list fetched successfully', data: result });
});

export const vocabulary_controllers = { create_category, upload_vocabulary, update_vocabulary_bangla, delete_category, get_specific_category, get_category_list };
