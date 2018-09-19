window.onload = function() {

	var slider = {};
	slider.e = document.getElementById("linkStrengthSlider");
	
	if (slider.e.addEventListener) {
		slider.e.addEventListener("mousewheel", MouseWheelHandler, false);
		slider.e.addEventListener("DOMMouseScroll", MouseWheelHandler, false);
	}
	else slider.e.attachEvent("onmousewheel", MouseWheelHandler);
	
	function MouseWheelHandler(e) {
		e.preventDefault();
		// cross-browser wheel delta
		var e = window.event || e;
		var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
		if(delta < 0){
			slider.e.value -= -5;
		}
		if(delta > 0){
			slider.e.value -= 5;
		}
		UpdateLinkStrength();
		return false;
	}

}
