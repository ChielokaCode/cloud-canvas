import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!; 
// or PUBLIC_KEY for RS256

export interface AuthUser {
  id: string;
  name: string;
  role: string;
  email?: string;
}


export function getUserFromJwtToken(
  authorizationHeader?: string | null
): AuthUser | null {

  if (!authorizationHeader) return null;

  const [type, token] = authorizationHeader.split(' ');

  if (type !== 'Bearer' || !token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    return {
      id: decoded.sub as string,
      name: decoded.name as string,
      role: decoded.role as string,
      email: decoded.email as string | undefined,
    };
  } catch (error) {
    console.error('Invalid JWT:', error);
    return null;
  }
}
