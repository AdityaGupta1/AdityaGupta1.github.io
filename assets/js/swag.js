// the following code is pretty terrible but I don't want to use a web framework and this works well enough, so...

function selectSection(id, subsection = "", updateHash = true) {
  $("#main > section").addClass("inactive");
  $("#" + id).removeClass("inactive");

  if (updateHash) {
    if (id === "projects" && subsection === "") {
      var h = window.location.hash;
      if (h && h !== "#projects") {
        history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search
        );
      }
    } else {
      var newHash = "#" + id;
      if (subsection != "") {
        newHash += "_" + subsection;
      }
      window.location.hash = newHash;
    }
  }
  window.scrollTo(0, 0);

  $("#nav").find("a").removeClass("active");
  $("#nav-" + id).addClass("active");

  if (document.body.classList.contains("header-visible")) {
    document.getElementById("headerToggle").children[0].click();
  }
}

function setPortfolioVisible(visible) {
  var visibilityStyleText = visible ? "" : "none";
  document.getElementById("photo-portfolio-grid-all").style.display =
    visibilityStyleText;
}

function setAlbumVisible(targetId) {
  Array.from(document.getElementsByClassName("photo-album")).forEach(function (
    element
  ) {
    element.style.display = element.id === targetId ? "" : "none";
  });
}

function setAlbumBackVisibility(visible) {
  Array.from(document.getElementsByClassName("photo-album-back")).forEach(
    function (element) {
      element.style.display = visible ? "" : "none";
    }
  );
}

function activateAlbum(albumName) {
  var targetId = "photos-" + albumName;

  if (!document.getElementById(targetId)) {
    return false;
  }

  setAlbumVisible(targetId);
  setAlbumBackVisibility(true);
  setPortfolioVisible(false);

  $("html, body").scrollTop(0);

  window.location.hash = "#photography_" + albumName;

  return true;
}

function deactivateAlbum(setHash = true) {
  setAlbumVisible("");
  setAlbumBackVisibility(false);
  setPortfolioVisible(true);

  if (setHash) {
    window.location.hash = "#photography";
  }
}

deactivateAlbum(false);

function setSectionFromHash() {
  var section = "projects";
  var subsection = "";

  var hash = window.location.hash;
  var hasMeaningfulHash = hash.length > 1;
  if (hasMeaningfulHash) {
    var split = hash.substring(1).split("_");
    section = split[0];
    if (split.length > 1) {
      subsection = split[1];
    }
  }

  if (
    !$("#main > section")
      .map(function () {
        return this.id;
      })
      .get()
      .includes(section)
  ) {
    section = "projects";
  }

  selectSection(section, subsection, hasMeaningfulHash);

  switch (section) {
    case "photography":
      if (!activateAlbum(subsection)) {
        deactivateAlbum();
      }
      break;
    default:
      break;
  }

  document.getElementById("main-flex").classList.remove("main-flex-hidden");
}

function runSectionFromHashWhenReady() {
  var p = window.__whenAlbumsReady || Promise.resolve();
  return p.then(function () {
    setSectionFromHash();
  });
}

document.addEventListener("DOMContentLoaded", runSectionFromHashWhenReady);
window.addEventListener("hashchange", runSectionFromHashWhenReady);

$(function () {
  $("#nav").on("click", "a[data-section]", function (e) {
    e.preventDefault();
    var section = $(this).data("section");
    if (section === "photography") {
      selectSection("photography");
      deactivateAlbum();
    } else {
      selectSection(section);
    }
  });
});
