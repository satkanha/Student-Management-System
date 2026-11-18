export class HttpError extends Error {
 constructor(status, message) { super(message); this.status = status; }
}
export function errorHandler(error, req, res, next) {
 let status = error.status || 500;
 let message = error.message;
 if (error.code === 'ER_DUP_ENTRY') { status = 409; message = 'This code, email, or student-course enrollment already exists.'; }
 if (error.code === 'ER_ROW_IS_REFERENCED_2') { status = 409; message = 'Remove related enrollments before deleting this record.'; }
 if (error.code === 'ER_NO_REFERENCED_ROW_2') { status = 400; message = 'The selected student or course does not exist.'; }
 if (error.type === 'entity.parse.failed') { status = 400; message = 'Request body must be valid JSON.'; }
 if (status >= 500) { console.error('Request failed:', { code: error.code || 'INTERNAL_ERROR', method: req.method, path: req.path }); message = 'The server could not complete the request. Check the database connection and try again.'; }
 res.status(status).json({ success: false, error: message });
}
