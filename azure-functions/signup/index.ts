import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getContainer, CONTAINERS } from '../lib/cosmos'
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const SALT_ROUNDS = 10;

interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export async function signupConsumer(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {

    context.log('🔥 Signup function invoked');
  context.log('➡️ Method:', request.method);
  context.log('➡️ URL:', request.url);

  try {
    const body = (await request.json()) as SignupRequest;
    const { email, password, name } = body;

    // Basic validation
    if (!email || !password || !name) {
      return {
        status: 400,
        jsonBody: { error: 'Name, email, and password are required.' },
      };
    }

    const normalizedEmail = email.toLowerCase();
    const usersContainer = await getContainer(CONTAINERS.USERS);

    context.log('🔎 Checking if user (Consumer) exists:', normalizedEmail);

    // Check if user already exists (email unique)
    const { resources: existingUsers } = await usersContainer.items
      .query({
        query: 'SELECT c.id FROM c WHERE c.email = @email',
        parameters: [{ name: '@email', value: normalizedEmail }],
      })
      .fetchAll();

    if (existingUsers.length > 0) {
      return {
        status: 409,
        jsonBody: { error: 'User (Consumer) with this email already exists.' },
      };
    }

     context.log('🔐 Hashing password');
    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

   
    // Create user document
    const user = {
      id: randomUUID(), // partition key
      email: normalizedEmail,
      name,
      passwordHash,
      role: 'consumer',
      createdAt: new Date().toISOString(),
    };

     context.log('📝 Creating user (Consumer) in Cosmos DB:', user.id);
    await usersContainer.items.create(user);

    // Return safe response (no password)
    return {
      status: 201,
      jsonBody: {
        message: 'User (Consumer) registered successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    };
  } catch (error: any) {
     context.error('🔥 Signup error:', error);
    // Cosmos unique key violation safety net
    if (error.code === 409) {
      return {
        status: 409,
        jsonBody: { error: 'User (Consumer) with this email already exists.' },
      };
    }

    context.error('Signup error:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to register user (Consumer).' },
    };
  }
}

export async function signupCreator(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {

    context.log('🔥 Signup function invoked');
  context.log('➡️ Method:', request.method);
  context.log('➡️ URL:', request.url);

  try {
    const body = (await request.json()) as SignupRequest;
    const { email, password, name } = body;

    // Basic validation
    if (!email || !password || !name) {
      return {
        status: 400,
        jsonBody: { error: 'Name, email, and password are required.' },
      };
    }

    const normalizedEmail = email.toLowerCase();
    const usersContainer = await getContainer(CONTAINERS.USERS);

    context.log('🔎 Checking if user (Creator) exists:', normalizedEmail);

    // Check if user already exists (email unique)
    const { resources: existingUsers } = await usersContainer.items
      .query({
        query: 'SELECT c.id FROM c WHERE c.email = @email',
        parameters: [{ name: '@email', value: normalizedEmail }],
      })
      .fetchAll();

    if (existingUsers.length > 0) {
      return {
        status: 409,
        jsonBody: { error: 'User (Creator) with this email already exists.' },
      };
    }

     context.log('🔐 Hashing password');
    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

   
    // Create user document
    const user = {
      id: randomUUID(), // partition key
      email: normalizedEmail,
      name,
      passwordHash,
      role: 'creator',
      createdAt: new Date().toISOString(),
    };

     context.log('📝 Creating user (Creator) in Cosmos DB:', user.id);
    await usersContainer.items.create(user);

    // Return safe response (no password)
    return {
      status: 201,
      jsonBody: {
        message: 'User (Creator) registered successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    };
  } catch (error: any) {
     context.error('🔥 Signup error:', error);
    // Cosmos unique key violation safety net
    if (error.code === 409) {
      return {
        status: 409,
        jsonBody: { error: 'User (Creator) with this email already exists.' },
      };
    }

    context.error('Signup error:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to register user (Creator).' },
    };
  }
}