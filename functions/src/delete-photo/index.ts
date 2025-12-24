import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getContainer, CONTAINERS } from '../lib/cosmos';
import { uploadPhoto, deletePhoto } from '../lib/storage';
import { getUserFromJwtToken } from '../lib/auth';
import { cacheGet, cacheSet, cacheDelete, bumpPhotosCacheVersion, getPhotosCacheVersion, cacheInvalidatePattern, CACHE_KEYS } from '../lib/redis';
import { v4 as uuidv4 } from 'uuid';
import { File } from 'undici';


interface Photo {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorRole: string;
  imageUrl: string;
  title: string;
  caption: string;
  location?: string;
  people?: string[];
  likes: number;
  createdAt: string;
}


// DELETE /api/photos/:id - Delete photo (Creator only, own photos)
export async function deletePhotoHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const id = request.params.id;
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!id) {
      return { status: 400, jsonBody: { error: 'Photo ID required' } };
    }

    const container = await getContainer(CONTAINERS.PHOTOS);
    const { resource: photo } = await container.item(id, id).read();

    if (!photo) {
      return { status: 404, jsonBody: { error: 'Photo not found' } };
    }

    if (photo.creatorId !== userId && userRole !== 'admin') {
      return { status: 403, jsonBody: { error: 'Not authorized to delete this photo' } };
    }

    // Delete from storage and database
    const fileName = photo.imageUrl.split('/').pop();
    if (fileName) {
      await deletePhoto(fileName);
    }
    await container.item(id, id).delete();

    // 🔥 Proper cache cleanup
    await cacheDelete(CACHE_KEYS.photo(id));
    await bumpPhotosCacheVersion();

    return { status: 204 };
  } catch (error) {
    context.error('Error deleting photo:', error);
    return { status: 500, jsonBody: { error: 'Failed to delete photo' } };
  }
}

app.http("delete-photo", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  handler: deletePhotoHandler,
});