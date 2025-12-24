import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getContainer, CONTAINERS } from '../lib/cosmos';
import { v4 as uuidv4 } from 'uuid';

interface Like {
  id: string;
  photoId: string;
  userId: string;
  createdAt: string;
}


export async function getPhotoLikes(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const photoId = request.headers.get('x-photo-id');

    if (!photoId) {
      return { status: 400, jsonBody: { error: 'Photo ID required' } };
    }

    const photosContainer = await getContainer(CONTAINERS.PHOTOS);

    // Fetch the single photo by ID
    const { resources: photos } = await photosContainer.items
      .query({
        query: 'SELECT c.id, c.imageUrl, c.title, c.likes FROM c WHERE c.id = @photoId',
        parameters: [{ name: '@photoId', value: photoId }],
      })
      .fetchAll();

    if (photos.length === 0) {
      return { status: 404, jsonBody: { error: 'Photo not found' } };
    }

    return { status: 200, jsonBody: photos[0] };
  } catch (error) {
    context.error('Error fetching photo likes:', error);
    return { status: 500, jsonBody: { error: 'Failed to fetch photo likes' } };
  }
}


app.http("get-user-liked-photos", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: getPhotoLikes,
});