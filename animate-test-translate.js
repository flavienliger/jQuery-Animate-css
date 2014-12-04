(function(){
	'use strict';
	
	var cssPrefixes = ['', '-webkit-', '-moz-', '-o-'];
	var transitionEndEvent = 'webkitTransitionEnd oTransitionEnd transitionend';
	
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
		
		var preEl = ['transition', 'transform', 'transition-duration', 'transition-property', 'transition-timing-function'];
		
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
	
	
	var Animate = function($o, aParams){
		this.obj      = $o;		// move object
		this.original = $o;		// natif object
		this.clone;				// temp object (pause)
		
		this.inAnimation = false;
		this.queue    = [];
		this.paused   = false;
		this.timeStart;
		this.data     = {};
		
		this.original.data('animate', this);
		
		this.opt = {
			leaveTransforms: false,
			useOriginal: false,
			clearQueue: false,
			fastRotate: true
		};
		
		this.start(aParams);
	};
	
	Animate.prototype = {
		
		parseOption: 	function(prop, speed, easing, callback){
			
			var option = prop||{};
			
			// remove px/deg
			for(var key in option){
				option[key] = _cleanValue(option[key]);
			}
			
			this.interpretValue(option);
			
			// set default val
			var def = $.speed(speed, easing, callback);
			
			// transition
			var original = this.data.transitionOriginal = {};
			var properties = this.data.transition = {};
			
			for (var i = 0; i < cssPrefixes.length; i++) {
				var tp = cssPrefixes[i] + 'transition-property',
					td = cssPrefixes[i] + 'transition-duration',
					tf = cssPrefixes[i] + 'transition-timing-function';
				
				original[tp] = this.obj.css(tp) || '';
				original[td] = this.obj.css(td) || '';
				original[tf] = this.obj.css(tf) || '';
			}
			
			properties['transition-property'] = 'all';
			properties['transition-duration'] = def.duration + 'ms';
			properties['transition-timing-function'] = def.easing;
			
			this.data.option = def;
		},
		
		interpretValue: function(opt){
			
			var obj = this.original;
			var position = obj.position();
			var update = {};
			
			var transformOriginal = new Transform(obj);
			var transformEnd = new Transform(obj);
			var newProp = {};
			
			// fadeOut
			if(opt.opacity == 'hide'){
				opt.opacity = 0;
				opt.display = 'none';
			}
			// fadeIn
			if(opt.opacity == 'show'){
				opt.opacity = 1;
				opt.display = obj.css('display');
			}
			
			// basic prop
			if(opt.opacity !== undefined)
				update.opacity = opt.opacity;
			if(opt.width !== undefined)
				update.width = opt.width;
			if(opt.height !== undefined)
				update.height = opt.height;
			
			// movement prop (top/left/bottom/right)
			if(opt.right !== undefined || opt.bottom !== undefined){
				var parent = {
					w: obj.parent().width(),
					h: obj.parent().height()
				};
				
				var info = {
					w: obj.outerWidth(),
					h: obj.outerHeight(),
					ml: parseInt(obj.css('marginLeft')),
					mr: parseInt(obj.css('marginRight')),
					mt: parseInt(obj.css('marginTop')),
					mb: parseInt(obj.css('marginBottom'))
				};
				
				info.w += info.ml + info.mr;
				info.h += info.mt + info.mb;
			}
			
			if(opt.left !== undefined){
				var inc = _parseInc(opt.left);
				
				if(inc){
					newProp.translateX = inc;
					this.data.endCss.left = position.left + inc;
				}
				else{
					newProp.translateX = opt.left - position.left;
				}
				
				opt.right = 'initial';
			}
			else if(opt.right !== undefined){
				
				newProp.translateX = - (opt.right - (parent.w - (position.left + info.w)));
				
				this.data.endCss.left = 'initial';
			}
			
			if(opt.top !== undefined){
				
				var inc = _parseInc(opt.top);
				
				if(inc){
					newProp.translateY = inc;
					opt.top = position.top + inc;
				}
				else{
					newProp.translateY = opt.top - position.top;
				}
					
				opt.bottom = 'initial';
			}
			else if(opt.bottom !== undefined){
				
				newProp.translateY = - (opt.bottom - (parent.h - (position.top + info.h)));
				opt.top = 'initial';
			}
			
			if(opt.rotate !== undefined){
				
				var inc = _parseInc(opt.rotate);
				console.log(inc, transformOriginal.get('rotateZ'))
				if(inc){
					newProp.rotateZ = transformOriginal.get('rotateZ') + inc;
				}
				else{
					newProp.rotateZ = opt.rotate - transformOriginal.get('rotateZ');	
				}
				
				transformEnd.set('rotateZ', newProp.rotateZ);
			}
			
			update.transform = new Transform(newProp).getCssFormat();
			
			console.log('trans', opt, update);
			
			
			this.data.endCss = $.extend(opt, _prefixes({transform: transformEnd.getCssFormat()}));
			this.data.transformObjet = newProp;
			this.data.updateCss = update;
			this.data.positionStart = position;
		},
		
		makeClone: 		function(){
			
			this.clone = this.obj.clone(true, true)
				.css(this.data.endCss)
				.css({display: 'none'});
			
			this.obj.after(this.clone);
		},
		
		startAnimation: function(){
			
			this.obj.css(_prefixes(this.data.transition));
			this.obj.offset();
			this.obj.css(_prefixes(this.data.updateCss));
			this.timeStart = Date.now();
		},
		
		endTransition: 	function(){
			
			var self = $(this).data('animate');
			
			self.obj.unbind(transitionEndEvent);
			self.stop.apply(self, [true]);
			
			// callback
			self.data.option.complete.apply(self.original.get(0), []);
			
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
			this.obj = this.original.clone(true, true);
			
			this.obj
				.data('animate', this)
				.addClass('in-transition')
				.bind(transitionEndEvent, this.endTransition);
			
			this.original.after(this.obj);
			
			this.parseOption.apply(this, aParams);
			
			this.original
				.css(this.data.endCss)
				.css({display: 'none'});
			
			this.makeClone();
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
				var position = this.obj.position();
				this.original.css($.extend({display: 'block'}, position));
			}
			else{
				this.original.show();
			}
			
			this.obj.remove();
			this.clone.remove();
			
			this.obj = '';
			this.clone = '';
			this.inAnimation = false;
			
			this.original.offset();
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