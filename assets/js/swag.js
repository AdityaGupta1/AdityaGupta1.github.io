function selectSection(id) {
	$('#main > section').addClass('inactive');
	$(`#${id}`).removeClass('inactive');

	window.location.hash = `#${id}`;
	window.scrollTo(0,0);

	$('#nav').find('a').removeClass('active');
	$(`#nav-${id}`).addClass('active');
}

document.addEventListener('DOMContentLoaded', function() {
	let hash = window.location.hash;
	let section = hash ? hash.substring(1) : 'projects';

	if (!$('#main > section').map(function() { return this.id; }).get().includes(section)) {
		section = 'projects';
	}

	selectSection(section);
});