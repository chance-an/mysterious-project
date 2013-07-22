define(['APP/UI'], function(UI){
    'use strict';

    var STATES = {
        'fixed': {
            id : 'fixed',
            isLayoutChanged: function(){
                var $mainContainer = $('#main-container');
                var $crystal = $('#crystal');
                var viewportSize = UI.getViewportSize();
                var scrollPositionLimit = $mainContainer.offset().top + $crystal.height() / 2 -
                    viewportSize.height / 2;

                return $(document).scrollTop() < scrollPositionLimit;
            },

            changeTo: function(){
                var $crystal = $('.crystal-wrapper');
                $crystal.css({
                    position: 'fixed',
                    top: UI.getViewportSize().height / 2 - $crystal.height() / 2
                });
            }
        },

        'static' : {
            id : 'static',
            isLayoutChanged: function(){
                var scrollPosition = $(document).scrollTop();
                var $crystal = $('#crystal');

                var viewportSize = UI.getViewportSize();
                var yCrystalCenter = $crystal.offset().top + $crystal.height() / 2;
                var scrollPositionLimit = yCrystalCenter - viewportSize.height / 2;

                return scrollPosition > scrollPositionLimit;
            },

            changeTo: function(){
                var $crystal = $('.crystal-wrapper');
                $crystal.css({
                    position: 'absolute',
                    top: 0
                });
            }
        }
    };

    var state = STATES.static;
    var bleedFringe = 10;

    function positionCrystal(){
        if(state.isLayoutChanged()){
            state = state === STATES.fixed ? STATES.static : STATES.fixed;
            state.changeTo();
        }
    }

    function bindEvents(){
        $(window).on('scroll', _.debounce(Crystal.positionCrystal, 10) );
    }

    function getArea(){
        var $crystal = $('#crystal');
        var width = $crystal.width() + bleedFringe * 2;
        var top = $crystal.offset().top - bleedFringe;
        var height = $crystal.height() + bleedFringe * 2;
        var left = $crystal.offset().left - bleedFringe;

        return {
            top: top,
            bottom: top + height,
            left : left,
            right : left + width
        };
    }

    var Crystal = {
        positionCrystal : positionCrystal,
        bindEvents: bindEvents,
        getArea: getArea
    };

    return Crystal;
});
