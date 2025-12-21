import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getContainer, CONTAINERS } from "../lib/cosmos"
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";

interface SigninRequest {
  email: string;
  password: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

export async function signin(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const body = (await request.json()) as SigninRequest;
    const { email, password } = body;

    if (!email || !password) {
      return { status: 400, jsonBody: { error: 'Email and password are required.' } };
    }

    const container = await getContainer(CONTAINERS.USERS);

    // Fetch user by email
    const { resources } = await container.items
      .query({
        query: 'SELECT * FROM c WHERE c.email=@email',
        parameters: [{ name: '@email', value: email }],
      })
      .fetchAll();

    const user = resources[0];
    if (!user) {
      return { status: 400, jsonBody: { error: 'Invalid email or password.' } };
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return { status: 400, jsonBody: { error: 'Invalid email or password.' } };
    }

    // Return user info (omit password) and include role
    const { passwordHash: _, ...userInfo } = user;

    // 🔑 Create JWT with role
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return {
      status: 200,
      jsonBody: {
        token,
        message: 'Sign-in successful.',
        user: {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          role: userInfo.role, // <-- include role for frontend
        },
      },
    };
  } catch (error) {
    context.error('Sign-In Error:', error);
    return { status: 500, jsonBody: { error: 'Failed to sign in.' } };
  }
}
