const {Genre} = require("../../models/genre");
const {Movie} = require("../../models/movie");
const {User} = require("../../models/user");
const mongoose = require("mongoose");
const request = require("supertest");

describe("/api/movies/", () => {
  beforeEach(() => {
    server = require("../../index");
  });

  afterEach(async () => {
    await Movie.remove({});
    await Genre.remove({});

    server.close();
  });

  describe("GET /", () => {
    it("Should return all movies.", async () => {
      const genre = new Genre({
        name: "genre1",
      });
      await genre.save();

      await Movie.collection.insertOne({
        title: "movie1",
        genre: {
          _id: genre._id,
          name: genre.name,
        },
        numberInStock: 2,
        dailyRentalRate: 5,
      });

      const res = await request(server).get("/api/movies");

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);

      expect(res.body.some((c) => c.title == "movie1")).toBeTruthy();
      expect(res.body.some((c) => c.genre.name == "genre1")).toBeTruthy();
      expect(res.body.some((c) => c.numberInStock == 2)).toBeTruthy();
      expect(res.body.some((c) => c.dailyRentalRate == 5)).toBeTruthy();
    });
  });

  describe("GET /:id", () => {
    it("Should return movie if valid id is given.", async () => {
      const genre = new Genre({
        name: "genre1",
      });

      await genre.save();

      const movie = new Movie({
        title: "movie1",
        genre: {
          _id: genre._id,
          name: genre.name,
        },
        numberInStock: 2,
        dailyRentalRate: 5,
      });

      await movie.save();

      const res = await request(server).get("/api/movies/" + movie._id);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("title", movie.title);
      expect(res.body).toHaveProperty("genre._id", genre._id.toHexString());
      expect(res.body).toHaveProperty("genre.name", genre.name);
      expect(res.body).toHaveProperty("numberInStock", movie.numberInStock);
      expect(res.body).toHaveProperty("dailyRentalRate", movie.dailyRentalRate);
    });

    it("Should return 404 if invalid id is given.", async () => {
      const res = await request(server).get("/api/movies/1");

      expect(res.status).toBe(404);
    });

    it("Should return 404 if id does not exist.", async () => {
      const id = mongoose.Types.ObjectId();

      const res = await request(server).get("/api/movies/" + id);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /", () => {
    let token;
    let title;
    let genreId;

    const exec = async () => {
      return await request(server)
          .post("/api/movies/")
          .set("x-auth-token", token)
          .send({
            title,
            genreId,
            numberInStock,
            dailyRentalRate,
          });
    };

    beforeEach(async () => {
      const genre = new Genre({
        name: "genre1",
      });
      await genre.save();

      token = new User().generateAuthToken();

      title = "movie1";
      numberInStock = 2;
      dailyRentalRate = 5;
      genreId = genre._id;
    });

    it("Should return 401 if client is not logged in.", async () => {
      token = "";

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it("Should return 400 if title is less than 5 characters.", async () => {
      title = "test";

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("Should return 400 if title is more than 50 characters.", async () => {
      title = new Array(52).join("x");

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("Should return 400 if the given genreId is invalid.", async () => {
      genreId = 1;

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("Should return 400 if the given genreId does not exist.", async () => {
      genreId = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("Should save a movie if title is valid.", async () => {
      await exec();

      const movie = await Movie.find({
        title: "movie1",
      });

      expect(movie).not.toBeNull();
    });

    it("Should return a movie if input is valid.", async () => {
      const res = await exec();

      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("genre._id");
      expect(res.body).toHaveProperty("genre.name");
      expect(res.body).toHaveProperty("title", "movie1");
      expect(res.body).toHaveProperty("numberInStock", 2);
      expect(res.body).toHaveProperty("dailyRentalRate", 5);
    });
  });

  describe(" PUT /:id", () => {
    let token,
      id,
      movie,
      newTitle,
      updatedGenre,
      newGenreId,
      newGenreName,
      newNumberInStock,
      newDailyRentalRate;

    const exec = async () => {
      return await request(server)
          .put("/api/movies/" + id)
          .set("x-auth-token", token)
          .send({
            title: newTitle,
            genreId: newGenreId,
            numberInStock: newNumberInStock,
            dailyRentalRate: newDailyRentalRate,
          });
    };

    beforeEach(async () => {
      token = new User().generateAuthToken();

      const genre = new Genre({
        name: "genre1"
      });
      await genre.save();

      movie = new Movie({
        title: "movie1",
        genre: {
          _id: genre._id,
          name: genre.name,
        },
        numberInStock: 10,
        dailyRentalRate: 6,
      });
      await movie.save();

      updatedGenre = new Genre({
        name: "genre2"
      });
      await updatedGenre.save();

      id = movie._id;
      newTitle = "updatedTitle";
      newGenreId = updatedGenre._id;
      newGenreName = updatedGenre.name;
      newNumberInStock = 5;
      newDailyRentalRate = 8;
    });

    it("Should return 401 if client is not logged in.", async () => {
      token = "";

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it("Should return 400 if title is less than 5 characters.", async () => {
      newTitle = "1234";

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("Should return 400 if title is more than 50 characters.", async () => {
      newTitle = new Array(52).join("x");

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("Should return 404 if movie ID is invalid.", async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it("Should return 404 if movie ID does not found.", async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it("Should return 400 if the given genreId is invalid.", async () => {
      newGenreId = 1;

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("Should return 400 if the given genreId does not exist.", async () => {
      newGenreId = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("Should update the movie if input is valid.", async () => {
      await exec();

      const updatedMovie = await Movie.findById(movie._id);

      expect(updatedMovie.title).toBe(newTitle);
    });

    it("Should return the updated movie if it is valid.", async () => {
      const res = await exec();

      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("title", newTitle);
      expect(res.body).toHaveProperty("genre._id", newGenreId.toHexString());
      expect(res.body).toHaveProperty("genre.name", newGenreName);
      expect(res.body).toHaveProperty("numberInStock", newNumberInStock);
      expect(res.body).toHaveProperty("dailyRentalRate", newDailyRentalRate);
    });
  });

  describe(" DELETE /:id", () => {
    let id,
      token,
      movie,
      genre;

    const exec = async () => {
      return await request(server)
          .delete("/api/movies/" + id)
          .set("x-auth-token", token)
          .send();
    };

    beforeEach(async () => {
      token = new User({
        isAdmin: true
      }).generateAuthToken();

      genre = new Genre({
        name: "genre1"
      });
      await genre.save();

      movie = new Movie({
        title: "movie1",
        genre: {
          _id: genre._id,
          name: genre.name,
        },
        numberInStock: 10,
        dailyRentalRate: 6,
      });
      await movie.save();

      id = movie._id;
    });

    it("Should return 401 if client is not logged in.", async () => {
      token = "";

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it("Should return 403 if client is not admin", async () => {
      token = new User({
        isAdmin: false
      }).generateAuthToken();

      const res = await exec();

      expect(res.status).toBe(403);
    });

    it("Should return 404 if movie ID is invalid.", async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it("Should return 404 if movie ID does not found.", async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it("Should remove movie if input is valid.", async () => {
      await exec();

      const deletedMovie = await Movie.findById(movie._id);

      expect(deletedMovie).toBeNull();
    });

    it("Should return removed movie.", async () => {
      const res = await exec();

      expect(res.body).toHaveProperty("_id", movie._id.toHexString());
      expect(res.body).toHaveProperty("title", movie.title);
      expect(res.body).toHaveProperty("genre._id", genre._id.toHexString());
      expect(res.body).toHaveProperty("genre.name", genre.name);
      expect(res.body).toHaveProperty("numberInStock", movie.numberInStock);
      expect(res.body).toHaveProperty("dailyRentalRate", movie.dailyRentalRate);
    });
  });
});
