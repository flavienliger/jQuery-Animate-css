(function(){
    'use strict';
    
    var cssPrefixes = ['', '-webkit-', '-moz-', '-o-'];
    var transitionEndEvent = 'webkitTransitionEnd oTransitionEnd transitionend';
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
    
    function _setDefaultTransform(obj){
        
        return new Transform(obj);
    }
    
    var Animate = function($o, aParams){
        
        this.obj      = $o;
        this.original = $o;
        this.clone;
        
        this.inAnimation = false;
        this.queue    = [];
        
        this.data = {
            start: {},
            update: {},
            set: {},
            end: {},
            
            setCss: {},
            endCss: {},
            
            transition: {}
        };
        
        this.paused   = false;
        this.timeStart;
        
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
        
        parseOption:     function(prop, speed, easing, callback){
            
            // set default val
            var def = this.data.option = $.speed(speed, easing||'linear', callback);
            
            // transition
            this.data.transition = {
                transitionProperty: 'all',
                transitionDuration: def.duration + 'ms',
                transitionTimingFunction: def.easing
            };
            
            var option = prop||{};
            this.interpretValue(option);
            
        },
        
        interpretValue: function(option){
            
            var start = this.data.start,
                update = this.data.update,
                set = this.data.set,
                end = this.data.end,
                obj = this.original;
            
            var inc;
            
            // transform
            start.transform = _setDefaultTransform(obj);
            update.transform = new Transform();
            set.transform = new Transform($.extend({}, start.transform.get()));
            end.transform = new Transform($.extend({}, start.transform.get()));
            
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
                    
                    if(directionProp.indexOf(key) != -1)
                        set.transform.set(key=='left'||key=='right'? 'translateX': 'translateY', update[key], true);
                    else
                        set[key] = end[key];
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
                    
                    set.transform.set(key, end.transform.get(key));
                }
                
                // display
                else{
                    start[key] = obj.css(key);
                    end[key] = option[key];
                }
            }
            
            this.data.endCss = this.generateCss(end);
        },
        
        generateCss:    function(val){
            
            var css = $.extend({}, val);
            css.transform = css.transform.getCssFormat();
            return _prefixes(css);
        },
        
        makeClone:         function(){
            
            this.clone = this.obj.clone(true, true)
                .css(this.data.endCss)
                .css({display: 'none'});
            
            this.obj.after(this.clone);
        },
        
        startAnimation: function(){
            
            this.data.setCss = this.generateCss(this.data.set);
            
            this.obj.css(_prefixes(this.data.transition));
            this.obj.offset();
            this.obj.css(_prefixes(this.data.setCss));
            
        },
        
        endTransition:     function(){
            
            var self = $(this).data('animate');
            
            self.obj.unbind(transitionEndEvent);
            self.stop.apply(self, [true]);
            
            // callback
            self.data.option.complete.apply(self.original.get(0), []);
        },
        
        calcPos:         function(time){
            
            var posTime = time,
                option = this.data.option,
                start = this.data.start,
                update = this.data.update,
                end = this.data.end,
                set = this.data.set,
                css = {},
                val;
            
            var startTrans = start.transform,
                endTrans = end.transform,
                transform = new Transform();
            
            // transform 
            for(var key in endTrans.get()){
                
                val = new Range(
                    {min: 0, max: option.duration}, 
                        {min: startTrans.get(key)||0, max: endTrans.get(key)})
                    .getOutput(posTime);
                
                transform.set(key, val);
                set.transform.set(key, endTrans.get(key));
            }
            
            // basic prop
            for(var key in update){
                
                if(key !== 'transform'){
                
                    val = new Range(
                        {min: 0, max: option.duration}, 
                        {min: start[key], max: end[key]})
                    .getOutput(posTime);

                    css[key] = val;
                    
                    if(directionProp.indexOf(key) !== -1){
                        var translate = key=='left'||key=='right'?'translateX': 'translateY';
                        set.transform.set(translate, end[key]-val+startTrans.get(translate));
                    }
                }
            }
            
            css.transform = transform.getCssFormat();
            css.display = 'block';
            
            return _prefixes(css);
        },
        
        nextQueue:        function(){
            
            if(this.queue.length>0){
                var newAnim = this.queue[0];
                this.queue.splice(0,1);
                
                this.start.apply(this, [newAnim]);
            }    
        },
        
        /* -------------------- */
        
        start:             function(aParams){
            
            if(this.inAnimation){
                this.queue.push(aParams);
                return false;
            }
            
            this.data = {
                start: {},
                update: {},
                set: {},
                end: {},

                setCss: {},
                endCss: {},

                transition: {}
            };
            
            this.inAnimation = true;
            this.obj = this.original.clone(true, true);
            
            this.parseOption.apply(this, aParams);
            
            this.obj.addClass('in-transition')
                    .data('animate', this)
                    .bind(transitionEndEvent, this.endTransition);
            
            this.original
                .after(this.obj)
                .css(this.data.endCss)
                .css({display: 'none'});
            
            this.makeClone();
            this.startAnimation();
            this.timeStart = Date.now();
        },
        
        pause:             function(){
            
            if(this.paused || !this.inAnimation)
                return false;
            
            this.timePause = Date.now();
            var time = this.timePause - this.timeStart;
                        
            this.paused = true;
            
            this.clone.css(this.calcPos(time));
            
            this.obj.remove();
            this.obj = this.clone;
            this.makeClone();
            
            // update time
            var def = this.data.option;
            
            this.data.transition['transition-duration'] = (def.duration-time)+'ms';
        },
        
        play:             function(){
            
            if(!this.paused || !this.inAnimation)
                return false;
            
            this.paused = false;
            this.startAnimation();
            this.timeStart += Date.now() - this.timePause;
        },
        
        stop:             function(end){
            
            if(!this.obj || !this.inAnimation)
                return false;
            
            this.paused = false;
            
            if(!end && this.opt.clearQueue){
                this.queue = [];
            }
            
            if(!end){
                this.original.css(this.calcPos(Date.now() - this.timeStart));
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
            this.nextQueue();
        },
        
        getAnimPos:     function(){
            
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