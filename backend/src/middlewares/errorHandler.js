const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Prisma errors
    if (err.code === 'P2002') {
        return res.status(400).json({
            error: 'A record with this value already exists',
            field: err.meta?.target?.[0]
        });
    }

    if (err.code === 'P2025') {
        return res.status(404).json({
            error: 'Record not found'
        });
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: err.message
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expired'
        });
    }

    // Multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            error: 'File too large. Maximum size is 5MB'
        });
    }

    // Default error
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
};

module.exports = { errorHandler };
