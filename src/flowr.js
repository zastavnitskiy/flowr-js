(function(w, d, $, undef){
    //hello world
    function log() {
        console.log.apply(console, arguments);
    }

    var breaker = {},
        ArrayProto = Array.prototype,
        nativeForEach = ArrayProto.forEach,
        nativeReduce = ArrayProto.reduce;

    function each(obj, iterator, context) {
        if (obj == null) return;
        if (nativeForEach && obj.forEach === nativeForEach) {
            obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
            for (var i = 0, length = obj.length; i < length; i++) {
                if (iterator.call(context, obj[i], i, obj) === breaker) return;
            }
        } else {
            var keys = _.keys(obj);
            for (var i = 0, length = keys.length; i < length; i++) {
                if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
            }
        }
    };

    function reduce(obj, iterator, memo, context) {
        var initial = arguments.length > 2;
        if (obj == null) obj = [];
        if (nativeReduce && obj.reduce === nativeReduce) {
            if (context) iterator = _.bind(iterator, context);
            return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
        }
        each(obj, function(value, index, list) {
            if (!initial) {
                memo = value;
                initial = true;
            } else {
                memo = iterator.call(context, memo, value, index, list);
            }
        });
        if (!initial) throw new TypeError('Reduce of empty array with no initial value');
        return memo;
    };

    function Flower(options){
        console.log("new flower", options);
        this.src_ = options.src;
        this.width_ = options.width;
        this.height_ = options.height;
        this.originalWidth_ = options.width;
        this.originalHeight_ = options.height;
        this.ratio_ = this.originalWidth_ / this.originalHeight_;
        this.element_ = $(this.html()).get(0);
    }

    Flower.prototype = {
        constructor: Flower,

        html: function(){
            return ["<div class='flowr-item' style='width: ", this.width(), "px; height: ", this.height(), "px;'>", "<img class='flowr-inner' src='", this.src() ,"'>", "</div>"].join("");
        },

        src: function(src){
            if (src && src > 0) {
                this.src_ = src;
                return this;
            }

            return this.src_;
        },


        width: function(width) {
            if (width && width > 0) {
                this.width_ = width;
                this.height_ = width / this.ratio_;
                this.updateHtml_();
                return this;
            }

            return this.width_;
        },


        height: function(height){
            log("height", height);
            if (height && height > 0) {
                this.height_ = height;
                this.width_ = height * this.ratio_;
                this.updateHtml_();
                return this;
            }

            return this.height_;
        },

        element: function(){
            return this.element_;
        },

        updateHtml_: function(){
            $(this.element_).css({
                width: this.width_,
                height: this.height_
            });
        }
    }

    /**
     * Flower factory
     * todo: implement flower creation from html nodes also
     * @param seed
     * @returns {*|boolean}
     */
    function flowerFactory(seed) {
        var flower;

        if  (typeof seed == 'object' && seed.url && seed.size && seed.size.w && seed.size.h) {
            flower = new Flower({
                src: seed.url,
                width: seed.size.w,
                height: seed.size.h
            });
        }


        return flower || false;
    }

    function Row(){}


    /**
     * Flowr constructor
     * @param $element {jQuery}
     * @param options {Object}
     * @constructor
     */
    function Flowr($element, options){
        log("new Flowr", $element, options);
        //get sizes
        var flowers = $.map(options.data, function(seed){ return flowerFactory(seed); }),
            elements;

        each(flowers, function(flower, index){
            console.log(flower, index);
            flower.height(options.minHeight);
        });

        // rendering
        elements = reduce(flowers, function(memo, flower, index, flowers){
            memo.push(flower.element());
            return memo;
        }, []);
        $element.append(elements);


        //get container size
        //do calculations
        //render

    }

    $.fn.flowr = function(opts){
        return this.each(function(){
            var that = this,
                $flowr = $(this),
                flowrData = $(this).data(),
                flowr = flowrData.flowr;

            if (!flowr) {

                new Flowr($flowr, $.extend(
                    {},
                    {
                        //defaults
                    },
                    opts
                ));

            } else {
                flowr.setOptions(opts);
            }
        })
    }

}(window, document, jQuery));