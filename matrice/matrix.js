var Matrix = function(aMatrix){

	var matrix2d = [
		[1,0],
		[0,1]
	];
	var matrix3d = [
		[1,0,0,0],
		[0,1,0,0],
		[0,0,1,0],
		[0,0,0,1]
	];

	this.matrix = matrix3d;
	
	if(typeof aMatrix == 'string'){
		// parse css matrix
		if(aMatrix.indexOf('matrix') != -1){
			var parse;

			// 3D
			if(aMatrix.indexOf('matrix3d') != -1){
				parse = aMatrix.substr(9, aMatrix.length-10).split(',');
			}
			// 2D
			else{
				parse = aMatrix.substr(7, aMatrix.length-8).split(',');

				// convertTo3d
				parse = [parse[0], parse[1], 0, 0, 
						 parse[2], parse[3], 0, 0, 
						 0, 0, 1, 0, 
						 parse[4], parse[5], 0, 1];
			}

			var x, y, i=0;
			var l = parse.length==16? 4: 2;
			var matrix = [];

			for(x=0; x<l; x++){
				if(parse[i+1] === undefined)
					break;

				matrix[x] = [];

				for(y=0; y<l; y++){
					matrix[x][y] = roundNumber(parseFloat(parse[i]), 2);
					i++;
				}
			}

			this.matrix = matrix;
		}
		// 2d matrix
		else if(aMatrix == '2d'){
			this.matrix = matrix2d;
		}
		// 3d matrix
		else{
			this.matrix = matrix3d;
		}
	}
	// object matrix
	else if(typeof aMatrix == 'object'){
		this.matrix = aMatrix;

		if(aMatrix.length < 4)
			this.convertTo3d(this.matrix);
	}
};

Matrix.prototype = {

	convertTo3d: function(){

		var res = [
			[1,0,0,0],
			[0,1,0,0],
			[0,0,1,0],
			[0,0,0,1]
		];
		var x, y, l=4;

		for(x=0; x<l; x++){
			if(this.matrix[x] != undefined){
				for(y=0; y<l; y++){
					if(this.matrix[x][y] != undefined){
						res[x][y] = this.matrix[x][y];
					}
				}
			}
		}

		this.matrix = res;
		return this;
	},

	getCssFormat: function(){
		return 'matrix3d('+this.matrix.toString()+')';
	},

	rotation: function(degree, type){
		var type = type||'z';
		var theta = Math.radians(degree*-1);
		var cos = Math.cos(theta);
		var sin = Math.sin(theta);

		var base = {
			x: [
				[1,0,0],
				[0,cos,-sin],
				[0,sin,cos]
			],
			y: [
				[cos,0,sin],
				[0,1,0],
				[-sin,0,cos]
			],
			z: [
				[cos,-sin,0],
				[sin,cos,0],
				[0,0,1]
			]
		};

		this.matrix = this.multiplier(this.matrix, base[type]);
		return this;
	},

	scale: function(x, y, z){

		this.matrix = this.multiplier(this.matrix, [
			[x||1, 0, 0],
			[0, y||1, 0],
			[0, 0, z||1]
		]);
		return this;
	},

	translate: function(x, y, z){

		this.matrix = this.multiplier(this.matrix, [
			[1, 0, 0, 0],
			[0, 1, 0, 0],
			[0, 0, 1, 0],
			[x||0, y||0, z||0, 1]
		]);
		return this;
	},

	multiplier: function(a, b){

		var res = [], temp=0;
		var x, xl=a.length, y, yl=xl, z, zl=b.length;

		for(y=0; y<yl; y++){
			res[y] = [];
			for(x=0; x<xl; x++){
				temp = 0;

				// has case
				if(y<zl && x<zl){
					for(z=0; z<zl; z++){
						temp += a[y][z]*b[z][x];
					}
				}
				else{
					temp = a[y][x];	
				}
				res[y][x] = roundNumber(temp, 2);
			}
		}
		return res;
	}	
};

function roundNumber(n, o){
	var offset = Math.pow(10, o);
	n *= offset;
	n = Math.round(n)/offset;
	return n;
}

Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};