/**
 * User: anch
 * Date: 8/7/12
 * Time: 12:52 AM
 */

/*global
    APP: false
 */

(function(){
    'use strict';

    var count = 120;
    var fps = 10;

    function initialize(){
        var animation = new APP.Animation({
            videoSources: [
                {type: 'video/ogg', src: 'video/combine.theora.ogv'},
                {type: 'video/mp4', src: 'video/combine.mp4'}
            ],

            target: 'body > header canvas'
        });
    }

    $(document).ready(initialize);

    BackboneMVC.namespace('APP');

    APP.Animation = (function(){

        var CHECK_INTERVAL = 500;

        function Animation(options){
            options = _.extend({
                videoSources: [],
                target: null
            }, options || {});
            this.options = options;

            if( !this.checkPrerequisite() ){
                throw 'invalid parameters';
            }

            this._loaded = $.Deferred();
            this._$video = null;
            this._$target = $(this.options.target);
            this.videoWidth = 0;
            this.videoHeight = 0;

            $(document).ready(_.bind(this._setup, this));
        }

        _.extend(Animation.prototype, {
            checkPrerequisite: function(){
                if(this.options.videoSources.length === 0){
                    return false;
                }
                var checkFailed = false;
                for(var i = 0; i < this.options.videoSources.length ; i++){
                    var e = this.options.videoSources[i];
                    if(!e.type || !e.src){
                        checkFailed = true;
                        break;
                    }
                }
                if( checkFailed ){
                    return false;
                }
                return $(this.options.target).is('canvas');
            },

            _setup: function(){
                //create video element
                var $video = $('<video/>');
                _.each(this.options.videoSources, function(e){
                    $('<source/>').attr({ type: e.type,src: e.src }).appendTo($video);
                });

                this._$video = $video;
                $video.on('loadedmetadata', _.bind(this._checkLoaded, this));
                $video.insertBefore($(this.options.target)).hide();

                this._$buffer = $('<canvas/>').insertBefore($(this.options.target)).hide();
                this._startup();
            },

            _startup: function(){
                var $video = this._$video;
                var video = $video[0];

                this._loaded.done(_.bind(function(){
                    //retrieve video dimension
                    this.videoWidth = $video.prop('videoWidth');
                    this.videoHeight = $video.prop('videoHeight');

                    this._$buffer.attr({
                        'width': this.videoWidth,
                        'height': this.videoHeight
                    });
                }, this)).done(
                    /* when video is fully loaded, play the video
                     and resolve compatibility issues for loop support */
                    _.bind(function(){
                        if(typeof video.loop === 'boolean'){
                            video.loop = true;
                        }else{
                            // loop property not supported
                            $video.on('ended', function () {
                                video.currentTime = 0;
                                video.play();
                            });
                        }
                        video.play();
                    }, this)).done(
                    /* also start rendering the canvas*/
                    _.bind(this._play, this)
                );
            },

            _checkLoaded: function(){
                var $video = this._$video;
                var videoDuration = $video.prop('duration');

                var timer = setInterval(_.bind(function(){
                    if($video.prop('readyState')){
                        var buffered = $video.prop("buffered").end(0);
                        var percent = 100 * buffered / videoDuration;

                        //If finished buffering buffering quit calling it
                        if (buffered >= videoDuration) {
                            clearInterval(timer);
                            this._loaded.resolve(); //signal deferred object
                        }
                    }
                }, this), CHECK_INTERVAL);
            },

            _play: function(){
                console.log('to play');

                var targetWidth = this._$target.width();
                var targetHeight = this._$target.height();
                var bufferContext = this._$buffer[0].getContext("2d");
                var video = this._$video[0];
                var width = this.videoWidth;
                var height = Math.floor(this.videoHeight / 2);

                var canvasContext = this._$target[0].getContext("2d");

                var ratioHorizontal = targetWidth / width;
                var ratioVertical = targetHeight / height;
                var renderFunction;

                //if the dimension of the target area doesn't match the buffer size, scaling approach needed to be used
                if( ratioHorizontal  !== 1 || ratioVertical !== 1){
                    renderFunction = function(imageData){
                        var scaleCanvas = $("<canvas/>")
                            .attr("width", width)
                            .attr("height", height)[0];

                        var scaleCanvasContext = scaleCanvas.getContext("2d");
                        scaleCanvasContext.putImageData(imageData, 0, 0, 0, 0, width, height);
                        canvasContext.clearRect ( 0, 0, targetWidth, targetHeight);
                        canvasContext.drawImage(scaleCanvas, 0, 0);
                    };
                }else{
                    renderFunction = function(imageData){
                        canvasContext.putImageData(imageData, 0, 0, 0, 0, width, height);
                    };
                }

                this._$target[0].getContext("2d").scale(ratioHorizontal, ratioVertical);

                var playFrame = _.bind(function (){
                    if(!this._detectVisible()){
                        return;
                    }

                    bufferContext.drawImage(video, 0, 0);

                    var image = bufferContext.getImageData(0, 0, width, height),
                        imageData = image.data,
                        alphaData = bufferContext.getImageData(0, height, width, height).data;

                    for (var i = 3, len = imageData.length; i < len; i = i + 4) {
                        imageData[i] = alphaData[i-1];
                    }
                    renderFunction(image);
                }, this);

                setInterval(playFrame, 40);
            },

            _detectVisible: function(){
                return true;
            }
        });
        return Animation;
    })();

}());
