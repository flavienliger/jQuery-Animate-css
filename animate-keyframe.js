(function(){
	'use strict';
	
	var cssPrefixes = ['', '-webkit-', '-moz-', '-o-'];
//	var transitionEndEvent = 'webkitTransitionEnd oTransitionEnd transitionend';
	var transitionEndEvent = 'webkitAnimationEnd oAnimationEnd animationend';
	var basicProp = ['marginLeft', 'marginTop', 'opacity', 'height', 'width'];
	var transformProp = ['rotate', 'scale', 'rotateX', 'rotateY', 'rotateZ', 'scaleX', 'scaleY', 'translateX', 'translateY', 'translateZ'];
	var directionProp = ['top', 'right', 'bottom', 'left'];
	
	function _getUnit(val){
		return val.match(/\D+$/);
	}
	
	function _cleanValue(val) {
		if(typeof val == 'string' && !val.match(/show|hide|=/))
			return parseFloat(val.replace(_getUnit(val), ''));
		else
			return val;
	}
	
	function _prefixes(obj){
		var ret = {};
		
		var preEl = ['animation', 'transition', 'transform', 'transition-duration', 'transition-property', 'transition-timing-function'];
		
		for(var key in obj){
			if(preEl.indexOf(key) != -1){
				for(var i=0; i<cssPrefixes.length; i++){
					ret[cssPrefixes[i]+key] = obj[key];
				}
			}
			else{
				ret[key] = obj[key];	
			}
		}
		
		return ret;
	}
	
	function _parseInc(val){
		
		if(typeof val != 'string' || val.length < 3)
			return false;
		
		var move = parseFloat(val.substr(2, val.length));
		var sens = 0;
		
		if(val.indexOf('+=') !== -1)
			sens = 1;
		else if(val.indexOf('-=') !== -1)
			sens = -1;
		
		if(sens)
			return move*sens;
		
		return false;
	}
	
	function _setDefaultTransition(obj){
		var original = {};
			
		for (var i = 0; i < cssPrefixes.length; i++) {
			var tp = cssPrefixes[i] + 'transition-property',
				td = cssPrefixes[i] + 'transition-duration',
				tf = cssPrefixes[i] + 'transition-timing-function';

			original[tp] = obj.css(tp) || '';
			original[td] = obj.css(td) || '';
			original[tf] = obj.css(tf) || '';
		}
		
		return original;
	}
	
	function _setDefaultTransform(obj){
		
		return new Transform(obj).get();
	}
	
	var Animate = function($o, aParams){
		
		this.obj      = $o;		// move object
		this.clone;
		
		this.inAnimation = false;
		this.queue    = [];
		
		this.data = {
			start: {},
			update: {},
			end: {},
			
			startCss: {},
			updateCss: {},
			endCss: {},
			
			transitionOrigine: {},
			transition: {}
		};
		
		this.paused   = false;
		this.timeStart;
		this.keyframe;
		
		this.obj.data('animate', this);
		
		this.opt = {
			leaveTransforms: false,
			useOriginal: false,
			clearQueue: false,
			fastRotate: true
		};
		
		this.start(aParams);
	};
	
	Animate.prototype = {
		
		makeKeyframe:	function(){
			var cssElement = document.createElement('style');
			cssElement.type = 'text/css';
			
			var start = '';
			var startCss = this.data.startCss;
			
			for(var key in startCss){
				start += key+': '+startCss[key]+'; ';
			}
			
			var end = '';
			var endCss = this.data.endCss;
			
			for(var key in endCss){
				end += key+': '+endCss[key]+'; ';
			}
			
			
			var anim = document.createTextNode(
				'@-webkit-keyframes anim {'+
					'from { '+
						start+
					'}'+
					'to { '+
						end+
					'}'+
				'}'
			);
			console.log(anim);
			
			cssElement.appendChild(anim);	
			document.body.appendChild(cssElement);
		},
		
		parseOption: 	function(prop, speed, easing, callback){
			
			// set default val
			var def = this.data.option = $.speed(speed, easing||'linear', callback);
			
			// transition
			this.data.transitionOrigine = _setDefaultTransition(this.obj);
			this.data.transition = {
				transitionProperty: 'all',
				transitionDuration: def.duration + 'ms',
				transitionTimingFunction: def.easing
			};
			
			var option = prop||{};
			this.interpretValue(option);
			
		},
		
		interpretValue: function(option){
			
			var start = this.data.start;
			var update = this.data.update;
			var end = this.data.end;
			var obj = this.obj;
			
			var inc;
			
			// transform
			start.transform = _setDefaultTransform(obj);
			update.transform = new Transform();
			end.transform = new Transform($.extend({}, start.transform));
			
			// fadeOut
			if(option.opacity == 'hide'){
				option.opacity = 0;
				option.display = 'none';
			}
			// fadeIn
			if(option.opacity == 'show'){
				option.opacity = 1;
				option.display = obj.css('display');
			}
			
			for(var key in option){
				
				if(!option.display)
					option[key] = _cleanValue(option[key]);
				
				// basic/ move
				if(basicProp.indexOf(key) != -1 || directionProp.indexOf(key) != -1){
					start[key] = parseFloat(obj.css(key))||0;
					inc = _parseInc(option[key]);
					
					// += / -=
					if(inc){
						update[key] = inc;
						end[key] = start[key] + inc;
					}
					else {
						update[key] = option[key] - start[key];
						end[key] = option[key];
					}
					
					// à garder ?
					if(directionProp.indexOf(key) != -1){
						if(key == 'left'){
							end.right = 'initial';
						} else if(key == 'right'){
							end.left = 'initial';	
						} else if(key == 'top'){
							end.bottom = 'initial';
						} else if(key == 'bottom'){
							end.top = 'initial';
						}
					}
				}
				
				// rotate/ scale
				else if(transformProp.indexOf(key) != -1){
					
					inc = _parseInc(option[key]);
					
					if(inc){
						update.transform.set(key, inc, true);
						end.transform.set(key, inc, true);
					}
					else{
						update.transform.set(key, option[key]);
						end.transform.set(key, option[key], true);
					}
				}
				
				// display
				else{
					start[key] = obj.css(key);
					end[key] = option[key];
				}
			}
			
			this.generateCss();
			this.makeKeyframe();
			console.log(this.data);
		},
		
		generateCss:	function(){
			
			var endCss = $.extend({}, this.data.end);
			endCss.transform = endCss.transform.getCssFormat();
			endCss = _prefixes(endCss);
			
			var startCss = $.extend({}, this.data.start);
			startCss.transform = new Transform(startCss.transform).getCssFormat();
			startCss = _prefixes(startCss);
			
			this.data.endCss = endCss;
			this.data.startCss = startCss;
		},
		
		makeClone: 		function(){
			
			this.clone = this.obj.clone(true, true)
				.css(this.data.endCss)
				.css({display: 'none'});
			
			this.obj.after(this.clone);
		},
		
		startAnimation: function(){
			
			this.obj.css('-webkit-animation', 'anim '+this.data.option.duration+'ms linear forwards');
//			this.obj.css(_prefixes(this.data.transition));
//			this.obj.offset();
//			this.obj.css(_prefixes(this.data.updateCss));
//			this.timeStart = Date.now();
		},
		
		endTransition: 	function(){
			
			var self = $(this).data('animate');
			
			self.obj.unbind(transitionEndEvent);
			self.stop.apply(self, [true]);
			
			// callback
			self.data.option.complete.apply(self.obj.get(0), []);
			
			if(self.queue.length>0){
				var newAnim = self.queue[0];
				self.queue.splice(0,1);
				
				self.start.apply(self, [newAnim]);
			}
		},
		
		calcPos: 		function(){
			
			var position = this.obj.position();
			
			var diff = {
				top: position.top - this.data.positionStart.top,
				left: position.left - this.data.positionStart.left
			};
			
			this.data.positionStart = position;
			
			var transform = this.data.transformObjet;
			
			if(	transform.translateX ) 
				transform.translateX -= diff.left;
			
			if( transform.translateY )
				transform.translateY -= diff.top;
			
			// UPDATE
			this.data.transform = {
				transform:  new Transform(transform).getCssFormat()
			};
		},
		
		
		/* -------------------- */
		
		start: 			function(aParams){
			
			if(this.inAnimation){
				this.queue.push(aParams);
				return false;
			}
			
			this.inAnimation = true;
			
			this.obj.addClass('in-transition')
					.bind(transitionEndEvent, this.endTransition);
			
			this.parseOption.apply(this, aParams);
			this.startAnimation();
		},
		
		pause: 			function(){
			
			if(this.paused || !this.inAnimation)
				return false;
			
			this.paused = true;
			
			this.obj.offset();
			var position = this.obj.position();
			var display = this.obj.css('display');
			
			this.obj.remove();
			
			this.clone.css({
				display: display,
				left: position.left,
				top: position.top
			});
			
			this.obj = this.clone;
			this.makeClone();
			
			this.calcPos();
			
			// update time
			
			var time = Date.now() - this.timeStart;
			var def = this.data.option;
			def.duration-= time;
			
			this.data.transition['transition-duration'] = def.duration+'ms';
		},
		
		play: 			function(){
			
			if(!this.paused || !this.inAnimation)
				return false;
			
			this.paused = false;
			
			this.startAnimation();
		},
		
		stop: 			function(end){
			
			if(!this.obj)
				return false;
			
			this.paused = false;
			
			if(!end && this.opt.clearQueue){
				this.queue = [];
			}
			
			if(!end){
//				var position = this.obj.position();
//				this.original.css($.extend({display: 'block'}, position));
			}
			else{
				this.obj.css($.extend({ WebkitAnimation: ''}, this.data.endCss));
				this.obj.offset();
			}
			
			this.inAnimation = false;
		},
		
		getAnimPos: 	function(){
			
		}
	};
	
	
	var $animate = $.fn.animate;
	
	$.fn.animate = function(params, speed, linear, callback){
		
		var params = arguments;
		
		this.each(function(){
			
			if(!$(this).data('animate'))
				new Animate($(this), params);
			else
				$(this).data('animate').start(params);
		});
		
		return this;
	};
	
	$.fn.pause = function(){
		
		var data = $(this).data('animate');
		if(data)
			data.pause.apply(data, []);
		
		return this;
	};
		
	$.fn.play = function(){
		
		var data = $(this).data('animate');
		if(data)
			data.play.apply(data, []);
		
		return this;
	};
	
	$.fn.stop = function(){
		
		var data = $(this).data('animate');
		if(data)
			data.stop.apply(data, []);
		
		return this;
	};
		
	$.fn.rotate = function(a){
		
		var angle = parseFloat(a)||0;
		
		this.each(function() {
			var transform = new Transform($(this)).set('rotateZ', angle).getCssFormat();
			$(this).css(_prefixes({ transform: transform }));
		});	
		
		return this;
	};
		
	$.fn.getAnimPos = function(){
			
	};
	
		
	/** 
	 * Return value between input and output
	 * @constructor
	 * @param {Object.<min,max>} input data
	 * @param {Object.<min,max>} output data
	 * @param {Boolean} [lim=true] limit
	 */
	var Range = function(input, output, lim){

		var   inp = input
			, out = output
			, lim = lim===false? false:true
		;

		inp.ampl = Math.abs(inp.max-inp.min)
		out.ampl = Math.abs(out.max-out.min);

		/**
		* convert inp>out
		* @param {Number} o input value
		* @returns {Number} output value
		*/
		this.getOutput = function(o){

			if(lim){
				var min = Math.min(inp.min, inp.max);
				var max = Math.max(inp.min, inp.max);
				if(o>=max || o<=min){
					o = (o>=max)? max: min; 
				}
			}
			return calcul(o, 'inp');
		};

		/**
		* convert out>inp
		* @param {Number} o output value
		* @returns {Number} input value
		*/
		this.getInput = function(o){

			if(lim){
				var min = Math.min(out.min, out.max);
				var max = Math.max(out.min, out.max);
				if(o>=max || o<=min){
				  o = (o>=max)? max: min; 
				}
			}
			return calcul(o, 'out');
		};


		/**
		* calcul function
		* @param {Number} o inp or out
		* @param {string} [type='inp'] 'inp' or 'out'
		* @returns {Number} inp or out
		*/
		function calcul(o, type){

			var type = type||'inp'
			  , oStart = o
			  , first = (type==='inp')? inp:out
			  , second = (type==='inp')? out:inp
			;

			// set to zero
			var oZero = oStart-first.min;
			if(first.min>0)
				oZero *= -1;
			oZero = oZero/first.ampl;

			// retransform
			var sens = (second.max>second.min)? 1:-1;
			var val = second.ampl*oZero;
			val = second.min+(val*sens);

			return val;
		}
	};
})();