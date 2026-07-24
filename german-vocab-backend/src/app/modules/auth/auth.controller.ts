import { configs } from "../../configs";
import catchAsync from "../../utils/catch_async";
import manageResponse from "../../utils/manage_response";
import { auth_services } from "./auth.service";
import httpStatus from 'http-status';

const register_user = catchAsync(async (req, res) => {
    const result = await auth_services.register_user_into_db(req?.body)
    const cookieOptions = {
        secure: configs.env == 'production',
        httpOnly: true,
    };
    res.cookie('accessToken', result.accessToken, cookieOptions);
    res.cookie('refreshToken', result.refreshToken, cookieOptions);
    manageResponse(res, {
        success: true,
        message: "Account created successful",
        statusCode: httpStatus.OK,
        data: {
            accessToken: result.accessToken,
            role: result.role,
        }
    })
})

const login_user = catchAsync(async (req, res) => {
    const result = await auth_services.login_user_from_db(req.body);

    const cookieOptions = {
        secure: configs.env == 'production',
        httpOnly: true,
    };
    res.cookie('accessToken', result.accessToken, cookieOptions);
    res.cookie('refreshToken', result.refreshToken, cookieOptions);
    manageResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User is logged in successful !',
        data: {
            accessToken: result.accessToken,
            role: result?.role
        },
    });
});

const get_my_profile = catchAsync(async (req, res) => {
    const { email } = req.user!;
    const result = await auth_services.get_my_profile_from_db(email);
    manageResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User profile fetched successfully!',
        data: result,
    });
});

const upload_personal_vocabulary = catchAsync(async (req, res) => {
    const result = await auth_services.upload_personal_vocabulary_into_db(req.user!.email, req.params.listType, req.body.input);
    manageResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: `${req.params.listType} vocabulary uploaded successfully`,
        data: result,
    });
});

const delete_personal_vocabulary = catchAsync(async (req, res) => {
    const result = await auth_services.delete_personal_vocabulary_from_db(req.user!.email, req.params.listType, req.body.bangla);
    manageResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `${req.params.listType} vocabulary deleted successfully`,
        data: result,
    });
});

const get_all_users = catchAsync(async (_req, res) => {
    const result = await auth_services.get_all_users_from_db();
    manageResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Users fetched successfully', data: result });
});

const delete_user = catchAsync(async (req, res) => {
    const result = await auth_services.delete_user_from_db(req.params.userId);
    manageResponse(res, { statusCode: httpStatus.OK, success: true, message: 'User deleted successfully', data: result });
});

const refresh_token = catchAsync(async (req, res) => {
    const { refreshToken } = req.cookies;
    const result = await auth_services.refresh_token_from_db(refreshToken);
    manageResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Refresh token generated successfully!',
        data: result,
    });
});

const change_password = catchAsync(async (req, res) => {
    const user = req?.user;
    const result = await auth_services.change_password_from_db(user!, req.body);

    manageResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Password changed successfully!',
        data: result,
    });
});

const forget_password = catchAsync(async (req, res) => {
    const { email } = req?.body
    await auth_services.forget_password_from_db(email);
    manageResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Reset password link sent to your email!',
        data: null,
    });
});

const reset_password = catchAsync(async (req, res) => {
    const { token, newPassword, email } = req.body;
    const result = await auth_services.reset_password_into_db(
        token,
        email,
        newPassword,
    );
    manageResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Password reset successfully!',
        data: result,
    });
});

const verified_account = catchAsync(async (req, res) => {
    const result = await auth_services.verified_account_into_db(req?.body?.token)

    manageResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Account Verification successful.",
        data: result
    })
})

const get_new_verification_link = catchAsync(async (req, res) => {
    const result = await auth_services.get_new_verification_link_from_db(req?.body?.email)
    manageResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "New Verification link is send on email.",
        data: result
    })
})

export const auth_controllers = {
    register_user,
    login_user,
    get_my_profile,
    upload_personal_vocabulary,
    delete_personal_vocabulary,
    get_all_users,
    delete_user,
    refresh_token,
    change_password,
    reset_password,
    forget_password,
    verified_account,
    get_new_verification_link
}
