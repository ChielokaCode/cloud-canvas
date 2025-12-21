import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getContainer, CONTAINERS } from '../lib/cosmos';
// import { cacheGet, cacheSet, cacheDelete, CACHE_KEYS } from '../lib/redis';
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
