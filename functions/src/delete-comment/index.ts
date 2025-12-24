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

// DELETE /api/comments/:id - Delete a comment (own comments only)
export async function deleteComment(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const commentId = request.params.id;
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!commentId) {
      return { status: 400, jsonBody: { error: 'Comment ID required' } };
    }

    if (!userId) {
      return { status: 401, jsonBody: { error: 'Not authenticated' } };
    }

    const container = await getContainer(CONTAINERS.COMMENTS);
    
    // Find the comment
    const { resources: comments } = await container.items
      .query({
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: commentId }],
      })
      .fetchAll();

    if (comments.length === 0) {
      return { status: 404, jsonBody: { error: 'Comment not found' } };
    }

    const comment = comments[0];

    // Check authorization
    if (comment.userId !== userId && userRole !== 'admin') {
      return { status: 403, jsonBody: { error: 'Not authorized to delete this comment' } };
    }

    await container.item(commentId, comment.photoId).delete();

    // Invalidate cache
    // await cacheDelete(CACHE_KEYS.photoComments(comment.photoId));

    return { status: 204 };
  } catch (error) {
    context.error('Error deleting comment:', error);
    return { status: 500, jsonBody: { error: 'Failed to delete comment' } };
  }
}


app.http("delete-comment", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  handler: deleteComment,
});