import swaggerJSDoc from 'swagger-jsdoc';

const response = (description: string, dataSchema: Record<string, unknown> = {}) => ({
    description,
    content: {
        'application/json': {
            schema: {
                $ref: '#/components/schemas/ApiResponse',
                ...(Object.keys(dataSchema).length ? { properties: { data: dataSchema } } : {}),
            },
        },
    },
});

const errorResponses = {
    400: response('Invalid request data'),
    401: response('Authentication is required or the token is invalid'),
    404: response('Requested resource was not found'),
};

const swaggerSpec = swaggerJSDoc({
    definition: {
        openapi: '3.0.3',
        info: { title: 'Deutsch Learning Helper API', version: '1.0.0', description: 'Interactive API documentation for the Deutsch Learning Helper backend.' },
        servers: [{ url: '/api', description: 'Current API server' }],
        tags: [
            { name: 'Health', description: 'Service availability' },
            { name: 'Auth', description: 'Account and authentication operations' },
            { name: 'Vocabulary', description: 'Category and vocabulary operations for authenticated users and admins' },
        ],
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Paste the access token exactly as returned by login (without a Bearer prefix).' },
            },
            schemas: {
                ApiResponse: { type: 'object', required: ['success', 'message'], properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: { nullable: true }, meta: { nullable: true } } },
                Account: { type: 'object', properties: { _id: { type: 'string', example: '66c8e4f4377a6f3a9de91d20' }, name: { type: 'string', example: 'Ada Lovelace' }, email: { type: 'string', format: 'email' }, role: { type: 'string', enum: ['ADMIN', 'USER'] }, isVerified: { type: 'boolean' }, accountStatus: { type: 'string', example: 'ACTIVE' }, learned: { type: 'array', items: { $ref: '#/components/schemas/PersonalVocabulary' } }, pending: { type: 'array', items: { $ref: '#/components/schemas/PersonalVocabulary' } }, createdAt: { type: 'string', format: 'date-time' } } },
                PersonalVocabulary: { type: 'object', required: ['bangla', 'english'], properties: { bangla: { type: 'string', example: 'হ্যাঁ' }, english: { type: 'array', items: { type: 'string' }, example: ['yes'] }, sentence: { type: 'string', example: 'Yes, I understand the task.' } } },
                Category: { type: 'object', properties: { _id: { type: 'string' }, name: { type: 'string', example: 'Greetings' }, normalizedName: { type: 'string', example: 'greetings' }, createdBy: { type: 'string' }, vocabularies: { type: 'array', items: { $ref: '#/components/schemas/EmbeddedVocabulary' } }, createdAt: { type: 'string', format: 'date-time' } } },
                EmbeddedVocabulary: { type: 'object', required: ['bangla', 'german'], properties: { bangla: { type: 'string', example: 'ধন্যবাদ' }, german: { type: 'array', items: { type: 'string' }, example: ['Danke'] }, sentence: { type: 'string', example: 'Danke für deine Hilfe.' } } },
            },
        },
        paths: {
            '/': { get: { tags: ['Health'], summary: 'Check server availability', servers: [{ url: '/' }], responses: { 200: response('Server is running') } } },
            '/auth/register': { post: { tags: ['Auth'], summary: 'Register an account', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name', 'email', 'password'], properties: { name: { type: 'string', example: 'Ada Lovelace' }, email: { type: 'string', format: 'email' }, password: { type: 'string', format: 'password' } } } } } }, responses: { 200: response('Account created; sets httpOnly accessToken and refreshToken cookies', { type: 'object', properties: { accessToken: { type: 'string' }, role: { type: 'string', enum: ['ADMIN', 'USER'] } } }), ...errorResponses } } },
            '/auth/login': { post: { tags: ['Auth'], summary: 'Log in', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', format: 'password' } } } } } }, responses: { 200: response('Logged in; sets httpOnly accessToken and refreshToken cookies', { type: 'object', properties: { accessToken: { type: 'string' }, role: { type: 'string', enum: ['ADMIN', 'USER'] } } }), ...errorResponses } } },
            '/auth/me': { get: { tags: ['Auth'], summary: 'Get the current user profile and categories', description: 'Users receive their own and admin-created category data. Admins receive all category data, plus compact category name/ID lists.', security: [{ bearerAuth: [] }], responses: { 200: response('Profile fetched'), ...errorResponses } } },
            '/auth/vocabularies/{listType}': { post: { tags: ['Auth'], summary: 'Upload personal learned or pending vocabulary', security: [{ bearerAuth: [] }], parameters: [{ name: 'listType', in: 'path', required: true, schema: { type: 'string', enum: ['learned', 'pending'] }, description: 'Target personal vocabulary list' }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['input'], properties: { input: { type: 'string', description: 'Separate entries with commas or new lines. Use "Bangla = English + English / optional sentence /".', example: 'হ্যাঁ = yes /Yes, I understand the task/ , ধন্যবাদ = thanks + thank you' } } } } } }, responses: { 201: response('Personal vocabulary uploaded', { type: 'object', properties: { processed: { type: 'number' }, created: { type: 'number' }, updated: { type: 'number' } } }), ...errorResponses } } },
            '/auth/refresh-token': { post: { tags: ['Auth'], summary: 'Refresh the access token', description: 'Uses the refreshToken httpOnly cookie created during login.', responses: { 200: response('New access token generated', { type: 'object', properties: { accessToken: { type: 'string' } } }), ...errorResponses } } },
            '/auth/change-password': { post: { tags: ['Auth'], summary: 'Change the current user password', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['oldPassword', 'newPassword'], properties: { oldPassword: { type: 'string', format: 'password' }, newPassword: { type: 'string', format: 'password' } } } } } }, responses: { 200: response('Password changed'), ...errorResponses } } },
            '/auth/forgot-password': { post: { tags: ['Auth'], summary: 'Request a password-reset email', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } } } } }, responses: { 200: response('Password-reset link sent'), ...errorResponses } } },
            '/auth/reset-password': { post: { tags: ['Auth'], summary: 'Reset a password using an email token', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'token', 'newPassword'], properties: { email: { type: 'string', format: 'email' }, token: { type: 'string' }, newPassword: { type: 'string', format: 'password' } } } } } }, responses: { 200: response('Password reset'), ...errorResponses } } },
            '/auth/verified-account': { post: { tags: ['Auth'], summary: 'Verify an account', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['token'], properties: { token: { type: 'string' } } } } } }, responses: { 200: response('Account verified'), ...errorResponses } } },
            '/auth/new-verification-link': { post: { tags: ['Auth'], summary: 'Send a new account-verification email', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } } } } }, responses: { 200: response('Verification link sent'), ...errorResponses } } },
            '/vocabulary/categories': {
                post: { tags: ['Vocabulary'], summary: 'Create a category', description: 'Available to users and admins. The creator owns the category.', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string', minLength: 1, maxLength: 100, example: 'Greetings' } } } } } }, responses: { 201: response('Category created', { $ref: '#/components/schemas/Category' }), ...errorResponses } },
                get: { tags: ['Vocabulary'], summary: 'List category names and IDs', description: 'Users receive { own, admin }; admins receive every category in one array.', security: [{ bearerAuth: [] }], responses: { 200: response('Category list fetched'), ...errorResponses } },
            },
            '/vocabulary/categories/{categoryId}': {
                get: { tags: ['Vocabulary'], summary: 'Get a category and its vocabularies', description: 'Users may read their own categories and categories created by admins. Admins may read any category.', security: [{ bearerAuth: [] }], parameters: [{ name: 'categoryId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: response('Category fetched', { $ref: '#/components/schemas/Category' }), ...errorResponses } },
                delete: { tags: ['Vocabulary'], summary: 'Delete a category', description: 'Users can delete only their own categories; admins can delete any category.', security: [{ bearerAuth: [] }], parameters: [{ name: 'categoryId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: response('Category deleted'), ...errorResponses } },
            },
            '/vocabulary/categories/{categoryId}/vocabularies': { post: { tags: ['Vocabulary'], summary: 'Upload vocabularies to a category', description: 'Users can upload to their own categories. Admins can upload only to admin-created categories.', security: [{ bearerAuth: [] }], parameters: [{ name: 'categoryId', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['input'], properties: { input: { type: 'string', description: 'Separate entries with commas or new lines. Use "Bangla = German + German / optional German sentence /".', example: 'হ্যাঁ = ja /Ja, ich verstehe die Aufgabe/ , অবশ্যই = klar + natürlich' } } } } } }, responses: { 201: response('Vocabulary uploaded', { type: 'object', properties: { processed: { type: 'number' }, created: { type: 'number' }, updated: { type: 'number' } } }), ...errorResponses } } },
        },
    },
    apis: [],
});

export default swaggerSpec;
