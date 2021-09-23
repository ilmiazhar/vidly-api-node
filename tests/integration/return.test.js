const { Rental } = require("../../models/rental");
const { User } = require("../../models/user");
const { Movie } = require("../../models/movie");
const request = require("supertest");
const mongoose = require("mongoose");
const moment = require("moment");

describe("/api/returns", () => {
  let server;
  let rental;
  let token;
  let customerId;
  let movieId;
  let movie;

  const exec = () => {
    return request(server)
      .post("/api/returns")
      .set("x-auth-token", token)
      .send({
        customerId,
        movieId,
      });
  };

  beforeEach(async () => {
    server = require("../../index");

    token = new User().generateAuthToken();

    movieId = mongoose.Types.ObjectId();
    customerId = mongoose.Types.ObjectId();

    movie = new Movie({
      _id: movieId,
      title: "movie1",
      genre: {
        name: "genre1",
      },
      numberInStock: 10,
      dailyRentalRate: 2,
    });

    await movie.save();

    rental = new Rental({
      customer: {
        _id: customerId,
        name: "customer1",
        phone: "12345",
      },
      movie: {
        _id: movieId,
        title: "movie1",
        dailyRentalRate: 2,
      },
    });

    await rental.save();
  });

  afterEach(async () => {
    server.close();

    await Rental.remove({});
    await Movie.remove({});
  });

  it("Should return 401 if client is not logged in.", async () => {
    token = "";

    const res = await exec();

    expect(res.status).toBe(401);
  });

  it("Should return 400 if customerId is not provided.", async () => {
    customerId = "";

    const res = await exec();

    expect(res.status).toBe(400);
  });

  it("Should return 400 if movieId is not provided.", async () => {
    movieId = "";

    const res = await exec();

    expect(res.status).toBe(400);
  });

  it("Should return 404 if no rental found for current customer/movie ID.", async () => {
    await Rental.remove({});

    const res = await exec();

    expect(res.status).toBe(404);
  });

  it("Should return 400 if rental already processed / returned.", async () => {
    rental.dateReturned = new Date();
    await rental.save();

    const res = await exec();

    expect(res.status).toBe(400);
  });

  it("Should return 200 if rental is valid.", async () => {
    const res = await exec();

    expect(res.status).toBe(200);
  });

  it("Should set the return date if input is valid.", async () => {
    await exec();

    const rentalInDB = await Rental.findById(rental._id);
    const timeDiff = new Date() - rentalInDB.dateReturned;

    expect(timeDiff).toBeLessThan(10 * 1000);
  });

  it("Should calculate the rental cost.", async () => {
    rental.dateOut = moment().add(-7, "days").toDate();
    await rental.save();

    await exec();

    const rentalInDB = await Rental.findById(rental._id);

    expect(rentalInDB.rentalCost).toBe(14);
  });

  it("Should increase the movie stock.", async () => {
    await exec();

    const movieInDB = await Movie.findById(movieId);

    expect(movieInDB.numberInStock).toBe(movie.numberInStock + 1);
  });

  it("Should return the rental if input is valid.", async () => {
    const res = await exec();

    await Rental.findById(rental._id);

    expect(Object.keys(res.body)).toEqual(
      expect.arrayContaining([
        "dateOut",
        "dateReturned",
        "rentalCost",
        "customer",
        "movie",
      ])
    );
  });
});
