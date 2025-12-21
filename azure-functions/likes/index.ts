import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getContainer, CONTAINERS } from '../lib/cosmos';
import { cacheGet, cacheSet, cacheDelete, CACHE_KEYS } from '../lib/redis';
import { v4 as uuidv4 } from 'uuid';

interface Like {
  id: string;
  photoId: string;
  userId: string;
  createdAt: string;
}

// GET /api/photos/:photoId/likes - Get like count and user's like status
export async function getLikes(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const photoId = request.headers.get('x-photo-id');
    const userId = request.headers.get('x-user-id');

    if (!photoId) {
      return {
        status: 400,
        jsonBody: { error: 'Photo ID required' },
      };
    }

    const likesContainer = await getContainer(CONTAINERS.LIKES);

    // Total like count for the photo
    const { resources: countResult } = await likesContainer.items
      .query({
        query: 'SELECT VALUE COUNT(1) FROM c WHERE c.photoId = @photoId',
        parameters: [{ name: '@photoId', value: photoId }],
      })
      .fetchAll();

    const likeCount = countResult[0] ?? 0;

    // Check if current user has liked the photo
    let userHasLiked = false;

    if (userId) {
      const { resources: userLikes } = await likesContainer.items
        .query({
          query:
            'SELECT * FROM c WHERE c.photoId = @photoId AND c.userId = @userId',
          parameters: [
            { name: '@photoId', value: photoId },
            { name: '@userId', value: userId },
          ],
        })
        .fetchAll();

      userHasLiked = userLikes.length > 0;
    }

    return {
      status: 200,
      jsonBody: {
        count: likeCount,
        userHasLiked,
      },
    };
  } catch (error) {
    context.error('Error fetching likes:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to fetch likes' },
    };
  }
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

export async function unlikePhoto(
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
      likes: (photo.likes ?? 0) - 1,
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
