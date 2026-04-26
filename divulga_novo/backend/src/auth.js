import jwt from 'jsonwebtoken';

export function createToken(userId, plan, jwtSecret) {
  return jwt.sign({ sub: userId, plan }, jwtSecret, { expiresIn: '7d' });
}

export function authRequired(jwtSecret) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Token ausente.' });
    }

    try {
      const payload = jwt.verify(token, jwtSecret);
      req.userId = Number(payload.sub);
      return next();
    } catch {
      return res.status(401).json({ error: 'Token invalido ou expirado.' });
    }
  };
}
