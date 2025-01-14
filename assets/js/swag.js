function selectSection(id) {
	$('#main > section').addClass('inactive');
	$(`#${id}`).removeClass('inactive');

	window.location.hash = `#${id}`;
	window.scrollTo(0,0);

	$('#nav').find('a').removeClass('active');
	$(`#nav-${id}`).addClass('active');
}

function setPortfolioVisible(visible) {
	document.getElementById('photo-portfolio-grid').style.display = visible ? '' : 'none';
}

function setAlbumVisible(targetId) {
	Array.from(document.getElementsByClassName('photo-album-grid')).forEach(element => {
		element.style.display = element.id === targetId ? '' : 'none';
	});
}

function setAlbumBackVisibility(visible) {
	Array.from(document.getElementsByClassName('photo-album-back')).forEach(element => {
		element.style.display = visible ? '' : 'none';
	});
}

function activateAlbum(albumName) {
	targetId = albumName + "-photos";

	setAlbumVisible(targetId);
	setAlbumBackVisibility(true);
	setPortfolioVisible(false);
}

function deactivateAlbum() {
	setAlbumVisible('');
	setAlbumBackVisibility(false);
	setPortfolioVisible(true);
}

deactivateAlbum();

document.addEventListener('DOMContentLoaded', function() {
	let hash = window.location.hash;
	let section = hash ? hash.substring(1) : 'projects';

	if (!$('#main > section').map(function() { return this.id; }).get().includes(section)) {
		section = 'projects';
	}

	selectSection(section);
});