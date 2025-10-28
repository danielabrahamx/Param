const adminAuth = (req, res, next) => {
  const apiKey = req.headers['x-admin-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  const validKey = process.env.ADMIN_API_KEY || 'demo-admin-key-123';
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Admin API key required. Include X-Admin-Key header'
    });
  }
  
  if (apiKey !== validKey) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid admin API key'
    });
  }
  
  console.log('✅ Admin request authorized');
  next();
};

module.exports = { adminAuth };
