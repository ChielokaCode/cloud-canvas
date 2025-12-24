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

app.http("get-photos", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: getPhotos,
});
