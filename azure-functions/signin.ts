// import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
// import { getContainer, CONTAINERS } from './lib/cosmos';
// import bcrypt from 'bcrypt';

// interface SigninRequest {
//   email: string;
//   password: string;
// }

// export async function signin(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
//   try {
//     const body = (await request.json()) as SigninRequest;
//     const { email, password } = body;

//     if (!email || !password) {
//       return { status: 400, jsonBody: { error: 'Email and password are required.' } };
//     }

//     const container = await getContainer(CONTAINERS.USERS);

//     // Fetch user by email
//     const { resources } = await container.items
//       .query({
//         query: 'SELECT * FROM c WHERE c.email=@email',
//         parameters: [{ name: '@email', value: email }],
//       })
//       .fetchAll();

//     const user = resources[0];
//     if (!user) {
//       return { status: 400, jsonBody: { error: 'Invalid email or password.' } };
//     }

//     // Verify password
//     const validPassword = await bcrypt.compare(password, user.password);
//     if (!validPassword) {
//       return { status: 400, jsonBody: { error: 'Invalid email or password.' } };
//     }

//     // Return user info (omit password)
//     const { password: _, ...userInfo } = user;

//     return { status: 200, jsonBody: { message: 'Sign-in successful.', user: userInfo } };
//   } catch (error) {
//     context.error('Sign-In Error:', error);
//     return { status: 500, jsonBody: { error: 'Failed to sign in.' } };
//   }
// }
