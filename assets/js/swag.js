function selectSection(id) {
	$('#main > section').addClass('inactive');
	$(`#${id}`).removeClass('inactive');
	window.scrollTo(0,0); 
}

document.addEventListener('DOMContentLoaded', function() {
	selectSection('projects');
});