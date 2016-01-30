// immediately invoked functional expression
(function() {

	var operators = {'+' : function(a, b) { return a + b; }, '-' : function(a, b) { return a - b; },};

	// Define constructor
	this.Slider = function() {

		this.wrapper = null;
		this.view = null;
		this.listObj = null;
		this.offset = null;
		this.closest = null;
		this.prevBtn = null;
		this.nextBtn = null;
        this.velocity = 0;

		// Define option defaults
		var defaults = {
			slideSelector: "slider",
			prevSelector: 'prev',
			nextSelector: 'next'
		}

		// Create options by extending defaults with the passed in arugments
		if (arguments[0] && typeof arguments[0] === "object") { this.options = extend({}, defaults, arguments[0]); }

		buildSlider.call(this);
		initializeEvents.call(this);

		// Transform polyfill
		this.xform = 'transform';
        var self = this;
		['webkit', 'Moz', 'O', 'ms'].every(function (prefix) {
			var e = prefix + 'Transform';
			if (typeof self.view.style[e] !== 'undefined') {
				self.xform = e;
				return false;
			}
			return true;
		});

	}

	function buildSlider() {

		// get necessary elements
		this.langDir = document.querySelector('html').getAttribute("dir");

		this.wrapper = wrapper = document.querySelector('.'+this.options.slideSelector);
		this.wrapper.classList.add("wrapper");
		this.view = this.wrapper.children[0];

		this.prevBtn = document.querySelector('.'+this.options.prevSelector);
		this.nextBtn = document.querySelector('.'+this.options.nextSelector);

		// UPDATE VARS
		this.max = parseInt(getComputedStyle(this.view).width, 10) - wrapper.offsetWidth;
		this.offset = this.min = 0;
		this.pressed = false;
		this.timeConstant = 325; // ms
		this.listObj = [];

		// BUILD ITEM LIST
		var children = this.view.children;

		for (var i = 0; i < children.length; i++) {

			var tmpObj = {
				count: i,
				name: children[i].innerHTML,
				position: this._getPosition(children[i]),
				width: children[i].offsetWidth
			};

			this.listObj.push(tmpObj);
		}

        console.log(this.listObj);

		this.closest = this.listObj[0];

	}

	function initializeEvents() {

		// ADD EVENT LISTENERS
		if (this.view.offsetWidth > this.wrapper.offsetWidth) {

			if (typeof window.ontouchstart !== 'undefined') {
				this.view.addEventListener('touchstart', this.tap.bind(this));
				this.view.addEventListener('touchmove', this.drag.bind(this));
				this.view.addEventListener('touchend', this.move.bind(this));
			}

			this.view.addEventListener('mousedown', this.tap.bind(this));
			this.view.addEventListener('mousemove', this.drag.bind(this));
			this.view.addEventListener('mouseup', this.move.bind(this));

		};

		this.prevBtn.addEventListener('click', this.move.bind(this));
		this.nextBtn.addEventListener('click', this.move.bind(this));

	}

	Slider.prototype.move = function(e) {

		this.pressed = false;
		clearInterval(this.ticker);

		// Add momentum
		this.target = this.offset;
		if (this.velocity > 10 || this.velocity < -10) {
			this.amplitude = 0.8 * this.velocity;
			this.target = this.offset + this.amplitude;
		}

		if (e.type !== 'click') {

			if (this.mouseX == this.reference) {

				// If item is clicked, select it as closest
				var elem = e.target;
				var index = [].slice.call(elem.parentNode.children).indexOf(elem);
				this.closest = this.listObj[index];
				console.log('load page content for '+ this.closest.name);

			} else {

				// If item is dragged, find closest item in list when released
				var self = this;
				this.closest = this.listObj.reduce(function (prev, curr) {
					if (prev !== null && typeof prev === 'object') { var pos = prev.position; }
					return (Math.abs(curr.position - self.target) < Math.abs(pos - self.target) ? curr : prev);
				});

			}

		} else {

			// Find the next or prev item
			var op = operators[e.target == this.nextBtn ? '+' : '-'];
			this.closest = this.listObj[op(this.closest.count, 1)];

			// prevent prev going below 0
			if (!this.closest) { this.closest = this.listObj[0]; }

		}

		// Set destination for view
		this.target = this.closest.position;

		// Mark the active item
		var active = this.view.querySelector('.active');
		if (active) { active.classList.remove("active"); };
		this.view.children[this.closest.count].classList.add("active");

		// Initialize deceleration
		this.amplitude = this.target - this.offset;
		this.timestamp = Date.now();
		requestAnimationFrame(this.autoScroll.bind(this));

		// Prevent default actions on elements
		e.preventDefault();
		e.stopPropagation();
		return false;
	}

	// Public Methods
	Slider.prototype.scroll = function(x) {
		this.offset = (x > this.max) ? this.max : (x < this.min) ? this.min : x;
		this.view.style[this.xform] = 'translateX(' + (this.langDir == 'rtl' ? this.offset : -this.offset) + 'px)';
	}

	Slider.prototype.autoScroll = function() {
		var elapsed, delta;
		if (this.amplitude) {
			elapsed = Date.now() - this.timestamp;
			delta = -this.amplitude * Math.exp(-elapsed / this.timeConstant);
			if (delta > 1.2 || delta < -1.2) {
				this.scroll(this.target + delta);
				requestAnimationFrame(this.autoScroll.bind(this));
			} else {
				this.scroll(this.target);
			}
		}
	}

	Slider.prototype.tap = function(e) {
		this.pressed = true;
		this.reference = xpos(e);
		this.mouseX = xpos(e);

		this.velocity = this.amplitude = 0;
		this.frame = this.offset;
		this.timestamp = Date.now();
		clearInterval(this.ticker);
		this.ticker = setInterval(this._track.bind(this), 100);

		e.preventDefault();
		e.stopPropagation();
		return false;
	}

	Slider.prototype.drag = function(e) {
		var x, delta;
		if (this.pressed) {
			x = xpos(e);
			delta = this.reference - x;
			if (delta > 2 || delta < -2) {
				this.reference = x;
				this.scroll(this.langDir == 'rtl' ? this.offset - delta : this.offset + delta);
			}
		}

		e.preventDefault();
		e.stopPropagation();
		return false;
	}

	Slider.prototype._track = function() {
		var now, elapsed, delta, v;

		now = Date.now();
		elapsed = now - this.timestamp;
		this.timestamp = now;
		delta = this.offset - this.frame;
		this.frame = this.offset;

		v = 1000 * delta / (1 + elapsed);
		this.velocity = 0.8 * v + 0.2 * this.velocity;
	}

	Slider.prototype._getPosition = function(el) {
		var rect = el.getBoundingClientRect(),
			parentRect = el.offsetParent.getBoundingClientRect();

		return this.langDir == 'rtl' ? parentRect.right - rect.right : rect.left - parentRect.left;
	}

	function xpos(e) {

		// Touch Event
		if (e.targetTouches && (e.targetTouches.length >= 1)) { return e.targetTouches[0].clientX; }

		// Mouse Event
		return e.clientX;
	}

	function extend(target) {

		for(var i=1; i<arguments.length; ++i) {
			var from = arguments[i];

			if(typeof from !== 'object') continue;

			for(var j in from) {
				if(from.hasOwnProperty(j)) {

					// if property is not HTML node
					if (from[j].nodeType !== 1) {
						target[j] = typeof from[j] === 'object'
						? extend({}, target[j], from[j])
						: from[j];
					} else {
						target[j] = from[j];
					};
				}
			}
		}

		return target;
	}

}());
