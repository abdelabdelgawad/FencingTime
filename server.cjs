const express = require("express");
const { Client } = require("pg");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());

const dbConfig = {
	user: process.env.DB_USER,
	host: process.env.DB_SERVER,
	database: process.env.DB_NAME,
	password: process.env.DB_PASSWORD,
	port: 5432,
	ssl: { rejectUnauthorized: false },
};

// Runs one query against a fresh connection, then always closes it.
// Every route below calls this instead of repeating connect/query/end itself.
async function runQuery(query, params = []) {
	const client = new Client(dbConfig);
	try {
		await client.connect();
		return await client.query(query, params);
	} finally {
		await client.end();
	}
}

// Wraps a route handler so routes don't each need their own try/catch.
// Logs the real error server-side, sends a generic message to the client.
function handle(fn) {
	return async (req, res) => {
		try {
			await fn(req, res);
		} catch (err) {
			console.error(err);
			res.status(500).send("Server error");
		}
	};
}

// ----- Fencers -----

app.get("/api/fencers", handle(async (req, res) => {
	const result = await runQuery(`SELECT * FROM fencers ORDER BY "lastName"`);
	res.json(result.rows);
}));

app.get("/api/fencers/:memberID", handle(async (req, res) => {
	const result = await runQuery(
		`SELECT * FROM fencers WHERE "memberID" = $1`,
		[req.params.memberID]
	);
	if (result.rows.length === 0) return res.status(404).send("Fencer not found");
	res.json(result.rows[0]);
}));

app.post("/api/fencers", handle(async (req, res) => {
	const { firstName, lastName, club, gender, birthdate, foilRating, epeeRating, saberRating } = req.body;
	await runQuery(
		`INSERT INTO fencers ("firstName","lastName","club","gender","birthdate","foilRating","epeeRating","saberRating")
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		[firstName, lastName, club, gender, birthdate, foilRating, epeeRating, saberRating]
	);
	res.send("Fencer added successfully");
}));

app.put("/api/fencers/:memberID", handle(async (req, res) => {
	const { firstName, lastName, club, gender, birthdate, foilRating, epeeRating, saberRating } = req.body;
	await runQuery(
		`UPDATE fencers SET "firstName"=$2,"lastName"=$3,"club"=$4,"gender"=$5,"birthdate"=$6,"foilRating"=$7,"epeeRating"=$8,"saberRating"=$9
		 WHERE "memberID"=$1`,
		[req.params.memberID, firstName, lastName, club, gender, birthdate, foilRating, epeeRating, saberRating]
	);
	res.send("Fencer edited successfully");
}));

app.delete("/api/fencers/:memberID", handle(async (req, res) => {
	await runQuery(`DELETE FROM fencers WHERE "memberID" = $1`, [req.params.memberID]);
	res.send("Fencer deleted successfully");
}));

// ----- Events -----

app.get("/api/events", handle(async (req, res) => {
	const result = await runQuery(`SELECT * FROM events ORDER BY "startTime"`);
	res.json(result.rows);
}));

app.get("/api/events/:eventID", handle(async (req, res) => {
	const result = await runQuery(
		`SELECT * FROM events WHERE "eventID" = $1`,
		[req.params.eventID]
	);
	if (result.rows.length === 0) return res.status(404).send("Event not found");
	res.json(result.rows[0]);
}));

app.post("/api/events", handle(async (req, res) => {
	const { name, capacity, address, startTime, weapon, category, eventGender } = req.body;
	await runQuery(
		`INSERT INTO events ("name","capacity","address","startTime","weapon","category","eventGender")
		 VALUES ($1,$2,$3,$4,$5,$6,$7)`,
		[name, capacity, address, startTime, weapon, category, eventGender]
	);
	res.send("Event added successfully");
}));

app.put("/api/events/:eventID", handle(async (req, res) => {
	const { name, capacity, address, weapon, category, eventGender, startTime } = req.body;
	await runQuery(
		`UPDATE events SET "name"=$2,"capacity"=$3,"address"=$4,"weapon"=$5,"category"=$6,"eventGender"=$7,"startTime"=$8
		 WHERE "eventID"=$1`,
		[req.params.eventID, name, capacity, address, weapon, category, eventGender, startTime]
	);
	res.send("Event edited successfully");
}));

app.delete("/api/events/:eventID", handle(async (req, res) => {
	await runQuery(`DELETE FROM events WHERE "eventID" = $1`, [req.params.eventID]);
	res.send("Event deleted successfully");
}));

// ----- Event registrations (event_fencers) -----

app.get("/api/event_fencers", handle(async (req, res) => {
	const result = await runQuery(`SELECT * FROM event_fencers ORDER BY "eventID"`);
	res.json(result.rows);
}));

app.get("/api/event_fencers/:eventID", handle(async (req, res) => {
	const result = await runQuery(
		`SELECT * FROM event_fencers
		 JOIN fencers ON event_fencers."memberID" = fencers."memberID"
		 WHERE event_fencers."eventID" = $1`,
		[req.params.eventID]
	);
	res.json(result.rows);
}));

// ----- Pools -----

app.get("/api/pools/:eventID", handle(async (req, res) => {
	const result = await runQuery(
		`SELECT * FROM pools WHERE "eventID" = $1`,
		[req.params.eventID]
	);
	if (result.rows.length === 0) return res.status(404).send("Pool not found");
	res.json(result.rows);
}));

app.get("/api/pool_bouts/:poolID", handle(async (req, res) => {
	const result = await runQuery(
		`SELECT pb.*,
		        fa."firstName" AS "fencerA_first", fa."lastName" AS "fencerA_last",
		        fb."firstName" AS "fencerB_first", fb."lastName" AS "fencerB_last"
		 FROM pool_bouts pb
		 JOIN fencers fa ON pb."fencerA" = fa."memberID"
		 JOIN fencers fb ON pb."fencerB" = fb."memberID"
		 WHERE pb."poolID" = $1`,
		[req.params.poolID]
	);
	res.json(result.rows);
}));

// ----- Template: copy this block for a new table/resource -----
//
// Replace THING / things / thingID with your table name, plural route name,
// and primary key column. Delete whichever CRUD methods you don't need.
//
// app.get("/api/things", handle(async (req, res) => {
// 	const result = await runQuery(`SELECT * FROM things ORDER BY "thingID"`);
// 	res.json(result.rows);
// }));
//
// app.get("/api/things/:thingID", handle(async (req, res) => {
// 	const result = await runQuery(
// 		`SELECT * FROM things WHERE "thingID" = $1`,
// 		[req.params.thingID]
// 	);
// 	if (result.rows.length === 0) return res.status(404).send("Thing not found");
// 	res.json(result.rows[0]);
// }));
//
// app.post("/api/things", handle(async (req, res) => {
// 	const { fieldA, fieldB } = req.body;
// 	await runQuery(
// 		`INSERT INTO things ("fieldA","fieldB") VALUES ($1,$2)`,
// 		[fieldA, fieldB]
// 	);
// 	res.send("Thing added successfully");
// }));
//
// app.put("/api/things/:thingID", handle(async (req, res) => {
// 	const { fieldA, fieldB } = req.body;
// 	await runQuery(
// 		`UPDATE things SET "fieldA"=$2,"fieldB"=$3 WHERE "thingID"=$1`,
// 		[req.params.thingID, fieldA, fieldB]
// 	);
// 	res.send("Thing edited successfully");
// }));
//
// app.delete("/api/things/:thingID", handle(async (req, res) => {
// 	await runQuery(`DELETE FROM things WHERE "thingID" = $1`, [req.params.thingID]);
// 	res.send("Thing deleted successfully");
// }));

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});