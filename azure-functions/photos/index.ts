import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
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



// GET /api/photos - List all photos
// export async function getPhotos(
//   request: HttpRequest,
//   context: InvocationContext
// ): Promise<HttpResponseInit> {
//   try {
//     const page = parseInt(request.query.get('page') || '1');
//     const limit = parseInt(request.query.get('limit') || '20');
//     const offset = (page - 1) * limit;

//     // Check cache first
//     // const cacheKey = CACHE_KEYS.photos(page);
//     // const cached = await cacheGet<Photo[]>(cacheKey);
//     // if (cached) {
//     //   return { status: 200, jsonBody: cached };
//     // }

//     const container = await getContainer(CONTAINERS.PHOTOS);
//     const { resources: photos } = await container.items
//       .query({
//         query: 'SELECT * FROM c ORDER BY c.createdAt DESC OFFSET @offset LIMIT @limit',
//         parameters: [
//           { name: '@offset', value: offset },
//           { name: '@limit', value: limit },
//         ],
//       })
//       .fetchAll();

//     // Cache results
//     // await cacheSet(cacheKey, photos, 60);

//     return { status: 200, jsonBody: photos };
//   } catch (error) {
//     context.error('Error fetching photos:', error);
//     return { status: 500, jsonBody: { error: 'Failed to fetch photos' } };
//   }
// }


export async function getPhotos(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const page = parseInt(request.query.get("page") || "1", 10);
    const limitParam = request.query.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    const version = await getPhotosCacheVersion();
    const cacheKey = CACHE_KEYS.photos(version, page, limit);

    const cached = await cacheGet<Photo[]>(cacheKey);
    if (cached) {
      context.log("Returning cached photos list");
      return { status: 200, jsonBody: cached };
    }

    let query = "SELECT * FROM c ORDER BY c.createdAt DESC";
    const parameters: { name: string; value: number }[] = [];

    if (limit > 0) {
      const offset = (page - 1) * limit;
      query += " OFFSET @offset LIMIT @limit";
      parameters.push({ name: "@offset", value: offset });
      parameters.push({ name: "@limit", value: limit });
    }

    const container = await getContainer(CONTAINERS.PHOTOS);
    const { resources: photos } = await container.items
      .query({ query, parameters })
      .fetchAll();

    context.log(`Fetched ${photos.length} photos (page: ${page}, limit: ${limit})`);

    await cacheSet(cacheKey, photos, 60);
    return { status: 200, jsonBody: photos as Photo[] };
  } catch (error) {
    context.error("Error fetching photos:", error);
    return { status: 500, jsonBody: { error: "Failed to fetch photos" } };
  }
}


// GET /api/photos/:id - Get single photo
// export async function getPhoto(
//   request: HttpRequest,
//   context: InvocationContext
// ): Promise<HttpResponseInit> {
//   try {
//     const id = request.params.id;
//     if (!id) {
//       return { status: 400, jsonBody: { error: 'Photo ID required' } };
//     }

//     // Check cache first
//     const cacheKey = CACHE_KEYS.photo(id);
//     const cached = await cacheGet<Photo>(cacheKey);
//     if (cached) {
//       return { status: 200, jsonBody: cached };
//     }

//     const container = await getContainer(CONTAINERS.PHOTOS);
//     const { resource: photo } = await container.item(id, id).read();

//     if (!photo) {
//       return { status: 404, jsonBody: { error: 'Photo not found' } };
//     }

//     // Cache result
//     await cacheSet(cacheKey, photo, 300);

//     return { status: 200, jsonBody: photo };
//   } catch (error) {
//     context.error('Error fetching photo:', error);
//     return { status: 500, jsonBody: { error: 'Failed to fetch photo' } };
//   }
// }

export async function getPhoto(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const id = request.params.id;
    if (!id) {
      context.log("Photo ID not provided");
      return { status: 400, jsonBody: { error: "Photo ID required" } };
    }

    const cacheKey = CACHE_KEYS.photo(id);
    const cached = await cacheGet<Photo>(cacheKey);
    if (cached) {
      context.log(`Returning cached photo ${id}`);
      return { status: 200, jsonBody: cached };
    }

    const container = await getContainer(CONTAINERS.PHOTOS);
    const { resource: photo } = await container.item(id, id).read();

    if (!photo) {
      context.log(`Photo not found: ${id}`);
      return { status: 404, jsonBody: { error: "Photo not found" } };
    }


    await cacheSet(cacheKey, photo, 300);
    context.log(`Fetched photo ${id} from database and cached`);

    return { status: 200, jsonBody: photo };
  } catch (error) {
    context.error(`Error fetching photo ${request.params.id}:`, error);
    return { status: 500, jsonBody: { error: "Failed to fetch photo" } };
  }
}

// POST /api/photos - Upload new photo (Creator only)
export async function createPhoto(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // Get user from auth header (validated by middleware)
    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name');
    const userRole = request.headers.get('x-user-role');

    const authHeader = request.headers.get('authorization');
  const user = getUserFromJwtToken(authHeader);
  context.log("User", user?.role)

    if (userRole !== 'creator') {
      return { status: 403, jsonBody: { error: 'Only creators can upload photos' } };
    }

    const formData = await request.formData();

const file = formData.get("file");

if (!file || typeof file !== "object") {
  return {
    status: 400,
    jsonBody: { error: "File is required" },
  };
}

    const title = formData.get('title') as string;
    const caption = formData.get('caption') as string;
    const location = formData.get('location') as string;
    const people = formData.get('people') as string;

    if (!file || !title) {
      return { status: 400, jsonBody: { error: 'Image and title are required' } };
    }

    // Upload to blob storage
    const photoId = uuidv4();
    const fileName = `${photoId}-${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const imageUrl = await uploadPhoto(fileName, buffer, file.type);

    // Save metadata to Cosmos DB
    const photo: Photo = {
      id: photoId,
      creatorId: userId!,
      creatorName: userName!,
      creatorRole: userRole!,
      imageUrl,
      title,
      caption,
      location: location || undefined,
      people: people ? people.split(',').map((p) => p.trim()) : undefined,
      likes: 0,
      createdAt: new Date().toISOString(),
    };

    const container = await getContainer(CONTAINERS.PHOTOS);
    await container.items.create(photo);

    // 🔥 Safe cache invalidation
    await bumpPhotosCacheVersion();

    return { status: 201, jsonBody: photo };
  } catch (error) {
    context.error('Error creating photo:', error);
    return { status: 500, jsonBody: { error: 'Failed to create photo' } };
  }
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
