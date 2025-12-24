import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { signupCreator, signupConsumer } from "./signup/index.js";
import { signin } from "./signin/index.js"; 
import { getPhoto, getPhotos, createPhoto, deletePhotoHandler } from "./photos/index.js";
import { getLikes, likePhoto, unlikePhoto, getPhotoLikes } from "./likes/index.js";
import { getComments, createComment, deleteComment } from "./comments/index.js";
import { get } from "http";

export async function httpTrigger(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log(`HTTP function processed request for url "${request.url}"`);

  const name = request.query.get("name") || (await request.text()) || "world";

  return {
    body: `Hello, ${name}!`,
  };
}

// Register the function with the Functions host
app.http("httpTrigger", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: httpTrigger,
});

// AUTH
app.http("signup-consumer", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: signupConsumer,
});

app.http("signup-creator", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: signupCreator,
});

app.http("signin", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: signin,
});

// PHOTOS
app.http("get-photos", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: getPhotos,
});

app.http("get-photo", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: getPhoto,
});

app.http("create-photo", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: createPhoto,
});

app.http("delete-photo", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  handler: deletePhotoHandler,
});

// LIKES
app.http("get-likes", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: getLikes,
});

app.http("like-photo", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: likePhoto,
});

app.http("unlike-photo", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: unlikePhoto,
});

app.http("get-user-liked-photos", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: getPhotoLikes,
});


// COMMENTS
app.http("get-comments", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: getComments,
});

app.http("create-comment", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: createComment,
});

app.http("delete-comment", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  handler: deleteComment,
});