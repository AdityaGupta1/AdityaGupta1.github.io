/**
 * Photography: load manifest, render grids and album DOM, bind Fancybox.
 * hd photos = 2560px long side, lossless compression, 100% quality
 * thumbnail photos = 960px long side, 88% quality
 */
(function () {
  function pad3(n) {
    return String(n).padStart(3, "0");
  }

  function normalizeImageEntry(entry) {
    if (typeof entry === "number") {
      return { file: entry, orientation: "h" };
    }
    if (Array.isArray(entry)) {
      return {
        file: entry[0],
        orientation: entry[1] === "v" || entry[1] === "h" ? entry[1] : "h",
      };
    }
    var o = entry.orientation;
    return {
      file: entry.file,
      orientation: o === "v" || o === "h" ? o : "h",
    };
  }

  function bindFancyboxForPhotos() {
    if (typeof Fancybox === "undefined") {
      return;
    }
    Fancybox.defaults.Hash = false;
    Fancybox.bind("[data-fancybox]", {
      on: {
        init: function () {
          var headerToggleInside = document.getElementById("headerToggleInside");
          if (!headerToggleInside) return;
          headerToggleInside.style.opacity = "0";
          headerToggleInside.style.pointerEvents = "none";
        },
        shouldClose: function () {
          var headerToggleInside = document.getElementById("headerToggleInside");
          if (!headerToggleInside) return;
          headerToggleInside.style.opacity = "1";
          headerToggleInside.style.pointerEvents = "";
        },
      },
      Images: {
        protected: true,
      },
    });
  }

  function renderAlbumCover(album, paths, featuredIds, featuredGrid, allGrid) {
    var coverFile = pad3(album.cover);
    var thumbUrl =
      paths.thumbnailBase +
      "/" +
      album.id +
      "/thumbnail/" +
      coverFile +
      ".webp";
    var html =
      '<article class="item photo-album-cover" data-album-id="' +
      album.id +
      '">' +
      "<header>" +
      "<h3>" +
      album.title +
      "</h3>" +
      "<h5>" +
      album.date +
      "</h5>" +
      "</header>" +
      '<a class="image fit">' +
      '<img data-src="' +
      thumbUrl +
      '" class="lazyload" alt="" />' +
      "</a>" +
      "</article>";
    var target = featuredIds.indexOf(album.id) !== -1 ? featuredGrid : allGrid;
    target.insertAdjacentHTML("beforeend", html);
  }

  function renderAlbum(album, paths, container) {
    var el = document.createElement("div");
    el.className = "photo-album";
    el.id = "photos-" + album.id;

    var cells = album.images
      .map(function (raw) {
        var img = normalizeImageEntry(raw);
        var layout = img.orientation === "v" ? "vertical" : "horizontal";
        var filename = pad3(img.file);
        var hdUrl =
          paths.hdBase + "/" + album.id + "/hd/" + filename + ".webp";
        var thumbUrl =
          paths.thumbnailBase +
          "/" +
          album.id +
          "/thumbnail/" +
          filename +
          ".webp";
        return (
          '<div class="' +
          layout +
          '">' +
          '<a href="' +
          hdUrl +
          '" data-fancybox="photos-' +
          album.id +
          '">' +
          '<img data-src="' +
          thumbUrl +
          '" class="lazyload" alt="" />' +
          "</a>" +
          "</div>"
        );
      })
      .join("");

    el.innerHTML =
      "<header>" +
      "<h3>" +
      album.title +
      "</h3>" +
      "<h5>" +
      album.date +
      "</h5>" +
      "</header>" +
      '<div class="grid-container photo-album-grid">' +
      cells +
      "</div>";

    container.appendChild(el);
  }

  function wireAlbumCovers(root) {
    root.addEventListener("click", function (e) {
      var article = e.target.closest(".photo-album-cover[data-album-id]");
      if (!article) return;
      var id = article.getAttribute("data-album-id");
      if (id && typeof window.activateAlbum === "function") {
        window.activateAlbum(id);
      }
    });
  }

  function wireBackButtons(root) {
    root.querySelectorAll(".photo-album-back-button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (typeof window.deactivateAlbum === "function") {
          window.deactivateAlbum();
        }
      });
      btn.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (typeof window.deactivateAlbum === "function") {
            window.deactivateAlbum();
          }
        }
      });
    });
  }

  async function loadManifest() {
    if (window.__ALBUMS_MANIFEST__ != null) {
      return window.__ALBUMS_MANIFEST__;
    }
    if (location.protocol === "file:") {
      throw new Error(
        "Album manifest missing: include assets/js/albums-manifest.js before photos.js, or run: node scripts/sync-albums-manifest.mjs"
      );
    }
    var res = await fetch(
      new URL("assets/data/albums.json", location.href).href,
      { cache: "no-store" }
    );
    if (!res.ok) {
      throw new Error("Failed to load albums: " + res.status);
    }
    return res.json();
  }

  async function loadAndRender() {
    var data = await loadManifest();
    var paths = data.photoPaths || {
      thumbnailBase: "images/photos",
      hdBase: "https://cdn.adityag1.com/images/photos",
    };
    var featuredIds = data.featuredIds || [];
    var albums = data.albums || [];

    var featuredGrid = document.getElementById("featured-grid");
    var allGrid = document.getElementById("all-grid");
    var albumContainer = document.getElementById("photo-album-container");
    var photographySection = document.getElementById("photography");

    if (!featuredGrid || !allGrid || !albumContainer) {
      return;
    }

    for (var i = 0; i < albums.length; i++) {
      renderAlbumCover(albums[i], paths, featuredIds, featuredGrid, allGrid);
      renderAlbum(albums[i], paths, albumContainer);
    }

    if (photographySection) {
      wireAlbumCovers(photographySection);
    }
    if (photographySection) {
      wireBackButtons(photographySection);
    }

    bindFancyboxForPhotos();
  }

  window.__whenAlbumsReady = loadAndRender().catch(function (err) {
    console.error(err);
  });
})();
