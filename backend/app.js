const express = require('express')
const multer = require('multer'); // For handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const cors = require('cors');
const mysql = require('mysql');
const fs = require('fs');
const app = express();
require('dotenv').config();
const router = express.Router();
// Add middleware to enable CORS
app.use(cors());
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });
  app.use(express.json());
const dbConfig = {
    host: process.env.DB_HOST,  // Replace with your Clever Cloud MySQL host
    user: process.env.DB_USER, // Replace with your Clever Cloud MySQL username
    password: process.env.DB_PASS, // Replace with your Clever Cloud MySQL password
    database: process.env.DB_DATABASE, // Replace with your Clever Cloud MySQL database name
  };
  const connection = mysql.createConnection(dbConfig);
  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to the database:', err);
      return;
    }
    console.log('Connected to the database');
        // Close the database connection when done
    // connection.end();
  });
const port =3000;
app.get('/api/data',(req,res)=>{
fs.readFile('data.json','utf-8',(err,data)=>{
    if(err){
        console.log("error in fetching data");
        return res.status(500).json({Error:"server error"});
    }
    try{
    const jsondata = JSON.parse(data);
    res.send(jsondata).status(200);
    console.log(jsondata)
    }
    catch(parseError){
        console.log('error in parsing data',parseError);
    return res.status(500).json({Error:" error in parsing"});
    }
})
})

app.post('/upload', upload.single('resume'), (req, res) => {
  const { name, email, contact, qualification } = req.body;
  const resumeBuffer = req.file.buffer;

  const sql = 'INSERT INTO `job` (name, email, contact, qualification, resume) VALUES (?, ?, ?, ?, ?)';
  const values = [name, email, contact, qualification, resumeBuffer];

  connection.query(sql, values, (err, results) => {
    if (err) {
      console.error('Database insert error: ' + err);
      res.status(500).json({ message: 'Error uploading data.' });
    } else {
      res.status(200).json({ message: 'Data uploaded successfully.' });
    }
  });
});
// Define a route for retrieving data
app.get('/getApplications', (req, res) => {
  const sql = 'SELECT name, email, contact, qualification, resume FROM `job`'; // Adjust the SELECT statement to include all desired fields

  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Database select error: ' + err);
      res.status(500).json({ message: 'Error retrieving data.' });
    } else {
      // Assuming the 'resume' column contains BLOB data
      results = results.map((row) => {
        // Convert the BLOB data to a Base64-encoded string
        row.resume = row.resume.toString('base64');
        return row;
      });

      res.status(200).json(results);
    }
  });
});




app.listen(port,()=>{
    console.log(`server is running in ${port}`)
})
