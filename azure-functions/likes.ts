import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getContainer, CONTAINERS } from './lib/cosmos';
import { cacheGet, cacheSet, cacheDelete, CACHE_KEYS } from './lib/redis';
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
    const photoId = request.params.photoId;
    const userId = request.headers.get('x-user-id');

    if (!photoId) {
      return { status: 400, jsonBody: { error: 'Photo ID required' } };
    }

    // Check cache for like count
    const cacheKey = CACHE_KEYS.photoLikes(photoId);
    let likeCount = await cacheGet<number>(cacheKey);

    const container = await getContainer(CONTAINERS.LIKES);

    if (likeCount === null) {
      // Count likes from database
      const { resources } = await container.items
        .query({
          query: 'SELECT VALUE COUNT(1) FROM c WHERE c.photoId = @photoId',
          parameters: [{ name: '@photoId', value: photoId }],
        })
        .fetchAll();
      
      likeCount = resources[0] || 0;
      await cacheSet(cacheKey, likeCount, 60);
    }

    // Check if current user has liked
    let userHasLiked = false;
    if (userId) {
      const { resources: userLikes } = await container.items
        .query({
          query: 'SELECT * FROM c WHERE c.photoId = @photoId AND c.userId = @userId',
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
      jsonBody: { count: likeCount, userHasLiked },
    };
  } catch (error) {
    context.error('Error fetching likes:', error);
    return { status: 500, jsonBody: { error: 'Failed to fetch likes' } };
  }
}

// POST /api/photos/:photoId/likes - Like a photo
export async function likePhoto(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const photoId = request.params.photoId;
    const userId = request.headers.get('x-user-id');

    if (!photoId) {
      return { status: 400, jsonBody: { error: 'Photo ID required' } };
    }

    if (!userId) {
      return { status: 401, jsonBody: { error: 'Not authenticated' } };
    }

    // Verify photo exists
    const photosContainer = await getContainer(CONTAINERS.PHOTOS);
    const { resource: photo } = await photosContainer.item(photoId, photoId).read();
    
    if (!photo) {
      return { status: 404, jsonBody: { error: 'Photo not found' } };
    }

    const likesContainer = await getContainer(CONTAINERS.LIKES);

    // Check if already liked
    const { resources: existingLikes } = await likesContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.photoId = @photoId AND c.userId = @userId',
        parameters: [
          { name: '@photoId', value: photoId },
          { name: '@userId', value: userId },
        ],
      })
      .fetchAll();

    if (existingLikes.length > 0) {
      return { status: 409, jsonBody: { error: 'Already liked' } };
    }

    // Create like
    const like: Like = {
      id: uuidv4(),
      photoId,
      userId,
      createdAt: new Date().toISOString(),
    };

    await likesContainer.items.create(like);

    // Update photo like count
    photo.likes = (photo.likes || 0) + 1;
    await photosContainer.items.upsert(photo);

    // Invalidate caches
    await cacheDelete(CACHE_KEYS.photoLikes(photoId));
    await cacheDelete(CACHE_KEYS.photo(photoId));

    return { status: 201, jsonBody: { success: true, likes: photo.likes } };
  } catch (error) {
    context.error('Error liking photo:', error);
    return { status: 500, jsonBody: { error: 'Failed to like photo' } };
  }
}

// DELETE /api/photos/:photoId/likes - Unlike a photo
export async function unlikePhoto(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const photoId = request.params.photoId;
    const userId = request.headers.get('x-user-id');

    if (!photoId) {
      return { status: 400, jsonBody: { error: 'Photo ID required' } };
    }

    if (!userId) {
      return { status: 401, jsonBody: { error: 'Not authenticated' } };
    }

    const likesContainer = await getContainer(CONTAINERS.LIKES);

    // Find the like
    const { resources: existingLikes } = await likesContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.photoId = @photoId AND c.userId = @userId',
        parameters: [
          { name: '@photoId', value: photoId },
          { name: '@userId', value: userId },
        ],
      })
      .fetchAll();

    if (existingLikes.length === 0) {
      return { status: 404, jsonBody: { error: 'Like not found' } };
    }

    // Delete like
    const like = existingLikes[0];
    await likesContainer.item(like.id, like.photoId).delete();

    // Update photo like count
    const photosContainer = await getContainer(CONTAINERS.PHOTOS);
    const { resource: photo } = await photosContainer.item(photoId, photoId).read();
    
    if (photo) {
      photo.likes = Math.max(0, (photo.likes || 0) - 1);
      await photosContainer.items.upsert(photo);
    }

    // Invalidate caches
    await cacheDelete(CACHE_KEYS.photoLikes(photoId));
    await cacheDelete(CACHE_KEYS.photo(photoId));

    return { status: 200, jsonBody: { success: true, likes: photo?.likes || 0 } };
  } catch (error) {
    context.error('Error unliking photo:', error);
    return { status: 500, jsonBody: { error: 'Failed to unlike photo' } };
  }
}

// GET /api/users/:userId/likes - Get photos liked by user
export async function getUserLikedPhotos(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const userId = request.params.userId;

    if (!userId) {
      return { status: 400, jsonBody: { error: 'User ID required' } };
    }

    const likesContainer = await getContainer(CONTAINERS.LIKES);
    const { resources: likes } = await likesContainer.items
      .query({
        query: 'SELECT c.photoId FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC',
        parameters: [{ name: '@userId', value: userId }],
      })
      .fetchAll();

    const photoIds = likes.map((l: { photoId: string }) => l.photoId);

    if (photoIds.length === 0) {
      return { status: 200, jsonBody: [] };
    }

    // Fetch photos
    const photosContainer = await getContainer(CONTAINERS.PHOTOS);
    const { resources: photos } = await photosContainer.items
      .query({
        query: `SELECT * FROM c WHERE c.id IN (${photoIds.map((_, i) => `@id${i}`).join(',')})`,
        parameters: photoIds.map((id, i) => ({ name: `@id${i}`, value: id })),
      })
      .fetchAll();

    return { status: 200, jsonBody: photos };
  } catch (error) {
    context.error('Error fetching liked photos:', error);
    return { status: 500, jsonBody: { error: 'Failed to fetch liked photos' } };
  }
}
