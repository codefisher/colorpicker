window.addEventListener('load', function(event) {
	if(document.location.hash == '') {
		document.location = document.location.href + "#color";
	}
	startup();
});