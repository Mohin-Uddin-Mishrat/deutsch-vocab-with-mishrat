import httpStatus from 'http-status';
import catchAsync from '../../utils/catch_async';
import manageResponse from '../../utils/manage_response';
import { paragraph_services } from './paragraph.service';

const create_category = catchAsync(async (req, res) => {
    const result = await paragraph_services.create_category_into_db(req.body.name, req.user!);
    manageResponse(res, { success: true, statusCode: httpStatus.CREATED, message: 'Paragraph category created successfully', data: result });
});

const create_paragraph = catchAsync(async (req, res) => {
    const result = await paragraph_services.create_paragraph_into_category(req.params.categoryId, req.body.input);
    manageResponse(res, { success: true, statusCode: httpStatus.CREATED, message: 'Paragraph created successfully', data: result });
});

const get_category_list = catchAsync(async (_req, res) => {
    const result = await paragraph_services.get_category_list_from_db();
    manageResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Paragraph categories fetched successfully', data: result });
});

const get_specific_category = catchAsync(async (req, res) => {
    const result = await paragraph_services.get_specific_category_from_db(req.params.categoryId);
    manageResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Paragraph category fetched successfully', data: result });
});

const delete_paragraph = catchAsync(async (req, res) => {
    const result = await paragraph_services.delete_paragraph_from_category(req.params.categoryId, req.params.paragraphIndex);
    manageResponse(res, { success: true, statusCode: httpStatus.OK, message: 'Paragraph deleted successfully', data: result });
});

export const paragraph_controllers = { create_category, create_paragraph, get_category_list, get_specific_category, delete_paragraph };
