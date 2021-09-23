const { Customer } = require("../../models/customer");
const { User } = require("../../models/user");
const mongoose = require("mongoose");
const request = require("supertest");

describe("/api/customers", () => {
  beforeEach(() => {
    server = require("../../index");
  });

  afterEach(async () => {
    await Customer.remove({});
    server.close();
  });

  describe("GET /", () => {
    it("Should return all customers", async () => {
      await Customer.collection.insertOne({
        name: "customer1",
        phone: "12345",
      });

      const res = await request(server).get("/api/customers");

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);

      expect(res.body.some((c) => c.name == "customer1")).toBeTruthy();
      expect(res.body.some((c) => c.phone == "12345")).toBeTruthy();
    });
  });

  describe("GET /:id", () => {
    it("Should return customer if valid id is given.", async () => {
      const customer = new Customer({
        name: "customer1",
        phone: "12345",
      });

      await customer.save();

      const res = await request(server).get("/api/customers/" + customer._id);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("name", customer.name);
      expect(res.body).toHaveProperty("phone", customer.phone);
    });

    it("Should return 404 if invalid id is given.", async () => {
      const res = await request(server).get("/api/customers/1");

      expect(res.status).toBe(404);
    });

    it("Should return 404 if id does not exist.", async () => {
      const id = mongoose.Types.ObjectId();

      const res = await request(server).get("/api/customers/" + id);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /", () => {
    let token;
    let name;

    const exec = async () => {
      return await request(server)
        .post("/api/customers/")
        .set("x-auth-token", token)
        .send({ name, phone });
    };

    beforeEach(() => {
      token = new User().generateAuthToken();
      name = "customer1";
      phone = "12345";
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

    it("Should save the customer if customer name is valid.", async () => {
      await exec();

      const customer = await Customer.find({ name: "customer1" });

      expect(customer).not.toBeNull();
    });

    it("Should return a customer if it is valid", async () => {
      const res = await exec();

      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("name", "customer1");
      expect(res.body).toHaveProperty("phone", "12345");
    });
  });

  describe(" PUT /:id", () => {
    let token;
    let newName;
    let customer;
    let id;

    const exec = async () => {
      return await request(server)
        .put("/api/customers/" + id)
        .set("x-auth-token", token)
        .send({ name: newName, phone: newPhone });
    };

    beforeEach(async () => {
      customer = new Customer({ name: "customer1", phone: "12345" });
      await customer.save();

      token = new User().generateAuthToken();

      id = customer._id;

      newName = "updatedName";
      newPhone = "54321";
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

    it("Should update the customer if input is valid.", async () => {
      await exec();

      const updatedCustomer = await Customer.findById(customer._id);

      expect(updatedCustomer.name).toBe(newName);
    });

    it("Should return the updated customer if it is valid.", async () => {
      const res = await exec();

      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("name", newName);
      expect(res.body).toHaveProperty("phone", newPhone);
    });
  });

  describe(" DELETE /:id", () => {
    let customer;
    let token;
    let id;

    const exec = async () => {
      return await request(server)
        .delete("/api/customers/" + id)
        .set("x-auth-token", token)
        .send();
    };

    beforeEach(async () => {
      customer = new Customer({ name: "customer1", phone: "12345" });
      await customer.save();

      token = new User({ isAdmin: true }).generateAuthToken();
      id = customer._id;
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

    it("Should remove customer if input is valid.", async () => {
      await exec();

      const deletedCustomer = await Customer.findById(id);

      expect(deletedCustomer).toBeNull();
    });

    it("Should return removed customer.", async () => {
      const res = await exec();

      expect(res.body).toHaveProperty("_id", customer._id.toHexString());
      expect(res.body).toHaveProperty("name", customer.name);
      expect(res.body).toHaveProperty("phone", customer.phone);
    });
  });
});
