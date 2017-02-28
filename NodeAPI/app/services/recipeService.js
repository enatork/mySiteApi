var http = require('http');

var recipeService = function(){
	var service = {};
	
	service.getRecipe = function(){

		var options = {
			hostname: 'www.recipepuppy.com',
			port: 80,
			path: '/api/',
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		};
		return new Promise((resolve, reject) =>{
			var req = http.request(options, (res) => {
				console.log('statusCode:', res.statusCode);
				console.log('headers:', res.headers);

				res.on('data', (d) => {
					resolve(JSON.parse(d));
				});

				req.on('error', (e) => {
	  				console.log(`problem with request: ${e.message}`);
				});
			});
			req.write('?i=onions,garlic&q=omelet&p=3');
			req.end();
		});
		
	};
	return service;
};

module.exports = recipeService;