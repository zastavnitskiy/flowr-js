(function(w, d, $, undef){
    //hello world
    function log() {
        console.log.apply(console, arguments);
    }

    var breaker = {},
        ArrayProto = Array.prototype,
        nativeForEach = ArrayProto.forEach,
        nativeReduce = ArrayProto.reduce,
        namespace = "flowr";

    function getClassName(name) {
        if (!name) {
            return namespace;
        } else {
            return namespace + "-" + name;
        }
    }

    function getSelector(name, type) {
        return (type || ".") + getClassName(name);
    }

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

    function throttle(func, wait, options) {
        var context, args, result;
        var timeout = null;
        var previous = 0;
        options || (options = {});
        var later = function() {
            previous = options.leading === false ? 0 : new Date;
            timeout = null;
            result = func.apply(context, args);
        };
        return function() {
            var now = new Date;
            if (!previous && options.leading === false) previous = now;
            var remaining = wait - (now - previous);
            context = this;
            args = arguments;
            if (remaining <= 0) {
                clearTimeout(timeout);
                timeout = null;
                previous = now;
                result = func.apply(context, args);
            } else if (!timeout && options.trailing !== false) {
                timeout = setTimeout(later, remaining);
            }
            return result;
        };
    };

    function Flower(options){
        this.src_ = options.src;
        this.width_ = options.width;
        this.height_ = options.height;
        this.originalWidth_ = options.width;
        this.originalHeight_ = options.height;
        this.ratio_ = this.originalWidth_ / this.originalHeight_;
        this.element_ = $(this.html()).get(0);
        this.states_ = [];
    }

    Flower.prototype = {
        constructor: Flower,

        html: function(){
            return ["<div class='" + getClassName("item") + "' style='width: ", this.width(), "px; height: ", this.height(), "px;'>", "<img class='" + getClassName("item-img") + "' src='", this.src() ,"'>", "</div>"].join("");
        },

        src: function(src){
            if (src && src > 0) {
                this.src_ = src;
                return this;
            }

            return this.src_;
        },


        width: function(width, opts) {
            if (width && width > 0) {
                this.width_ = width;
                if (!opts || !(opts && opts.relative === false)) {
                    this.height_ = Math.floor(width / this.ratio_);
                }
                if (!opts || !(opts && opts.updateHtml === false)) {
                    this.updateHtml_();
                }
                return this;
            }

            return this.width_;
        },


        height: function(height, opts){
            if (height && height > 0) {
                this.height_ = height;

                if (!opts || !(opts && opts.relative === false)) {
                    this.width_ = Math.floor(height * this.ratio_);
                }

                if (!opts || !(opts && opts.updateHtml === false)) {
                    this.updateHtml_();
                }
                return this;
            }

            return this.height_;
        },

        element: function(){
            return this.element_;
        },

        updateHtml_: function(){
            var $el = $(this.element_), state;
            $el.css({
                width: this.width_,
                height: this.height_
            });

            for (state in this.states_) {
                if (this.states_.hasOwnProperty(state)) {
                    $el.toggleClass(getClassName("item-s-" + state), this.states_[state]);
                }
            }
        },

        update: function(){
            this.updateHtml_();
            return this;
        },

        setState: function(state, opts) {
            this.states_[state] = true;
            if (!opts || !(opts && opts.updateHtml === false)) {
                this.updateHtml_();
            }
        },

        removeState: function(state, opts) {
            this.states_[state] = false;
            if (!opts || !(opts && opts.updateHtml === false)) {
                this.updateHtml_();
            }
        },

        isState: function(state){
            return state && this.states_[state] || false;
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

    function Row(options){
        this.storage_ = [];
        this.width_ = options.width;
    }

    Row.prototype = {
        constructor: Row,
        addFlower: function(flower) {
            if (this.flowersWidth() + flower.width() <= this.width()) {
                this.storage_.push(flower);
                return true;
            } else {
                return false;
            }

        },

        flowersWidth: function() {
            return reduce(this.storage_, function(memo, flower){
                return memo + flower.width();
            }, 0);
        },

        width: function(){
            return this.width_;
        },

        fitWidth: function(){

            var ratio = this.width() / this.flowersWidth(),
                height = Math.floor(this.storage_[0].height() * ratio);

            each(this.storage_, function(flower){
                flower.height(height, { updateHtml: false });
                flower.isState("last-in-row") && flower.removeState("last-in-row", { updateHtml: false });
            });

            //adjust first image to compensate pricision differencies
            if (this.width() !== this.flowersWidth()) {
                this.storage_[0].width(this.storage_[0].width() + (this.width() - this.flowersWidth()), { relative: false, updateHtml: false });
            }

            //set last-in-row state for last item in row
            this.storage_[this.storage_.length - 1].setState("last-in-row", { updateHtml: false })

        }
    }


    /**
     * Flowr constructor
     * @param $element {jQuery}
     * @param options {Object}
     * @constructor
     */
    function Flowr($element, options){
        //get sizes
        var that = this,
            flowers = this.flowers = $.map(options.data, function(seed){ return flowerFactory(seed); }),
            elements,
            containerWidth = options.width,
            $wrapper = $("<div class='" + getClassName("items") + "'></div>");

        this.options = options;

        this.calculateRows(containerWidth);

        // rendering
        elements = reduce(flowers, function(memo, flower, index, flowers){
            memo.push(flower.element());
            return memo;
        }, []);

        $element.addClass(getClassName());
        $wrapper.width(containerWidth);
        $wrapper.append(elements);
        $element.append($wrapper);

        $(window).resize(throttle(function(){
            var width = $element.width();
            $wrapper.css("width", width);
            that.calculateRows(width);
        }, 300));
    }

    Flowr.prototype.calculateRows = function(width) {
        var rows = [],
            row,
            flowers = this.flowers,
            options = this.options;

        row = new Row({
            width: width
        });

        each(flowers, function(flower) {
            //resize flower to fit minHeight
            flower.height(options.minHeight);

            if (!row.addFlower(flower)) {
                row.fitWidth();
                rows.push(row);

                //here we assume, that flower will fit the new row
                //rethink this, probably there is a better solution
                row = new Row({
                    width: width
                });
                row.addFlower(flower);
            }
        });

        each(flowers, function(flower) {
            flower.update();
        });
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
                        'minHeight' : 150,					// Minimum height an image row should take
                        'maxHeight' : 200,					// Minimum height an image row should take
                        'maxScale' : 1.5,				// not-implemented In case there is only 1 elment in last row
                        'width' : $(this).width()
                    },
                    opts
                ));

            } else {
                flowr.setOptions(opts);
            }
        })
    }

}(window, document, jQuery));