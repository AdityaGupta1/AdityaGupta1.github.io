// the following code is pretty terrible but I don't want to use a web framework and this works well enough, so...

function selectSection(id, subsection = '') {
    $('#main > section').addClass('inactive');
    $(`#${id}`).removeClass('inactive');

    let newHash = `#${id}`;
    if (subsection != '') {
        newHash += `_${subsection}`;
    }

    window.location.hash = newHash;
    window.scrollTo(0,0);

    $('#nav').find('a').removeClass('active');
    $(`#nav-${id}`).addClass('active');

    // close nav bar if open on mobile
    if (document.body.classList.contains('header-visible')) {
        document.getElementById('headerToggle').children[0].click();
    }
}

function setPortfolioVisible(visible) {
    visibilityStyleText = visible ? '' : 'none';
    document.getElementById('photo-portfolio-grid-all').style.display = visibilityStyleText;
}

function setAlbumVisible(targetId) {
    Array.from(document.getElementsByClassName('photo-album')).forEach(element => {
        element.style.display = element.id === targetId ? '' : 'none';
    });
}

function setAlbumBackVisibility(visible) {
    Array.from(document.getElementsByClassName('photo-album-back')).forEach(element => {
        element.style.display = visible ? '' : 'none';
    });
}

function activateAlbum(albumName) {
    targetId = `photos-${albumName}`;

    if (!document.getElementById(targetId)) {
        return false;
    }

    setAlbumVisible(targetId);
    setAlbumBackVisibility(true);
    setPortfolioVisible(false);

    $('html, body').scrollTop(0);

    window.location.hash = `#photography_${albumName}`;

    return true;
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

function setSectionFromHash() {
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

    selectSection(section, subsection);

    switch (section) {
        case 'photography':
            if (!activateAlbum(subsection)) {
                deactivateAlbum();
            }
            break;
        default:
            break;
    }

    document.getElementById('main-flex').style = ''; // show all content only after properly setting section
}

document.addEventListener('DOMContentLoaded', setSectionFromHash);
window.addEventListener('hashchange', setSectionFromHash);

Fancybox.defaults.Hash = false;
Fancybox.bind("[data-fancybox]", {
    on: {
        "init": (fancybox, event) => {
            const headerToggleInside = document.getElementById('headerToggleInside');
            headerToggleInside.style.opacity = '0';
            headerToggleInside.style.pointerEvents = 'none';
        },
        "shouldClose": (fancybox, event) => {
            const headerToggleInside = document.getElementById('headerToggleInside');
            headerToggleInside.style.opacity = '1';
            headerToggleInside.style.pointerEvents = '';
        },
    },
    Images: {
        protected: true
    },
  });
