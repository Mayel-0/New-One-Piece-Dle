const express = require("express"); // 🏗️ Framework web (routes, serveur)
const mysql = require("mysql2/promise"); // 🗄️ Connexion MySQL (version async)
const cors = require("cors"); // 🔓 Autorise React à appeler l'API

const app = express();

app.use(cors());
app.use(express.json());

const dbConfig = {
  host: "localhost",
  port: 8889,
  user: "root",
  password: "root",
  database: "One_piece_dle",
};

app.get("/api/characters", async (req, res) => {
  console.log("filter :", req.query);
  try {
    console.log("📡 Connexion DB...");
    const connection = await mysql.createConnection(dbConfig);
    console.log("✅ DB connectée !");

    let whereClause = [];
    let params = [];

    if (req.query.genre) {
      whereClause.push("c.genre = ?");
      params.push(req.query.genre);
    }
    if (req.query.id) {
      whereClause.push("c.id = ?");
      params.push(req.query.id);
    }
    if (req.query.haki_id) {
      whereClause.push("c.haki_id = ?");
      params.push(req.query.haki_id);
    }
    if (req.query.arc_id) {
      whereClause.push("c.arc_id = ?");
      params.push(req.query.arc_id);
    }
    if (req.query.fruit) {
      whereClause.push("c.fruit = ?");
      params.push(req.query.fruit);
    }

    if (req.query.nom) {
      whereClause.push("c.nom = ?");
      params.push(req.query.nom);
    }

    const whereSql =
      whereClause.length > 0 ? `WHERE ${whereClause.join(" AND ")}` : "";

    const [rows] = await connection.execute(
      `
      SELECT
        c.id,
        c.nom,
        c.genre,
        c.affiliation,
        c.fruit,
        c.prime,
        c.origine,
        c.taille,
        c.arc_id,
        c.haki_id,
        c.image,
        a.name AS arc,
        h.type AS haki
      FROM characters c
      LEFT JOIN arcs a ON c.arc_id = a.id
      LEFT JOIN haki h ON c.haki_id = h.id
      ${whereSql}
      ORDER BY c.id`,
      params,
    );

    await connection.end();
    // Retourne le tableau complet pour la route /api/characters
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/characters/random", async (req, res) => {
  try {
    console.log("📡 Connexion DB...");
    const connection = await mysql.createConnection(dbConfig);
    console.log("✅ DB connectée !");

    const [rows] = await connection.execute(`
        SELECT
        c.id, c.nom, c.genre, c.affiliation, c.fruit, c.prime, c.taille,
        c.arc_id,
        c.haki_id,
        c.origine,
        c.image,
        a.name AS arc,
        h.type AS haki
      FROM characters c
      LEFT JOIN arcs a ON c.arc_id = a.id
      LEFT JOIN haki h ON c.haki_id = h.id
      ORDER BY RAND()
      LIMIT 1;`);

    await connection.end();
    // Retourne un seul objet (le premier élément) pour la route /api/characters/random
    const result = rows && rows.length > 0 ? rows[0] : null;
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use("/images", express.static("public/images"));

app.listen(3001, () => {
  console.log("🚀 API One Piece sur http://localhost:3001");
  console.log("😁 Personnage : http://localhost:3001/api/characters");
  console.log("🎲 random     : http://localhost:3001/api/characters/random");
});
