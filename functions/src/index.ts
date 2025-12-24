import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import './create-comment/index'
import './delete-comment/index'
import './get-comments/index'

import './create-photo/index'
import './get-photos/index'
import './get-photo/index'
import './delete-photo/index'

import './get-user-liked-photos/index'
import './get-likes/index'
import './like-photo/index'
import './unlike-photo/index'

import './signup-creator/index'
import './signup-consumer/index'
import { signin } from "./signin/index";





// A simple ping function to test the setup
export async function getPing(
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
app.http("getPing", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: getPing,
});

app.http("signin", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: signin,
});