const { User } = require("../../../models/user");
const config = require("config");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

describe("user.generateAuthToken", () => {
  it("should return a valid JSON webtoken", () => {
    const payload = {
      _id: new mongoose.Types.ObjectId().toHexString(),
      isAdmin: true,
    };

    const user = new User(payload);
    const token = user.generateAuthToken();
    const decoded = jwt.verify(token, config.get("jwtPrivateKey"));

    expect(decoded).toMatchObject(payload);
  });
});
