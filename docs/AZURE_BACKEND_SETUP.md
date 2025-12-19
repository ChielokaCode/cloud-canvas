# Azure Backend Setup Guide

This document provides instructions for deploying the backend services required by the Lumina photo-sharing app.

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   React App     │────▶│  Azure Front     │────▶│ Azure Functions │
│   (Lovable)     │     │     Door         │     │   (Backend)     │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                        ┌─────────────────────────────────┼─────────────────────────────────┐
                        │                                 │                                 │
                        ▼                                 ▼                                 ▼
               ┌─────────────────┐             ┌─────────────────┐             ┌─────────────────┐
               │  Azure Cosmos   │             │  Azure Blob     │             │  Azure Cache    │
               │      DB         │             │    Storage      │             │   for Redis     │
               └─────────────────┘             └─────────────────┘             └─────────────────┘
```

## Step 1: Create Azure Resources

### 1.1 Azure AD B2C Tenant
1. Go to Azure Portal → Create a resource → Azure Active Directory B2C
2. Create a new tenant or link an existing one
3. Register your application:
   - Go to App registrations → New registration
   - Name: "Lumina Photo App"
   - Redirect URI: Your Lovable preview URL (e.g., `https://your-project.lovable.app`)
   - Note down the **Application (client) ID**
4. Create user flows:
   - Go to User flows → New user flow
   - Select "Sign up and sign in"
   - Name it `B2C_1_signupsignin`
   - Select Email as identity provider
   - Add attributes: Display Name, Email

### 1.2 Azure Cosmos DB
```bash
# Create Cosmos DB account
az cosmosdb create \
  --name lumina-cosmos \
  --resource-group lumina-rg \
  --kind GlobalDocumentDB \
  --locations regionName=eastus

# Create database
az cosmosdb sql database create \
  --account-name lumina-cosmos \
  --resource-group lumina-rg \
  --name photoshare-db

# Create containers
az cosmosdb sql container create \
  --account-name lumina-cosmos \
  --database-name photoshare-db \
  --name photos \
  --partition-key-path /creatorId

az cosmosdb sql container create \
  --account-name lumina-cosmos \
  --database-name photoshare-db \
  --name users \
  --partition-key-path /id

az cosmosdb sql container create \
  --account-name lumina-cosmos \
  --database-name photoshare-db \
  --name comments \
  --partition-key-path /photoId
```

### 1.3 Azure Blob Storage
```bash
# Create storage account
az storage account create \
  --name luminaphotos \
  --resource-group lumina-rg \
  --sku Standard_LRS

# Create container for photos
az storage container create \
  --name photos \
  --account-name luminaphotos \
  --public-access blob
```

### 1.4 Azure Cache for Redis
```bash
az redis create \
  --name lumina-cache \
  --resource-group lumina-rg \
  --sku Basic \
  --vm-size c0
```

### 1.5 Azure Functions
```bash
# Create Function App
az functionapp create \
  --name lumina-api \
  --resource-group lumina-rg \
  --consumption-plan-location eastus \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4 \
  --storage-account luminaphotos
```

## Step 2: Deploy Azure Functions Backend

Create a new Azure Functions project with the following structure:

```
lumina-backend/
├── host.json
├── package.json
├── src/
│   ├── functions/
│   │   ├── photos.ts
│   │   ├── users.ts
│   │   ├── comments.ts
│   │   └── likes.ts
│   └── lib/
│       ├── cosmos.ts
│       ├── storage.ts
│       └── redis.ts
```

### Sample Function Code (photos.ts)

```typescript
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { BlobServiceClient } from "@azure/storage-blob";

const cosmosClient = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!);
const database = cosmosClient.database("photoshare-db");
const container = database.container("photos");

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.STORAGE_CONNECTION_STRING!
);
const containerClient = blobServiceClient.getContainerClient("photos");

// GET /api/photos
app.http("getPhotos", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "photos",
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const { resources: photos } = await container.items.readAll().fetchAll();
    return { jsonBody: photos };
  },
});

// POST /api/photos
app.http("uploadPhoto", {
  methods: ["POST"],
  authLevel: "function",
  route: "photos",
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const caption = formData.get("caption") as string;
    
    // Upload to Blob Storage
    const blobName = `${Date.now()}-${file.name}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const arrayBuffer = await file.arrayBuffer();
    await blockBlobClient.uploadData(Buffer.from(arrayBuffer));
    
    // Save metadata to Cosmos DB
    const photo = {
      id: blobName,
      url: blockBlobClient.url,
      title,
      caption,
      createdAt: new Date().toISOString(),
      likes: 0,
      likedBy: [],
      comments: [],
    };
    
    await container.items.create(photo);
    
    return { jsonBody: photo, status: 201 };
  },
});
```

## Step 3: Configure CORS

In your Azure Functions App, configure CORS to allow requests from your Lovable app:

```bash
az functionapp cors add \
  --name lumina-api \
  --resource-group lumina-rg \
  --allowed-origins "https://your-project.lovable.app"
```

## Step 4: Update Frontend Environment Variables

Update your `.env` file with the Azure resource credentials:

```env
VITE_AZURE_AD_B2C_TENANT=your-tenant.onmicrosoft.com
VITE_AZURE_AD_B2C_CLIENT_ID=your-client-id
VITE_AZURE_API_ENDPOINT=https://lumina-api.azurewebsites.net/api
VITE_AZURE_STORAGE_ACCOUNT=luminaphotos
```

## Step 5: Set Up Azure Front Door (Optional)

For production, configure Azure Front Door for:
- Global load balancing
- CDN caching for images
- WAF protection
- SSL termination

```bash
az afd profile create \
  --profile-name lumina-cdn \
  --resource-group lumina-rg \
  --sku Standard_AzureFrontDoor
```

## Security Considerations

1. **API Authentication**: Validate JWT tokens from Azure AD B2C in your Functions
2. **CORS**: Restrict to your app's domains only
3. **Role-Based Access**: Check user roles before allowing creator actions
4. **Storage Security**: Use SAS tokens with limited permissions and expiry
5. **Rate Limiting**: Implement rate limiting with Azure API Management

## Cost Optimization (Free Tier)

- Cosmos DB: 1000 RU/s free tier
- Azure Functions: 1M free executions/month
- Blob Storage: 5GB free for first 12 months
- Azure AD B2C: 50,000 MAU free
- Redis: Use Basic tier or implement caching in Functions
