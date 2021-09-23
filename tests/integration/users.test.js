const {User} = require("../../models/user");
const mongoose = require("mongoose");
const request = require("supertest");

describe("/api/users", () => {
  beforeEach(() => {
    server = require("../../index");
  });

  afterEach(async () => {
    await User.remove({});

    server.close();
  });

  describe("GET /", () => {
    it("Should return all users", async () => {
      const user = new User({
        name: "user1",
        email: "user1@gmail.com",
        password: "123456"
      });

      await user.save();

      const res = await request(server).get("/api/users");

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);

      expect(res.body.some((c) => c.name == "user1")).toBeTruthy();
      expect(res.body.some((c) => c.email == "user1@gmail.com")).toBeTruthy();
    // expect(res.body.some((c) => c.password == 2)).toBeTruthy();
    })
  });
});