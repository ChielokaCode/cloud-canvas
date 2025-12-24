import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getContainer, CONTAINERS } from '../lib/cosmos';
import { v4 as uuidv4 } from 'uuid';

interface Like {
  id: string;
  photoId: string;
  userId: string;
  createdAt: string;
}



export async function likePhoto(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const { photoId } = (await request.json()) as { photoId: string };
    if (!photoId) {
      return { status: 400, jsonBody: { error: 'Photo ID required' } };
    }

    const photosContainer = await getContainer(CONTAINERS.PHOTOS);

    // 1️⃣ Find the photo to get creatorId
    const { resources } = await photosContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: photoId }],
      })
      .fetchAll();

    if (resources.length === 0) {
      return { status: 404, jsonBody: { error: 'Photo not found' } };
    }

    const photo = resources[0];

    // 2️⃣ Update likes
    const updatedPhoto = {
      ...photo,
      likes: (photo.likes ?? 0) + 1,
    };

    // 3️⃣ Replace using correct partition key
    await photosContainer
      .item(photo.id, photo.creatorId)
      .replace(updatedPhoto);

    return {
      status: 200,
      jsonBody: { likes: updatedPhoto.likes },
    };
  } catch (err) {
    context.error('Error liking photo:', err);
    return { status: 500, jsonBody: { error: 'Failed to like photo' } };
  }
}

app.http("like-photo", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: likePhoto,
});