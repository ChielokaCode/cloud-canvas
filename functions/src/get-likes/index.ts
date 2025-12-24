import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getContainer, CONTAINERS } from '../lib/cosmos';
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

app.http("get-likes", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: getLikes,
});
