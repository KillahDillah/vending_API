const express = require('express')
const app = express()
const path = require('path')
const mustacheExpress = require('mustache-express');
const bodyParser = require('body-parser')
const config = require('config')
const mysql = require('mysql')

app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())
app.engine('mustache', mustacheExpress())
app.set('views', './views')
app.set('view engine', 'mustache')
app.use(express.static(path.join(__dirname, 'static')))

// before you use this, make sure to update the default.json file in /config
const conn = mysql.createConnection({
  host: config.get('db.host'),
  database: config.get('db.database'),
  user: config.get('db.user'),
  password: config.get('db.password')
})

app.get("/", function(req, res, next){
  res.render("index", {appType:"Express"})
})


app.get ("/api/customer/items", function(req,res,next){
	const sql = `
		SELECT * FROM items
	`
	conn.query(sql, function(err,results,fields){
		res.json(results)
	})
})

app.post ("/api/customer/items/:itemid/purchases", function(req,res,next){
	const sql = `
	INSERT INTO transactions (itemid)
	VALUES (?)
	`

	conn.query (sql,[req.params.itemid], function(err,results,fields){
		const update = `
		UPDATE items
		SET quantity = quantity - 1
		WHERE id = ?
		`
		conn.query (update,[req.params.itemid], function(err2,results2,fields2){
			res.json({
				message:"added",
				transactionId:results.insertId
			})

			console.log(results2)
		})
	})
})


app.get("/api/vendor/purchases", function(req,res,next){
	const sql = `
	SELECT t.*, i.title
	FROM transactions t
	JOIN items i ON t.itemid = i.id
	`
	conn.query (sql, function(err,results,fields){
		res.json(results)
	})
})

app.get ("/api/vendor/money", function(req,res,next){
	const sql = `
		SELECT i.title, SUM(i.cost) as sum, COUNT(t.id) as count
		FROM items i
		JOIN transactions t ON i.id = t.itemid
		GROUP BY i.cost
	`
	conn.query(sql,function(err,results,fields){
		res.json(results)
	})
})

app.post("/api/vendor/items", function(req,res,next){
	const title = req.body.title
	const cost = req.body.cost
	const description = req.body.description
	const quantity = req.body.quantity

	const sql = `
	INSERT INTO items (title, cost, description, quantity)
	VALUES (?,?,?,?)
	`
	conn.query (sql,[title, cost, description,quantity], function(err,results,fields){
		if (!err) {
			res.json ({
				message: "added",
				id: results.insertId
			})
		}
	})
})

app.put ("/api/vendor/items/:itemid", function(req,res,next){
	const cost = req.body.cost
	const description = req.body.description
	const quantity = req.body.quantity

	const sql = `
	UPDATE items 
	SET cost =?, description=?, quantity=?
	WHERE id = ?
	`
	conn.query(sql,[cost, description, quantity, req.params.itemid], function(err,results,fields){
		res.json({
			message:"updated"
		})
	})
})

app.listen(3000, function(){
  console.log("App running on port 3000")
})
