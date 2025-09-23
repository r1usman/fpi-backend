// middleware/adminAccess.js

exports.adminAccess = (req, res, next) => {
    if (!req.user){
        return res.status(401).json({error: 'Authentication Required'})
    }

    if (req.user.status !== 'Admin'){
        return res.status(403).json({error: 'Access denied. Admins only'})
    }

    next();
}