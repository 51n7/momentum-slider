window.onload = function () {
	'use strict';

	var view,
		min, max, offset, reference, pressed, xform,
		velocity, frame, timestamp, ticker,
		amplitude, target, timeConstant, closest,
		wrapper, prevBtn, nextBtn, mouseX, langDir;

	view = document.getElementById('view');
	wrapper = document.getElementById('wrapper');
	prevBtn = document.getElementById('prev');
	nextBtn = document.getElementById('next');
	langDir = document.querySelector('html').getAttribute("dir");

	function xpos(e) {

		// Touch Event
		if (e.targetTouches && (e.targetTouches.length >= 1)) {
			return e.targetTouches[0].clientX;
		}

		// Mouse Event
		return e.clientX;
	}

	function scroll(x) {
		offset = (x > max) ? max : (x < min) ? min : x;
		view.style[xform] = 'translateX(' + (langDir == 'rtl' ? offset : -offset) + 'px)';
	}

	function track() {
		var now, elapsed, delta, v;

		now = Date.now();
		elapsed = now - timestamp;
		timestamp = now;
		delta = offset - frame;
		frame = offset;

		v = 1000 * delta / (1 + elapsed);
		velocity = 0.8 * v + 0.2 * velocity;

	}

	function autoScroll() {
		var elapsed, delta;

		if (amplitude) {
			elapsed = Date.now() - timestamp;
			delta = -amplitude * Math.exp(-elapsed / timeConstant);
			if (delta > 1.2 || delta < -1.2) {
				scroll(target + delta);
				requestAnimationFrame(autoScroll);
			} else {
				scroll(target);
			}
		}
	}
	
	function tap(e) {

		pressed = true;
		reference = xpos(e);
		mouseX = xpos(e);

		velocity = amplitude = 0;
		frame = offset;
		timestamp = Date.now();
		clearInterval(ticker);
		ticker = setInterval(track, 100);

		e.preventDefault();
		e.stopPropagation();
		return false;
	}
	
	function drag(e) {

		var x, delta;
		if (pressed) {
			x = xpos(e);
			delta = reference - x;
			if (delta > 2 || delta < -2) {
				reference = x;
				scroll(langDir == 'rtl' ? offset - delta : offset + delta);
			}
		}

		e.preventDefault();
		e.stopPropagation();
		return false;
	}
	
	function move(e, type, dir) {
		
		pressed = false;
		clearInterval(ticker);
		
		// Add momentum
		target = offset;
		if (velocity > 10 || velocity < -10) {
			amplitude = 0.8 * velocity;
			target = offset + amplitude;
		}

		if (type == 'release') {

			// If item is clicked, select it as closest
			if (mouseX == reference) {

				var elem = e.target;
				var index = [].slice.call(elem.parentNode.children).indexOf(elem);
				closest = listObj[index];
				console.log('load page content for '+ closest.name);

			} else {

				// If item is dragged, find closest item in list when released
				closest = listObj.reduce(function (prev, curr) {
					if (prev !== null && typeof prev === 'object') { var pos = prev.position; }
					return (Math.abs(curr.position - target) < Math.abs(pos - target) ? curr : prev);
				});
			}
			
		} else {

			// Find the next or prev item
			var op  = operators[dir];
			closest = listObj[op(closest.count, 1)];

			// prevent prev going below 0
			if (!closest) { closest = listObj[0]; }
		};

		// Set destination for view
		target = closest.position;

		// console.log(closest);
		// console.log(listObj);
		
		// Mark the active item
		var active = view.querySelector('.active');
		if (active) { active.classList.remove("active"); };
		view.children[closest.count].classList.add("active");
		
		// Initialize deceleration
		amplitude = target - offset;
		timestamp = Date.now();
		requestAnimationFrame(autoScroll);
		
		// Prevent default actions on elements
		e.preventDefault();
		e.stopPropagation();
		return false;
		
	}
	
	// EVENT LISTENERS
	if (view.offsetWidth > wrapper.offsetWidth) {
		
		if (typeof window.ontouchstart !== 'undefined') {
			view.addEventListener('touchstart', tap);
			view.addEventListener('touchmove', drag);
			view.addEventListener("touchend", function(e){move(e,'release');}, false);
		}
		view.addEventListener('mousedown', tap);
		view.addEventListener('mousemove', drag);
		view.addEventListener("mouseup", function(e){move(e,'release');}, false);

	};

	prevBtn.addEventListener("click", function(e){move(e,'','-');}, false);
	nextBtn.addEventListener("click", function(e){move(e,'','+');}, false);

	// VARS
	max = parseInt(getComputedStyle(view).width, 10) - wrapper.offsetWidth;
	offset = min = 0;
	pressed = false;
	timeConstant = 325; // ms
	
	// BUILD ITEM LIST
	var children = view.children;
	var listObj = [];

	for (var i = 0; i < children.length; i++) {

		var tmpObj = {
			count: i,
			name: children[i].innerHTML,
			position: getPosition(children[i]),
			width: children[i].offsetWidth
		};
		
		listObj.push(tmpObj);
	}

	closest = listObj[0];

	// HELPER FUNCTIONS
	xform = 'transform';
	['webkit', 'Moz', 'O', 'ms'].every(function (prefix) {
		var e = prefix + 'Transform';
		if (typeof view.style[e] !== 'undefined') {
			xform = e;
			return false;
		}
		return true;
	});

	function getPosition(el) {
		var rect = el.getBoundingClientRect(),
			parentRect = el.offsetParent.getBoundingClientRect();

		return langDir == 'rtl' ? parentRect.right - rect.right : rect.left - parentRect.left;
	}

	// function getRelativeClientRect(el) {
	// 	var rect = el.getBoundingClientRect(),
	// 		parentRect = el.offsetParent.getBoundingClientRect();

	// 	return {
	// 		bottom: parentRect.bottom - rect.bottom,
	// 		height: rect.height,
	// 		left: rect.left - parentRect.left,
	// 		right: parentRect.right - rect.right,
	// 		top: rect.top - parentRect.top,
	// 		width: rect.width
	// 	};
	// }

	var operators = {
		'+' : function(a, b) { return a + b; },
		'-' : function(a, b) { return a - b; },
		'*' : function(a, b) { return a * b; },
		'/' : function(a, b) { return a / b; },
	};
};
