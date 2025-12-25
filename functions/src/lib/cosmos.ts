// import { CosmosClient, Database, Container } from '@azure/cosmos';

// const endpoint = process.env.AZURE_COSMOS_ENDPOINT || '';
// const key = process.env.AZURE_COSMOS_KEY || '';
// const databaseId = process.env.AZURE_COSMOS_DATABASE || 'photoshare-db';

// let client: CosmosClient | null = null;
// let database: Database | null = null;

// export const getCosmosClient = (): CosmosClient => {
//   if (!client) {
//     client = new CosmosClient({ endpoint, key });
//   }
//   return client;
// };

// export const getDatabase = async (): Promise<Database> => {
//   if (!database) {
//     const client = getCosmosClient();
//     const { database: db } = await client.databases.createIfNotExists({ id: databaseId });
//     database = db;
//   }
//   return database;
// };

// export const getContainer = async (containerId: string): Promise<Container> => {
//   const db = await getDatabase();
//   const { container } = await db.containers.createIfNotExists({ id: containerId });
//   return container;
// };

// // Container IDs
// export const CONTAINERS = {
//   USERS: 'users',
//   PHOTOS: 'photos',
//   COMMENTS: 'comments',
//   LIKES: 'likes',
// } as const;


import { CosmosClient, Database, Container } from "@azure/cosmos";

let client: CosmosClient | null = null;
let database: Database | null = null;

function getConfig() {
  const endpoint = process.env.AZURE_COSMOS_ENDPOINT;
  const key = process.env.AZURE_COSMOS_KEY;
  const databaseId = process.env.AZURE_COSMOS_DATABASE;

  if (!endpoint || !key || !databaseId) {
    throw new Error("Missing Cosmos DB environment variables");
  }

  return { endpoint, key, databaseId };
}

export const getCosmosClient = (): CosmosClient => {
  if (!client) {
    const { endpoint, key } = getConfig();
    client = new CosmosClient({ endpoint, key });
  }
  return client;
};

export const getDatabase = async (): Promise<Database> => {
  if (!database) {
    const { databaseId } = getConfig();
    const client = getCosmosClient();
    const { database: db } = await client.databases.createIfNotExists({
      id: databaseId,
    });
    database = db;
  }
  return database;
};

export const getContainer = async (containerId: string): Promise<Container> => {
  const db = await getDatabase();
  const { container } = await db.containers.createIfNotExists({
    id: containerId,
  });
  return container;
};

export const CONTAINERS = {
  USERS: "users",
  PHOTOS: "photos",
  COMMENTS: "comments",
  LIKES: "likes",
} as const;
