import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'arus_secret_key_2024_money_management';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Akses ditolak. Token tidak disediakan.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Sesi kedaluwarsa atau token tidak valid' });
  }
}
