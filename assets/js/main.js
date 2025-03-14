/*
    Prologue by HTML5 UP
    html5up.net | @ajlkn
    Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function($) {

    var $window = $(window),
    $body = $('body'),
    $nav = $('#nav');

    // Breakpoints.
        breakpoints({
            wide:      [ '961px',  '1880px' ],
            normal:    [ '961px',  '1620px' ],
            narrow:    [ '961px',  '1320px' ],
            narrower:  [ '737px',  '960px'  ],
            mobile:    [ null,     '736px'  ]
        });

    // Play initial animations on page load.
        $window.on('load', function() {
            window.setTimeout(function() {
                $body.removeClass('is-preload');
            }, 100);
        });

    // Nav.
        var $nav_a = $nav.find('a');

        $nav_a.on('click', function(e) {
            if ($(this).attr('href').charAt(0) == '#') {
                e.preventDefault();
            }
        });

    // Header (narrower + mobile).

        // Toggle.
            $(
                '<div id="headerToggle"><div id="headerToggleInside">' +
                    '<a href="#header" class="toggle"></a>' +
                '</div></div>'
            ).appendTo($body);

        // Header.
            $('#header')
                .panel({
                    delay: 500,
                    // hideOnClick: true,
                    hideOnSwipe: true,
                    // resetScroll: true,
                    side: 'left',
                    target: $body,
                    visibleClass: 'header-visible'
                });

})(jQuery);