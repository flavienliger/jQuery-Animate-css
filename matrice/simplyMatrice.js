function _translateMatrix(aMatrix, toAdd){
		
		var toAdd = $.extend({x: 0, y: 0}, toAdd);
		var matrix = aMatrix;
		var res = '';
		var parse = '';
		var i, l;
		
		var matrix3d = matrix.indexOf('matrix3d')!=-1;
		
		if(matrix3d || toAdd.z!==undefined){
			
			// convert matrix2D to matrix3d
			if(!matrix3d){
				var matrix2d = matrix.substr(7, matrix.length-8).split(',');
				parse = [matrix2d[0], matrix2d[1], 0, 0, matrix2d[2], matrix2d[3], 0, 0, 0, 0, 1, 0, matrix2d[4], matrix2d[5], 1, 1];
			}
			// parse matrix3d
			else {
				parse = matrix.substr(9, matrix.length-10).split(',');	
			}
			
			// default add Z
			if(!toAdd.z){
				toAdd.z = 0;
			}
			
			res += 'matrix3d(';
			
			for(i=0, l=12; i<l; i++){
				res += parse[i]+',';
			}
			
			res += parseInt(parse[12])+toAdd.x+',';
			res += parseInt(parse[13])+toAdd.y+',';
			
			res += parseInt(parse[14])+toAdd.z+',';
			res += parseInt(parse[15]);
			
			res += ')';
		}
		else if(matrix.indexOf('matrix')!=-1){
			
			// delete matrix( ) - separate attribut
			parse = matrix.substr(7, matrix.length-8).split(',');
			
			res += 'matrix(';
			
			for(i=0, l=4; i<l; i++){
				res += parse[i]+',';
			}
			
			res += parseInt(parse[4])+toAdd.x+',';
			res += parseInt(parse[5])+toAdd.y;
			res += ')';
		}
		else {
			res = 'translateX('+(toAdd.x||0)+'px) translateY('+(toAdd.y||0)+'px)';
		}
		
		return res;
	};