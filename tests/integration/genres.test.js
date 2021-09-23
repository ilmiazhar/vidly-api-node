const { Genre } = require("../../models/genre");
const { User } = require("../../models/user");
const request = require("supertest");
const mongoose = require("mongoose");

describe("/api/genres/", () => {
  beforeEach(() => {
    server = require("../../index");
  });

  afterEach(async () => {
    server.close();
    await Genre.remove({});
  });

  describe("GET /", () => {
    it("Should return all genres.", async () => {
      await Genre.collection.insertMany([
        { name: "genre1" },
        { name: "genre2" },
      ]);

      const res = await request(server).get("/api/genres");

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);

      expect(res.body.some((g) => g.name === "genre1")).toBeTruthy();
      expect(res.body.some((g) => g.name === "genre2")).toBeTruthy();
    });
  });

  describe("GET /:id", () => {

    it("Should return a genre if a valid ID is given.", async () => {
      const genre = new Genre({
        name: "genre1",
      });
      await genre.save();

      const res = await request(server).get("/api/genres/" + genre._id);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("name", genre.name);
    });

    it("Should return 404 error if invalid ID is given.", async () => {
      const res = await request(server).get("/api/genres/1");

      expect(res.status).toBe(404);
    });

    it("Should return 404 error if the given ID does not exist.", async () => {
      const id = mongoose.Types.ObjectId();
      const res = await request(server).get("/api/genres/" + id);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /", () => {
    let token;
    let name;

    const exec = async () => {
      return await request(server)
        .post("/api/genres/")
        .set("x-auth-token", token)
        .send({ name });
    };

    beforeEach(() => {
      token = new User().generateAuthToken();
      name = "genre1";
    });

    it("Should return 401 if client is not logged in.", async () => {
      token = "";

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it("Should return 400 if name is less than 5 characters.", async () => {
      name = "1234";

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("Should return 400 if name is more than 50 characters.", async () => {
      name = new Array(52).join("x");

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("Should save the genre if genre name is valid.", async () => {
      await exec();

      const genre = await Genre.find({ name: "genre1" });

      expect(genre).not.toBeNull();
    });

    it("Should return a genre if it is valid", async () => {
      const res = await exec();

      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("name", "genre1");
    });
  });

  describe(" PUT /:id", () => {
    let token;
    let newName;
    let genre;
    let id;

    // Initiate the execution pattern
    const exec = async () => {
      return await request(server)
        .put("/api/genres/" + id)
        .set("x-auth-token", token)
        .send({ name: newName });
    };

    beforeEach(async () => {
      genre = new Genre({ name: "genre3" });
      await genre.save();

      token = new User().generateAuthToken();
      id = genre._id;
      newName = "updatedName";
    });

    it("Should return 401 if client is not logged in.", async () => {
      token = "";

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it("Should return 400 if name is less than 5 characters.", async () => {
      newName = "1234";

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("Should return 400 if name is more than 50 characters.", async () => {
      newName = new Array(52).join("x");

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("Should return 404 if ID is invalid.", async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it("Should return 404 if ID does not found.", async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it("Should update the genre if input is valid.", async () => {
      await exec();

      const updatedGenre = await Genre.findById(genre._id);

      expect(updatedGenre.name).toBe(newName);
    });

    it("Should return the updated genre if it is valid.", async () => {
      const res = await exec();

      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("name", newName);
    });
  });

  describe(" DELETE /:id", () => {
    let genre;
    let token;
    let id;

    const exec = async () => {
      return await request(server)
        .delete("/api/genres/" + id)
        .set("x-auth-token", token)
        .send();
    };

    beforeEach(async () => {
      genre = new Genre({ name: "genre3" });
      await genre.save();

      token = new User({ isAdmin: true }).generateAuthToken();
      id = genre._id;
    });

    it("Should return 401 if client is not logged in.", async () => {
      token = "";

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it("Should return 403 if user is not admin.", async () => {
      token = new User({ isAdmin: false }).generateAuthToken();

      const res = await exec();

      expect(res.status).toBe(403);
    });

    it("Should return 404 if ID is invalid.", async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it("Should return 404 if ID does not exist.", async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it("Should delete the genre if input is valid.", async () => {
      await exec();

      const deletedGenre = await Genre.findById(id);

      expect(deletedGenre).toBeNull();
    });

    it("Should return the removed genre.", async () => {
      const res = await exec();

      expect(res.body).toHaveProperty("_id", genre._id.toHexString());
      expect(res.body).toHaveProperty("name", genre.name);
    });
  });
});
