const { Genre } = require("../../models/genre");
const { User } = require("../../models/user");
const request = require("supertest");

let server;

describe("Auth middleware", () => {
  beforeEach(() => {
    server = require("../../index");
    token = new User().generateAuthToken();
  });

  afterEach(async () => {
    await Genre.remove({});
    server.close();
  });

  let token;

  const exec = () => {
    return request(server)
      .post("/api/genres/")
      .set("x-auth-token", token)
      .send({ name: "genre2" });
  };

  it("Should return 401 if no token is provided.", async () => {
    token = "";

    const res = await exec();
    expect(res.status).toBe(401);
  });

  it("Should return 400 if token is invalid.", async () => {
    token = "a";

    const res = await exec();
    expect(res.status).toBe(400);   
  });

  it("Should return 200 if token is valid.", async () => {
    const res = await exec();
    expect(res.status).toBe(200);
  });
});
