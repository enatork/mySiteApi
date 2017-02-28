var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');

var jwt = require('jsonwebtoken');
var config = require('./config');
var User = require('./app/models/user');
var Token = require('./app/models/token');

var recipeService = require('./app/services/recipeService');

var router = express.Router();

var port = process.env.PORT || 9000;

mongoose.connect(config.database);

app.set('superSecret', config.secret);

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(morgan('dev'));

var _recipeService = recipeService();

app.options("*",function(req,res,next){
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept,  x-access-token");
  res.header("Access-Control-Allow-Methods", "GET, POST");
  res.header("Access-Control-Expose-Headers", "x-access-token");
   //other headers here
   res.status(200).end();
});

router.post('/user', function(req, res){
	var newUser = new User({
		name: req.body.name,
		password: req.body.password,
		admin: false
	});
	newUser.save(function(err){
		if(err) throw err;
		res.json({success:true});
	})
});

var _userName = "";
var response = {};
router.use(function(req, res, next){
	var token = req.headers['x-access-token'];
	if(token){
		var simpleAuth = token.split(" ");
		response = {};
		if(simpleAuth.length === 2){
			User.findOne({name: simpleAuth[0]}, 
			function(err, user){
				if(err){
					throw err;
				}
				if(!user){
					res.json({success:false, message: 'Authentication failed.'});
				}else if(user)
				{
					_userName = user.name;
					if(user.password !== simpleAuth[1])
					{
						res.json({success:false, message: 'Authentication failed.'});
					}
					else
					{
					Token.findOne({userName: user.name},
						function(err, uToken){
							var authToken;
							if(err){
								throw err;
							}
							if(uToken){
								authToken = uToken.token;
								res.set('x-access-token', authToken);
								next();
							}
							else{
								var token = jwt.sign({username: simpleAuth[0], expiresAt: new Date().getTime()}, app.get('superSecret'), {
				          			expiresIn: 60 
				    			});
								var newToken = new Token({
									token: token,
									expiresAt: new Date().getTime() + 60,
									userName: user.name
								});

								newToken.save(function(err){ 
									if(err){
										res.json({success: false, message: 'unknown error'});
									}
									authToken = token;
									response.user = user;
									res.set('x-access-token', authToken);
									next();
								});
							}
							
						});					
					}
				}
			});
		}
		else{
			jwt.verify(token, app.get('superSecret'), function(err,decoded){
			if(err){
				return res.json({success: false, message: 'Authenticate failed'});
			}else{
				req.decoded = decoded;
				res.set('x-access-token', token);		
				next();
			}
		});
		}
	}else{
		return res.status(403).send({
			success: false,
			message: 'authorization denied.'
		});
	}
	router.get('/user', function(req, res){	
		console.log("user");
		User.find({name: _userName}, function(err, user){
			if(user){
				response.user = user;
				res.json(response);
			}
		});
	});

	router.get('/users', function(req, res) {	
		console.log("all users")
		User.findOne({name: _userName}, function(err, user){
			if(user.admin){
				User.find({}, function(err, users){
					response.users = users;
					res.json(response);
				});	
			}else{
				res.json({success: false, message: "unauthorized"})
			}
		});
	});

	router.get('/recipes', function(req, res){	
		_recipeService.getRecipe().then(function(d){
			res.json(d);
		});
	});
});

app.use('/api', router);


app.listen(port);
console.log('app started on port ' + port);