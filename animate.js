(function(){
	'use strict';
	
	var cssPrefixes = ['', '-webkit-', '-moz-', '-o-'];
	var transitionEndEvent = 'webkitTransitionEnd oTransitionEnd transitionend';
	
	function _getUnit(val){
		return val.match(/\D+$/);
	}
	
	function _cleanValue(val) {
		if(typeof val == 'string')
			return parseFloat(val.replace(_getUnit(val), ''));
		else
			return val;
	}
	
	function _prefixes(obj){
		var ret = {};
		
		for(var key in obj){
			for(var i=0; i<cssPrefixes.length; i++){
				ret[cssPrefixes[i]+key] = obj[key];
			}
		}
		
		return ret;
	}
	
	var Animate = function($o, aParams){
		
		this.obj = $o;
		this.queue = [];
		this.cssData = {};
		this.data = {};
		this.obj.data('animate', this);
		this.opt = {
			avoidTransforms: false,
			leaveTransforms: false,
			useOriginal: false
		};
		
		this.start(aParams);
	};
	
	Animate.prototype = {
		
		interpretValue: function(opt){
			
			var position = this.obj.position();
			var transformOriginal = this.data.transformOriginal;
			var newProp = {};
			
			this.data.endCss = $.extend(opt, transformOriginal);
			
			// calcul 
			
			if(opt.right !== undefined || opt.bottom !== undefined){
				var parent = {
					w: this.obj.parent().width(),
					h: this.obj.parent().height()
				};
				
				var info = {
					w: this.obj.outerWidth(),
					h: this.obj.outerHeight(),
					ml: parseInt(this.obj.css('marginLeft')),
					mr: parseInt(this.obj.css('marginRight')),
					mt: parseInt(this.obj.css('marginTop')),
					mb: parseInt(this.obj.css('marginBottom'))
				};
				
				info.w += info.ml + info.mr;
				info.h += info.mt + info.mb;
			}
			
			if(opt.left !== undefined){
				newProp.translateX = opt.left - position.left;
				this.data.endCss.right = 'initial';
			}
			else if(opt.right !== undefined){
				
				newProp.translateX = - (opt.right - (parent.w - (position.left + info.w)));
				this.data.endCss.left = 'initial';
			}
			
			if(opt.top !== undefined){
				newProp.translateY = opt.top - position.top;
				this.data.endCss.bottom = 'initial';
			}
			else if(opt.bottom !== undefined){
				newProp.translateY = - (opt.bottom - (parent.h - (position.top + info.h)));
				this.data.endCss.top = 'initial';
			}
			
			var transform = new Transform(newProp);
			this.data.transform = {
				transform: transform.getCssFormat()
			};
			
			console.log(this.data.transform.transform);
		},
		
		getTransform: function(){
			
			var transform = '';
			
			for(var i=0; i<cssPrefixes.length; i++){
				if(this.obj.css(cssPrefixes+'transform')){
					transform = this.obj.get(0).style.WebkitTransform;
					break;
				}
			}
			
			return _prefixes({	transform: transform });			
		},
		
		parseOption: function(prop, speed, easing, callback){
			
			var option = prop||{};
			
			for(var key in option){
				option[key] = _cleanValue(option[key]);
			}
			
			this.interpretValue(option);
			
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
				
				properties[tp] = 'all';
				properties[td] = def.duration + 'ms';
				properties[tf] = def.easing;
			}
		},
		
		start: function(aParams){
		
			this.obj.bind(transitionEndEvent, this.endTransition);
			
			this.data.transformOriginal = this.getTransform();
			this.parseOption.apply(this, aParams);
			
//			this.clone = this.obj.clone(true, true)
//				.css(this.data.endCss)
//				.css({display: 'none'})
//				.after(this.obj);
			
			var css = {};
			
			this.obj.css(this.data.transition);
			this.obj.offset();
			this.obj.css(_prefixes(this.data.transform));
		},
		
		endTransition: function(){
			
			// callback
			$.speed().complete();
			var self = $(this).data('animate');
			
			self.stop.apply(self, []);
		},
		
		pause: function(){
			
		},
		
		play: function(){
			
		},
		
		stop: function(){
			var css = {};
			
			if(!this.opt.leaveTransforms){
				css = this.obj.css(this.data.endCss);
			}
			
			css = $.extend(css, this.data.transitionOriginal);
			this.obj.css(css);
		},
		
		rotate: function(){
			
		},
		
		getAnimPos: function(){
			
		}
	};
	
	
	var $animate = $.fn.animate;
	
	$.fn.animate = function(params, speed, linear, callback){
		
		var params = arguments;
		
		this.each(function(){
			
			new Animate($(this), params);
		});
		
	};
	
	$.fn.pause = function(){
			
	};
		
	$.fn.play = function(){
			
	};
		
	$.fn.rotate = function(){
			
	};
		
	$.fn.getAnimPos = function(){
			
	};
	
	
})();