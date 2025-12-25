import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getContainer, CONTAINERS } from '../lib/cosmos';
import { uploadPhoto, deletePhoto } from '../lib/storage';
import { getUserFromJwtToken } from '../lib/auth';
import { cacheGet, cacheSet, cacheDelete, bumpPhotosCacheVersion, getPhotosCacheVersion, CACHE_KEYS } from '../lib/redis';
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

    let user;
try {
  user = getUserFromJwtToken(authHeader);
} catch (err) {
  return { status: 401, jsonBody: { error: "Invalid or missing token" } };
}
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

app.http("create-photo", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: createPhoto,
});