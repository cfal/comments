Comments Component (React, MongoDB, Koa)
========================================

An example of a reddit-style comments system, using React and LESS for the frontend, and MongoDB & Koa backend.

### Installation and test with [Docker](http://www.docker.com) and [Docker Compose](http://docs.docker.com/compose/)

* Run `docker-compose up` from project root to create and run MongoDB and Nodejs containers with prepopulated comments
* On OSX: `open http://$(docker-machine ip dev):8080`
* On Linux: `open http://localhost:8080`

### Test locally

* Run a MongoDB server
* `npm install` from project root to install dependencies
* `gulp [--production]` to build server & optionally minify client in `out`
* `node out/server/server.js [MongoDB path]` to start the koa server. Default MongoDB path is `localhost/test`
* Populate comments & users with `node scripts/populate.js`

