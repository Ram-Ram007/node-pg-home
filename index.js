const express = require("express");
const app = express();
const bodyParser = require("body-parser");
require("dotenv").config();

const pgClient = require("./pg-config");

// create application/json parser
const jsonParser = bodyParser.json();

// create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use(jsonParser);
app.use(urlencodedParser);

app.post("/save-user", async function (req, res) {
  const queryText = "INSERT INTO users(name) VALUES($1) RETURNING userid,name";
  const pgRes = await pgClient.query(queryText, [req.body.name]);

  const postQueryText =
    "INSERT INTO posts(postcontent,userid) VALUES($1,$2) RETURNING postid";
  const postPgRes = await pgClient.query(postQueryText, [
    req.body.postcontent,
    pgRes.rows[0].userid,
  ]);

  res.json({
    rows: pgRes.rows,
    count: pgRes.rowCount,
    postInsert: postPgRes.rows,
  });
});

app.patch("/update-user", async function (req, res) {
  const queryText =
    "UPDATE users set name=$1 where userid=$2 RETURNING userid,name";
  const pgRes = await pgClient.query(queryText, [
    req.body.name,
    req.body.userid,
  ]);

  res.json({
    rows: pgRes.rows,
    count: pgRes.rowCount,
  });
});
app.get("/fav", async function (req, res) {
  try {
    let query =
      "SELECT items.* FROM items JOIN favourites ON items.item_id = favourites.item_id";

    //http://localhost:5001/fav?user_id=2
    if (req.query.user_id) {
      query += ` WHERE favourites.user_id = ${req.query.user_id}`;
    }

    // Adding search
    //http://localhost:5001/fav?search=Cashews
    // if (req.query.search) {
    //   if (req.query.category) {
    //     query += ` AND`;
    //   } 
    //   else {
    //     query += ` WHERE`;
    //   }
    //   query += ` items.item_name ILIKE '%${req.query.search}%'`;
    // }

    if (req.query.search) {
        query += ` WHERE items.item_name ILIKE '%${req.query.search}%'`;
      }
      



    // Adding sorting
    if (req.query.sortOrder) {
  const sortOrder = req.query.sortOrder === "desc" ? "DESC" : "ASC";
  query += ` ORDER BY ${sortOrder}`;
}




    // Adding sorting by price range
    //http://localhost:5001/fav?priceRange=0-500
    if (req.query.priceRange) {
      const priceRanges = req.query.priceRange.split("-");
      const minPrice = parseFloat(priceRanges[0]);
      const maxPrice = parseFloat(priceRanges[1]);

      query += ` AND items.price BETWEEN ${minPrice} AND ${maxPrice}`;
    }

    const pgRes = await pgClient.query(query);

    res.json({
      rows: pgRes.rows,
      count: pgRes.rowCount,
    });
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//get rating
app.get("/rating", async function (req, res) {
  const pgRes = await pgClient.query(
    "SELECT items.*, AVG(CASE WHEN ratings.rating IS NOT NULL THEN ratings.rating ELSE 0 END) AS overall_rating FROM items LEFT JOIN ratings ON items.item_id = ratings.item_id GROUP BY items.item_id",
    []
  );

  res.json({
    rows: pgRes.rows,
    count: pgRes.rowCount,
  });
});

app.delete("/remove", async function (req, res) {
  const pgRes = await pgClient.query(
    "DELETE from users where userid=$1 RETURNING userid",
    [req.query.userid]
  );

  res.json({
    rows: pgRes.rows,
    count: pgRes.rowCount,
  });
});

app.listen(process.env.PORT, process.env.HOST, () => {
  console.log(
    `Server running at http://${process.env.HOST}:${process.env.PORT}/`
  );
});
