'use strict'
const chai = require("chai");
const chaiHttp = require("chai-http");

const { app, runServer, closeServer } = require("../server");

// this lets us use *expect* style syntax in our tests
// so we can do things like `expect(1 + 1).to.equal(2);`
// http://chaijs.com/api/bdd/
const expect = chai.expect;

// This let's us make HTTP requests
// in our tests.
// see: https://github.com/chaijs/chai-http
chai.use(chaiHttp);

describe("Recipe List", function () {
  // Before our tests run, we activate the server. Our `runServer`
  // function returns a promise, and we return the that promise by
  // doing `return runServer`. If we didn't return a promise here,
  // there's a possibility of a race condition where our tests start
  // running before our server has started.
  before(function () {
    return runServer();
  });

  // although we only have one test module at the moment, we'll
  // close our server at the end of these tests. Otherwise,
  // if we add another test module that also has a `before` block
  // that starts our server, it will cause an error because the
  // server would still be running from the previous tests.
  after(function () {
    return closeServer();
  });

  it('should list all recipes on GET', function () {
    return chai
      .request(app)
      .get('/recipes')
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.a('array');

        expect(res.body.length).to.be.at.least(1);

        const expectedKeys = ['id', 'name', 'ingredients'];
        res.body.forEach(recipe => {
          expect(recipe).to.be.a('object');
          expect(recipe).to.include.keys(expectedKeys);
        });
      });
  });

  it('should add a recipe on POST', function () {
    const newItem = { name: 'bread', ingredients: ['flour', 'eggs', 'water'] };
    return chai
      .request(app)
      .post('/recipes')
      .send(newItem)
      .then(function (res) {
        expect(res).to.have.status(201);
        expect(res).to.be.json;
        expect(res.body).to.be.a('object');
        expect(res.body).to.include.keys('id', 'name', 'ingredients');
        expect(res.body.id).to.not.eq(null);
        expect(res.body).to.deep.eq(Object.assign(newItem, { id: res.body.id }));
      });
  });

  it('should update recipe on PUT', function () {
    const updateData = {name: 'foo', ingredients: ['bar', 'bizz', 'bang']};
    return (
      chai
        .request(app)
        .get('/recipes')
        .then(function (res) {
          updateData.id = res.body[0].id;
          return chai
            .request(app)
            .put(`/recipes/${updateData.id}`)
            .send(updateData);
        })
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res).to.have.header('content-type', 'application/json; charset=utf-8');
          expect(res.body).to.be.a('object');
          expect(res.body).to.deep.equal(updateData);
        })
    );
  });

  it('should delete items on DELETE', function () {
    return (
      chai
        .request(app)
        .get('/recipes')
        .then(function (res) {
          return chai.request(app)
            .delete(`/recipes/${res.body[0].id}`)
        })
        .then(function(res) {
          expect(res).to.have.status(204);
        })
    )
  })
});