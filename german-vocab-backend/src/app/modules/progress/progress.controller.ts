import httpStatus from 'http-status';
import catchAsync from '../../utils/catch_async';
import manageResponse from '../../utils/manage_response';
import { progress_services } from './progress.service';

const get_progress = catchAsync(async (req, res) => {
    const range = typeof req.query.range === 'string' ? req.query.range : 'week';
    const result = await progress_services.get_progress_from_db(req.user!.email, range);
    manageResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Progress fetched successfully',
        data: result,
    });
});

export const progress_controllers = { get_progress };
