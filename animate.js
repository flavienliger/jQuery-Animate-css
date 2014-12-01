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
		this.paused = false;
		this.timeStart;
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
			this.data.positionStart = position;
			
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
			
			this.data.transform = {
				transform:  new Transform(newProp).getCssFormat()
			};
			
			this.data.transformObjet = newProp;
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
			}
			
			properties['transition-property'] = 'all';
			properties['transition-duration'] = def.duration + 'ms';
			properties['transition-timing-function'] = def.easing;
			
			this.data.option = def;
		},
		
		start: function(aParams){
			
			this.obj.addClass('in-transition')
				.bind(transitionEndEvent, this.endTransition);
			
			this.data.transformOriginal = this.getTransform();
			this.parseOption.apply(this, aParams);
			
			this.makeClone();
			this.startAnimation();
		},
		
		makeClone: function(){
			
			this.clone = this.obj.clone(true, true)
				.css(this.data.endCss)
				.css({display: 'none'});
			
			this.obj.after(this.clone);
		},
		
		startAnimation: function(){
			
			this.obj.css(_prefixes(this.data.transition));
			this.obj.offset();
			this.obj.css(_prefixes(this.data.transform));
			this.timeStart = Date.now();
		},
		
		endTransition: function(){
			
			var self = $(this).data('animate');
			
			self.obj.unbind(transitionEndEvent);
			self.stop.apply(self, []);
			// callback
			self.data.option.complete.apply(self.obj.get(0), []);
		},
		
		pause: function(){
			
			if(this.paused)
				return false;
			
			this.paused = true;
			
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
			
			
			// update transform
			
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
			
			this.data.transform = {
				transform:  new Transform(transform).getCssFormat()
			};
			
			// update time
			
			var time = Date.now() - this.timeStart;
			var def = this.data.option;
			def.duration-= time;
			
			this.data.transition['transition-duration'] = def.duration+'ms';
			
			console.log(this.data.transition);
		},
		
		play: function(){
			
			if(!this.paused)
				return false;
			
			this.paused = false;
			
			this.startAnimation();
		},
		
		stop: function(){
			
			this.paused = false;
			
			if(this.opt.leaveTransforms){
				this.obj.css( this.data.transitionOriginal );
			}
			else{
				this.obj.remove();
				this.clone.show();
				this.obj = this.clone;
			}
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
		
		var data = $(this).data('animate')
		data.pause.apply(data, []);
	};
		
	$.fn.play = function(){
		
		var data = $(this).data('animate');
		data.play.apply(data, []);
	};
		
	$.fn.rotate = function(){
		
		var data = $(this).data('animate')
		data.rotate.apply(data, []);
	};
		
	$.fn.getAnimPos = function(){
			
	};
	
	
})();