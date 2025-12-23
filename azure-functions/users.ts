// import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
// import { getContainer, CONTAINERS } from './lib/cosmos';
// import { cacheGet, cacheSet, CACHE_KEYS } from './lib/redis';

// interface User {
//   id: string;
//   email: string;
//   name: string;
//   role: 'creator' | 'consumer';
//   avatar?: string;
//   createdAt: string;
// }

// // GET /api/users/me - Get current user profile
// export async function getCurrentUser(
//   request: HttpRequest,
//   context: InvocationContext
// ): Promise<HttpResponseInit> {
//   try {
//     const userId = request.headers.get('x-user-id');
    
//     if (!userId) {
//       return { status: 401, jsonBody: { error: 'Not authenticated' } };
//     }

//     const container = await getContainer(CONTAINERS.USERS);
//     const { resource: user } = await container.item(userId, userId).read();

//     if (!user) {
//       return { status: 404, jsonBody: { error: 'User not found' } };
//     }

//     return { status: 200, jsonBody: user };
//   } catch (error) {
//     context.error('Error fetching user:', error);
//     return { status: 500, jsonBody: { error: 'Failed to fetch user' } };
//   }
// }

// // POST /api/users - Create or update user (called after B2C auth)
// export async function upsertUser(
//   request: HttpRequest,
//   context: InvocationContext
// ): Promise<HttpResponseInit> {
//   try {
//     const body = await request.json() as Partial<User>;
//     const userId = request.headers.get('x-user-id');
//     const userEmail = request.headers.get('x-user-email');

//     if (!userId || !userEmail) {
//       return { status: 401, jsonBody: { error: 'Not authenticated' } };
//     }

//     const container = await getContainer(CONTAINERS.USERS);
    
//     // Check if user exists
//     let existingUser: User | null = null;
//     try {
//       const { resource } = await container.item(userId, userId).read();
//       existingUser = resource;
//     } catch {
//       // User doesn't exist
//     }

//     const user: User = existingUser || {
//       id: userId,
//       email: userEmail,
//       name: body.name || userEmail.split('@')[0],
//       role: 'consumer', // Default role, admin assigns creator role
//       createdAt: new Date().toISOString(),
//     };

//     // Update only allowed fields
//     if (body.name) user.name = body.name;
//     if (body.avatar) user.avatar = body.avatar;

//     await container.items.upsert(user);

//     return { status: 200, jsonBody: user };
//   } catch (error) {
//     context.error('Error upserting user:', error);
//     return { status: 500, jsonBody: { error: 'Failed to upsert user' } };
//   }
// }

// // GET /api/users/:id/photos - Get user's photos
// export async function getUserPhotos(
//   request: HttpRequest,
//   context: InvocationContext
// ): Promise<HttpResponseInit> {
//   try {
//     const userId = request.params.id;
    
//     if (!userId) {
//       return { status: 400, jsonBody: { error: 'User ID required' } };
//     }

//     // Check cache first
//     const cacheKey = CACHE_KEYS.userPhotos(userId);
//     const cached = await cacheGet(cacheKey);
//     if (cached) {
//       return { status: 200, jsonBody: cached };
//     }

//     const container = await getContainer(CONTAINERS.PHOTOS);
//     const { resources: photos } = await container.items
//       .query({
//         query: 'SELECT * FROM c WHERE c.creatorId = @userId ORDER BY c.createdAt DESC',
//         parameters: [{ name: '@userId', value: userId }],
//       })
//       .fetchAll();

//     // Cache results
//     await cacheSet(cacheKey, photos, 120);

//     return { status: 200, jsonBody: photos };
//   } catch (error) {
//     context.error('Error fetching user photos:', error);
//     return { status: 500, jsonBody: { error: 'Failed to fetch user photos' } };
//   }
// }

// // PATCH /api/users/:id/role - Update user role (Admin only)
// export async function updateUserRole(
//   request: HttpRequest,
//   context: InvocationContext
// ): Promise<HttpResponseInit> {
//   try {
//     const targetUserId = request.params.id;
//     const adminRole = request.headers.get('x-user-role');

//     if (adminRole !== 'admin') {
//       return { status: 403, jsonBody: { error: 'Admin access required' } };
//     }

//     const body = await request.json() as { role: 'creator' | 'consumer' };
    
//     if (!body.role || !['creator', 'consumer'].includes(body.role)) {
//       return { status: 400, jsonBody: { error: 'Valid role required' } };
//     }

//     const container = await getContainer(CONTAINERS.USERS);
//     const { resource: user } = await container.item(targetUserId!, targetUserId!).read();

//     if (!user) {
//       return { status: 404, jsonBody: { error: 'User not found' } };
//     }

//     user.role = body.role;
//     await container.items.upsert(user);

//     return { status: 200, jsonBody: user };
//   } catch (error) {
//     context.error('Error updating user role:', error);
//     return { status: 500, jsonBody: { error: 'Failed to update user role' } };
//   }
// }
