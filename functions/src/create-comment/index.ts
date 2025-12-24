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

// POST /api/photos/:photoId/comments - Add comment to a photo
export async function createComment(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const body = await request.json() as {
      photoId: string;
      userId: string;
      userName?: string;
      userRole?: string;
      content: string;
    };

    const { photoId, userId, userName, userRole, content } = body;

    if (!photoId) {
      return { status: 400, jsonBody: { error: 'Photo ID required' } };
    }
    if (!userId) {
      return { status: 401, jsonBody: { error: 'Not authenticated' } };
    }
    if (!content?.trim()) {
      return { status: 400, jsonBody: { error: 'Comment content required' } };
    }

    // Verify photo exists
    // const photosContainer = await getContainer(CONTAINERS.PHOTOS);
    // const { resource: photo } = await photosContainer.item(photoId, photoId).read();
    // if (!photoId) {
    //   return { status: 404, jsonBody: { error: 'Photo not found' } };
    // }

    const comment: Comment = {
      id: uuidv4(),
      photoId,
      userId,
      userName: userName || 'Anonymous',
      userRole,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    const commentsContainer = await getContainer(CONTAINERS.COMMENTS);
    await commentsContainer.items.create(comment);

    return { status: 201, jsonBody: comment };
  } catch (error) {
    context.error('Error creating comment:', error);
    return { status: 500, jsonBody: { error: 'Failed to create comment' } };
  }
}

app.http("create-comment", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: createComment,
});
