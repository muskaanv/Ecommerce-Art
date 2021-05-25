const express = require('express'); //Include express JS
const bodyParser = require('body-parser'); //Include body parser
const ejs = require("ejs"); //Include ejs
const mysql = require("mysql"); //Include my sql
const session = require("express-session"); //Include express session
const path = require("path"); //Include path
const fileupload = require("express-fileupload"); //Include express-fileupload
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const { text } = require('body-parser');

const app = express(); //Create an express JS app

//Setting engine
app.set('view engine', 'ejs');

//Application is going to use body parser
app.use(bodyParser.urlencoded({extended : true})); 
app.use(fileupload());
app.use(cookieParser());


// Setting up the public directory
app.use(express.static(__dirname + '/public'));


//Creating connection to SQL database
var connection = mysql.createConnection({
    host : 'localhost',
    user : 'student',
    password : 'student',
    database : 'knack'
});

app.use(session({
    secret : 'secret123login', 
    resave : true,
    saveUnitialized : true
    
}));
app.use(session({secret:'app',cookie:{maxAge:6000}}));


//Route to homepage
app.get('/', function (req, res){
    res.render("home");
});

//Route to login page
app.get('/login.html', function(req,res){
    res.render("login");
});


//Route to registration page
app.get('/registration.html', function(req,res){
    res.render("registration");
});

//Route to cart page
app.get('/cart', function(req, res){
    res.render("cart");
});

//Route to landing page
app.get('/landing', function(req, res) {
	if(req.session.loggedIn){
        res.render("landing");
    }
	else{
        res.render("login");
    }
	
	res.end();
});

//Route to selling page
app.get('/sell', function(req, res){
    
        res.render("sell");
	
});

//Route to queries page
app.get('/queries', function(req, res){
    res.render('queries');
});

app.get('/buy', function(req, res){

    		connection.query("SELECT * from images", function(err, rows, fields){
                if(err)
                    throw err;
                res.render("buy", { items: rows}); 
            });
        
    });


//Route to about page
app.get('/about', function(req, res){
    
		res.render("about");
	
    
});

//Route to logout page
app.get('/logout', function(req, res){
    req.session.loggedIn = false;
    res.render("home");
    
});

//Route post registration done
app.get('/registration', function(req, res){
    res.render("login");
    res.end();
});

//Route to Events page
app.get('/events', function(req, res){
    res.render("events");

});

//Route after uploading product for selling
app.get('/sell-after-page', function(req, res){
    if (req.session.loggedIn) {
		res.render("sell-after-page");
	} else {
		res.render('login',{title:"Login Here"});
	}

});

//POST method query
app.post('/queries', function(req, res){
    var text = req.body.queryText;
    var email = req.session.email;
    if(text){
        var sql = "INSERT into query(email, queryText) VALUES('" + email + "','" + text+"')";
        connection.query(sql, function(err, res){
            if(!err){ 
                console.log("1 query inserted.");
                
            }
            else{
                console.log(err);
            }
        })
    }
});

//POST method login
app.post('/login', function(req,res){
    var email = req.body.email;
    var password = req.body.password;
    if(email && password){
        connection.query('SELECT * FROM login WHERE email = ?', [email], 
        function(error, results, fields){
            const comparison = bcrypt.compareSync(password, results[0].password);
            if(comparison){
                req.session.loggedIn = true;
                req.session.email = email;
                res.redirect('/landing');
            }
            else{
                res.send("Incorrect Username or Password !");
            }
            res.end();
        });
    }
    else{
        res.send('Please enter Username and Password !');
        res.end();
    }
});

//POST method registration
app.post('/registration', function(req, res){
    var name = req.body.name;
    var email = req.body.email;
    var password = req.body.password;
    connection.connect(function(err){
        if(err) throw err;
        console.log("connected!");
        if(name!='' && password!=''){

            // Hash Password
            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync(password, salt);
            // let hashpassword = await bcrypt.hash(password, 8);

            var sql = "INSERT INTO login(username, password, email) VALUES ('" + 
            name + "','" + hash +  "','" + email + "')";
            connection.query(sql, function(err, result){
                if(!err){ 
                    console.log("1 log inserted.");
                    // console.log(hash);
                    res.redirect('/registration');
                }
                else{
                    console.log(err);
                }
                    
            });
        }
        else{
            res.send("Username and password is mandatory field.");
            res.end();
        }
    });
});

//POST method sell page
app.post('/sell', function(req, res){
   var title = req.body.title;
   var description = req.body.description;
   var price = req.body.price;
   let sampleFile;
  let uploadPath;

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  sampleFile = req.files.sampleFile;
  uploadPath = __dirname + '/public/images/upload_images/' + sampleFile.name;

  sampleFile.mv(uploadPath, function(err) {
    if (err)
      return res.status(500).send(err);

    console.log("1 file uploaded.");
    var sql = "INSERT INTO images(title, description, price, image) VALUES ('" + title + "','" + description +  "'," + price + ",'" + sampleFile.name + "')";
    connection.query(sql, function(err, result){
        if(!err){ 
            console.log("1  image uploaded.");
            res.redirect('/sell-after-page');
        }
        else{
            console.log(err);
        }     
    });
  });
});  


const port = 3000 //port we will listen to
app.listen(port, function(){
    console.log('This app is listening on port 3000.');
});

