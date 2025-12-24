import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getContainer, CONTAINERS } from '../lib/cosmos';
import { v4 as uuidv4 } from 'uuid';

interface Comment {
  id: string;
  photoId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole?: string;
  content: string;
  createdAt: string;
}

// GET /api/photos/:photoId/comments - Get comments for a photo
export async function getComments(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const photoId = request.headers.get('x-photo-id');

    if (!photoId) {
      return { status: 400, jsonBody: { error: 'Photo ID required' } };
    }

    const container = await getContainer(CONTAINERS.COMMENTS);
    const { resources: comments } = await container.items
      .query(
        {
          query: 'SELECT * FROM c WHERE c.photoId = @photoId ORDER BY c.createdAt DESC',
          parameters: [{ name: '@photoId', value: photoId }],
        },
        { partitionKey: photoId } // optional but recommended
      )
      .fetchAll();

    return { status: 200, jsonBody: comments };
  } catch (error) {
    context.error('Error fetching comments:', error);
    return { status: 500, jsonBody: { error: 'Failed to fetch comments' } };
  }
}

app.http("get-comments", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: getComments,
});