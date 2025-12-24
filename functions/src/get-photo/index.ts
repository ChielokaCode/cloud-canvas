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

app.http("get-photo", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: getPhoto,
});
