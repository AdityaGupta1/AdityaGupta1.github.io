function selectSection(id) {
    $('#main > section').addClass('inactive');
    $(`#${id}`).removeClass('inactive');

    window.location.hash = `#${id}`;
    window.scrollTo(0,0);

    $('#nav').find('a').removeClass('active');
    $(`#nav-${id}`).addClass('active');
}

function setPortfolioVisible(visible) {
    visibilityStyleText = visible ? '' : 'none';
    document.getElementById('photo-portfolio-grid').style.display = visibilityStyleText;
    document.getElementById('photography-click-advice').style.display = visibilityStyleText;
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

    if (!document.getElementById(targetId)) {
        return;
    }

    setAlbumVisible(targetId);
    setAlbumBackVisibility(true);
    setPortfolioVisible(false);

    $('html, body').animate({ scrollTop: 0 }, 'smooth');

    window.location.hash = `#photography_${albumName}`;
}

function deactivateAlbum(setHash = true) {
    setAlbumVisible('');
    setAlbumBackVisibility(false);
    setPortfolioVisible(true);

    if (setHash) {
        window.location.hash = '#photography';
    }
}

deactivateAlbum(false);

document.addEventListener('DOMContentLoaded', function() {
    let section = 'projects';
    let subsection = '';

    const hash = window.location.hash;
    if (hash) {
        const split = hash.substring(1).split('_');
        section = split[0];
        if (split.length > 1) {
            subsection = split[1];
        }
    }

    if (!$('#main > section').map(function() { return this.id; }).get().includes(section)) {
        section = 'projects';
    }

    selectSection(section);

    switch (section) {
        case 'photography':
            activateAlbum(subsection);
            break;
        default:
            break;
    }

    document.getElementById('main-flex').style = ''; // show all content only after properly setting section
});