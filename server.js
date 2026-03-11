const http = require("http");
const fs = require("fs");
const { MongoClient } = require("mongodb");

const url = "mongodb://localhost:27017";
const database = "foodhub";

const client = new MongoClient(url);

client.connect().then((result) => {

console.log("Connected Successfully");

const db = result.db(database);

const server = http.createServer((req, res) => {


if (req.url === "/register" && req.method === "POST") {

let body = "";

req.on("data", chunk => {
body += chunk;
});

req.on("end", async () => {

let user = JSON.parse(body);

if (!user.name || !user.email || !user.password) {
res.end("All fields are required");
return;
}

if (user.password.length < 6) {
res.end("Password must be at least 6 characters");
return;
}

let existing = await db.collection("users").findOne({ email: user.email });

if (existing) {
res.end("User already registered");
}
else {
await db.collection("users").insertOne(user);
res.end("Registration Successful");
}

});

}


else if (req.url === "/login" && req.method === "POST") {

let body = "";

req.on("data", chunk => {
body += chunk;
});

req.on("end", async () => {

let data = new URLSearchParams(body);

let email = data.get("email");
let password = data.get("password");

let user = await db.collection("users").findOne({ email: email });

if (!user) {
res.end("User not registered");
}
else if (user.password !== password) {
res.end("Incorrect password");
}
else {
res.end("Login Successful");
}

});

}


else if (req.url === "/menu-data" && req.method === "GET") {

db.collection("foods").find().toArray().then((foods) => {

res.writeHead(200, { "Content-Type": "application/json" });
res.end(JSON.stringify(foods));

});

}


else if (req.url === "/order" && req.method === "POST") {

let body = "";

req.on("data", chunk => {
body += chunk;
});

req.on("end", () => {

let data = new URLSearchParams(body);

let order = {
email: data.get("email"),
name: data.get("name"),
phone: data.get("phone"),
address: data.get("address"),
city: data.get("city"),
pincode: data.get("pincode")
};

if (!order.name || !order.phone || !order.address) {
res.end("Please fill all delivery details");
return;
}

if (order.phone.length !== 10) {
res.end("Invalid phone number");
return;
}

db.collection("orders").insertOne(order);

res.end("Order Placed Successfully");

});

}


else if (req.url.startsWith("/last-order") && req.method === "GET") {

let email = req.url.split("=")[1];

db.collection("orders")
.findOne({ email: email }, { sort: { _id: -1 } })
.then(order => {

res.writeHead(200, { "Content-Type": "application/json" });
res.end(JSON.stringify(order));

});

}


else if (req.url === "/contact" && req.method === "POST") {

let body = "";

req.on("data", chunk => {
body += chunk;
});

req.on("end", () => {

let data = new URLSearchParams(body);

let feedback = {
name: data.get("name"),
email: data.get("email"),
message: data.get("message")
};

db.collection("feedback").insertOne(feedback);

res.end("Message Sent Successfully");

});

}


else if (req.method === "GET") {

let file = req.url.split("?")[0];

if (file === "/") {
file = "/index.html";
}

fs.readFile("." + file, (err, data) => {

if (err) {
res.writeHead(404);
res.end("Page not found");
}
else {

if (file.endsWith(".css")) {
res.writeHead(200, { "Content-Type": "text/css" });
}
else if (file.endsWith(".js")) {
res.writeHead(200, { "Content-Type": "text/javascript" });
}
else {
res.writeHead(200, { "Content-Type": "text/html" });
}

res.end(data);

}

});

}

});


server.listen(4000, () => {
console.log("Server running at http://localhost:4000");
});

});