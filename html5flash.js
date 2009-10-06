//from http://ejohn.org/blog/simple-javascript-inheritance/
// Inspired by base2 and Prototype
(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
  // The base Class implementation (does nothing)
  this.Class = function(){};
  
  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;
    
    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;
    
    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" && 
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;
            
            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];
            
            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);        
            this._super = tmp;
            
            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }
    
    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }
    
    // Populate our constructed prototype object
    Class.prototype = prototype;
    
    // Enforce the constructor to be what we expect
    Class.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;
    
    return Class;
  };
})();

//considered for removal in HTML5
var TimeRanges = Class.extend({
    //readonly
    length: 0,
    start: function(index) {
      return this.starts[index];
    },
    end: function(index) {
      return this.ends[index];
    },
    //private
    starts: [],
    ends: [],
    add: function(start, end) {
      this.starts.push(start);
      this.ends.push(end);
      this.length++;
    }
});

var MediaError = Class.extend({
    //readonly
    code: -1,
    init: function(code) {
      this.code = code;
    },
    
    MEDIA_ERR_ABORTED: 1,
    MEDIA_ERR_NETWORK: 2,
    MEDIA_ERR_DECODE:3,
    MEDIA_ERR_SRC_NOT_SUPPORTED: 4
});

var HTMLMediaElement = Class.extend({
  //network state
  NETWORK_EMPTY: 0,
  NETWORK_IDLE: 1,
  NETWORK_LOADING: 2,
  NETWORK_LOADED: 3,
  NETWORK_NO_SOURCE: 4,
  
  //ready state
  HAVE_NOTHING: 0,
  HAVE_METADATA: 1,
  HAVE_CURRENT_DATA: 2,
  HAVE_FUTURE_DATA: 3,
  HAVE_ENOUGH_DATA: 4,
  
  // error state
  //readonly attribute MediaError error;
  error: 0,
  
  //attribute DOMString src;
  src: null,
  //readonly attribute currentSrc
  currentSrc: null,
  //readonly attribute unsigned short networkState
  networkState: this.NETWORK_EMPTY,
  //attribute boolean autobuffer
  autobuffer: false,
  //readonly attribute TimeRanges buffered
  buffered: null,
  //readonly attribute
  readyState: this.HAVE_NOTHING,
  seeking: false,
  
  //playback state (floats)
  currentTime: 0.0,
  //readonly
  startTime: 0.0,
  //readonly
  duration: 0.0,
  paused: true,
  defaultPlaybackRate: 1.0,
  playbackRate: 1.0,
  //TimeRanges - readonly
  played: new TimeRanges(),
  seekable: new TimeRanges(),
  ended: false,
  autoplay: false,
  loop: false,
  controls: false,
  volume: 1,
  muted: false,
  listeners: {},
  
  init: function(element) {
    this.domElement = element;
    this.domElement.wrapper = this;
    this.src = this.domElement.getAttribute("src");
    this.autobuffer = (this.domElement.getAttribute("autobuffer")!=null);
    this.autoplay = (this.domElement.getAttribute("autoplay")!=null);
    this.loop = (this.domElement.getAttribute("loop")!=null);
    this.controls = (this.domElement.getAttribute("controls")!=null);
    this.load();
    
    if (this.domElement.getAttribute("id")) {
      this.id = this.domElement.getAttribute("id");
    } else {
      this.id = "id" + (new Date().getTime());
    }
    this.sound = soundManager.createSound(this.createSound());
    
    this.throwEvent("loadstart");
    this.sound.wrapper = this;
  },
  
  createSound: function() {
    var that = this;
    return {
      id: that.id
    };
  },
    
  onfinish: function(e) {
    this.wrapper.currentTime = 0;
    this.wrapper.throwEvent("timeupdate");
    if (this.wrapper.loop) {
      this.wrapper.play();
    } else {
      this.wrapper.ended = true;
      this.wrapper.throwEvent("ended");
    }
  },
  
  onid3: function() {
    this.wrapper.HAVE_METADATA;
    this.wrapper.throwEvent("loadedmetadata");
  },
  
  whileloading: function() {
    if (this.readyState==3) {
      this.wrapper.networkState = this.wrapper.NETWORK_LOADED;
      
      var durationchange = (this.wrapper.duration!=this.duration / 1000) ? true : false;
      this.wrapper.duration = this.duration / 1000;
      
      this.wrapper.readyState = this.wrapper.HAVE_ENOUGH_DATA;
      this.wrapper.updateSeekable(this.duration / 1000);
      if (durationchange) this.wrapper.throwEvent("durationchange");
      this.wrapper.throwEvent("load");
    } else if (this.readyState==2) {
      //error
      this.wrapper.networkState = this.wrapper.NETWORK_NO_SOURCE;
      this.wrapper.throwEvent("error");
    } else if (this.readyState==1) {
      //loading
      this.wrapper.networkState = this.wrapper.NETWORK_LOADING;
      var durationchange = (this.wrapper.duration!=this.durationEstimate / 1000) ? true : false;
      this.wrapper.duration = this.durationEstimate / 1000;
      
      if (this.duration==this.position) {
        this.wrapper.readyState = this.wrapper.HAVE_CURRENT_DATA;
        this.wrapper.throwEvent("stalled");
      } else if (this.duration>this.position) {
        var canplay = (this.wrapper.readyState!=this.wrapper.HAVE_FUTURE_DATA) ? true : false;
        this.wrapper.readyState = this.wrapper.HAVE_FUTURE_DATA;
        if (canplay) this.wrapper.throwEvent("canplay");
        this.wrapper.throwEvent("progress");
      }
      
      if (!this.wrapper.loadeddata) {
        this.wrapper.loadeddata = true;
        this.wrapper.throwEvent("loadeddata");
      }
      
      if (durationchange) this.wrapper.throwEvent("durationchange");
      this.wrapper.updateSeekable(this.duration / 1000);
    } else if (this.readyState==0) {
      //uninitialized
      this.wrapper.networkState = this.wrapper.NETWORK_EMPTY;
      this.wrapper.throwEvent("emptied");
    }
  },
  
  onload: function(success) {
    if (success) {
      this.wrapper.networkState = this.wrapper.NETWORK_LOADED;
      this.wrapper.readyState = this.wrapper.HAVE_ENOUGH_DATA;
      var durationchange = (this.wrapper.duration!=this.duration / 1000) ? true : false;
      this.wrapper.duration = this.duration / 1000;
      if (durationchange) this.wrapper.throwEvent("durationchange");
      this.wrapper.throwEvent("canplaythrough");
      this.wrapper.throwEvent("load");
    } else {
      this.wrapper.readyState = this.wrapper.HAVE_NOTHING;
      this.wrapper.networkState = this.wrapper.NETWORK_NO_SOURCE;
      this.wrapper.error = new MediaError(MediaError.prototype.NETWORK);
      this.wrapper.throwEvent("error");
    }
  },
  
  whileplaying: function() {
    this.wrapper.currentTime = this.position / 1000;
    this.wrapper.checkCueRanges(this.position / 1000);
    this.wrapper.updatePlayed(this.position / 1000);
    this.wrapper.throwEvent("timeupdate");
  },
  
  //updates the played time range
  updatePlayed: function(currentTime) {
    if (this.played.length==0) {
      //create a new time range
      this.played.add(this.startTime, currentTime);
    } else {
      //extend the last time range
      this.played.ends[this.played.length-1] = currentTime;
    }
  },
  
  //updates the played time range
  updateSeekable: function(currentTime) {
    if (this.seekable.length==0) {
      //create a new time range
      this.seekable.add(this.startTime, currentTime);
    } else {
      //extend the last time range
      this.seekable.ends[this.seekable.length-1] = currentTime;
    }
  },
  
  play: function() {
    if (this.muted) {
      this.sound.setVolume(0);
    } else {
      this.sound.setVolume(Math.floor(100*Math.max(0, Math.min(1,this.volume))));
    }
    
    if (this.sound.playState==1) {
      this.sound.position = Math.floor(this.currentTime * 1000);
      this.paused = false;
      this.ended = false;
      this.sound.resume();
    } else {
      var that = this;
      this.sound.wrapper = this;
      this.paused = false;
      this.ended = false;
      this.sound.play({
          onfinish: that.onfinish,
          whileplaying: that.whileplaying,
          position: Math.floor(that.startTime * 1000),
          whileloading: that.whileloading,
          onid3: that.onid3
      });
    }
    this.throwEvent("play");
  },
  
  pause: function() {
    this.paused = true;
    this.sound.pause();
    this.throwEvent("pause");
  },

  
  //returns void
  load: function() {
    this.currentSrc = this.src;
    //find the right source
    var candidate = this.domElement.firstChild;
    var maybe = null;
    //loop until we have found a type that works probably
    while(candidate!=null&&this.currentSrc==null) {
      if (candidate.nodeName=="SOURCE"||candidate.nodeName=="source") {
        if (candidate.getAttribute("src")!=null) {
          if (this.canPlayType(candidate.getAttribute("type"))=="probably") {
            this.currentSrc = candidate.getAttribute("src");
          } else if (maybe==null&&this.canPlayType(candidate.getAttribute("type"))=="maybe") {
            maybe = candidate.getAttribute("src");
          }
        }
      }
      candidate = candidate.nextSibling;
    }
    //fall back to the first type that works maybe
    if (this.currentSrc==null&&maybe!=null) {
      this.currentSrc = maybe;
    }
    if (this.currentSrc==null) {
      //media selection failed
      this.error = new MediaError(MediaError.prototype.MEDIA_ERR_SRC_NOT_SUPPORTED);
    }
    //override this in concrete implementations to build the widget
  },
  
  //returns String
  canPlayType: function(type) {
    return "";
  },
  
  addEventListener: function(type, listener, useCapture) {
    if (this.listeners[type]) {
      this.listeners[type].push(listener);
    } else {
      this.listeners[type] = [ listener ];
    }
  },
  
  removeEventListener: function(type, listener, useCapture) {
    var newarray = [];
    if (this.listeners[type]) {
      var oldarray = this.listeners[type];
      for (var i=0;i<oldarray.length;i++) {
        if (oldarray[i]!=listener) {
          newarray.push(oldarray[i]);
        }
      }
    }
    this.listeners[type] = newarray;
  },
  
  throwEvent: function(type) {
    var that = this;
    var e = {
      type: type,
      target: that,
      currentTarget: that,
      eventPhase: 2,
      bubbles: false,
      cancelable: false,
      timeStamp: new Date(),
      stopPropagation: function() {},
      preventDefault: function() {},
      initEvent: function() {}
    };
    
    if (this.listeners[type]) {
      for (var i=0;i<this.listeners[type].length;i++) {
        var listener = this.listeners[type][i];
        try {
          listener.call(this, e);
        } catch (t) {/*go through all event listeners*/}
      }
    }
  },
  
  //returns void
  //className, id - String
  //start, end - float
  //pauseOnExit - boolean
  //enterCallback, exitCallback - function
  addCueRange: function(className, id, start, end, pauseOnExit, enterCallback, exitCallback) {
    if (!this.cueRanges[className]||this.cueRanges[className]==null) {
      this.cueRanges[className] = [];
    }
    
    var cueRange = {
      start: start,
      end: end,
      pauseOnExit: pauseOnExit,
      enterCallback: enterCallback,
      exitCallback: exitCallback,
    };
    this.cueRanges[className].push(cueRange);
  },
  
  removeCueRange: function(className) {
    //reset cue ranges
    cueRanges[className] = [];
  },
  
  //private
  cueRanges: {},
  lastPosition: 0.0,
  
  checkCueRanges: function(currentPosition) {
    try {
      var entering = new Array();
      var exititing = new Array();
      for (className in this.cueRanges) {
        if (this.cueRanges.hasOwnProperty(className)) {
          var cues = this.cueRanges[className];
          for (var i=0;i<cues.length;i++) {
            var cue = cues[i];
            if (currentPosition>this.lastPosition) {
              if (cue.start>this.lastPosition&&cue.start<currentPosition) {
                entering.push(cue);
              }
              if (cue.end>this.lastPosition&&cue.end<currentPosition) {
                exititing.push(cue);
              }
            } else if (currentPosition<this.lastPosition) {
              if (cue.end>this.lastPosition&&cue.end<currentPosition) {
                entering.push(cue);
              }
              if (cue.start>this.lastPosition&&cue.start<currentPosition) {
                exititing.push(cue);
              }
            }
          }
        }
      }
      
      //call the entering events
      for (var i=0;i<entering.length;i++) {
        if (entering[i].enterCallback) {
          entering[i].enterCallback.call(this, entering[i].id);
        }
      }
      //call the exiting events
      for (var i=0;i<exititing.length;i++) {
        if (exititing[i].exitCallback) {
          exititing[i].exitCallback.call(this, exititing[i].id);
        }
        if (exititing[i].pauseOnExit) {
          this.pause();
        }
      }
    } catch (e) {
      console.error(e);
    }
    this.lastPosition = currentPosition;
  },
  
  id: "id" + (new Date().getTime()),
  sound: null
});

var HTMLVideoElement = HTMLMediaElement.extend({
    width: false,
    height: false,
    videoWidth: 0,
    videoHeight: 0,
    //poster frame
    poster: null,
    controls: null,
    
    init: function(element) {
      this.domContainer = document.getElementById("sm2-container");
      /*
      if (this.domContainer==null) {
        element.parentNode.insertBefore(this.domContainer, element);
      }
      */
      
      
      try {
        this._super(element);
      } catch (e) {
        console.error(e);
      }
      this.height = this.domElement.getAttribute("height");
      this.width = this.domElement.getAttribute("width");
      this.poster = this.domElement.getAttribute("poster") || this.domElement.getAttribute("x-poster"); //Safari 4 has buggy support for poster
      
      
      
      this.domContainer.style.position = element.style.position;
      if (this.width) {
        this.domContainer.style.width = this.width + "px";
      }
      if (this.height) {
        this.domContainer.style.height = this.height + "px";
      }
      this.domContainer.style.top = element.style.top;
      this.domContainer.style.left = element.style.left;
      this.domContainer.style.backgroundImage = "url(" + this.poster + ")";
      
      for(var i=0;i<element.childNodes.length;i++) {
        var childNode = element.childNodes[i];
        if ((childNode.nodeType==1)&&(childNode.nodeType!="SOURCE")&&(childNode!=this.domContainer)&&(childNode!=this.controls)) {
          childNode.style.display = "none";
        }
      }
    },
    
    createSound: function() {
      var that = this;
      var soundconfig = {
          id: that.id,
          url: that.currentSrc,
          autoLoad: that.autobuffer,
          autoPlay: that.autoplay,
          whileloading: that.whileloading,
          onid3: that.onid3,
          useMovieStar: true,
          useVideo: true,
          wmode: "transparent"
      };
      
      var controls = document.createElement("div");
      this.controls = controls;
      controls.style.backgroundImage = "url("+html5flash.url+"videocontrols-center.png)";
      controls.style.width = (this.domElement.getAttribute("width") - 64 ) + "px";
      controls.style.height = "16px";
      controls.style.position = "relative";
      controls.style.left = "16px";
      
      var playhead = document.createElement("div");
      controls.appendChild(playhead);
      playhead.innerHTML="o";
      playhead.style.position = "relative";
      playhead.style.cssFloat = "left";
      playhead.style.backgroundImage = "url("+html5flash.url+"videocontrols-slider.png)";
      playhead.style.height = "16px";
      playhead.style.width = "16px";
      playhead.style.textIndent = "16px";
      playhead.style.overflow = "hidden";
      
      var endknob = document.createElement("div");
      controls.appendChild(endknob);
      
      var control = document.createElement("a");
      controls.appendChild(control);
      
      endknob.style.backgroundImage = "url("+html5flash.url+"videocontrols.png)";
      endknob.style.backgroundRepeat = "no-repeat";
      endknob.style.backgroundPosition = "-32px 0px";
      endknob.style.align = "right";
      endknob.style.position = "relative";
      endknob.style.width = "64px";
      endknob.style.height = "16px";
      endknob.style.left = "50px";
      endknob.style.overflow = "hidden";
      endknob.style.cssFloat = "right";
      endknob.style.fontFamily = "Helvetica";
      endknob.style.fontSize = "12px";
      endknob.style.textAlign = "center";
      endknob.style.textIndent = "18px";
      endknob.style.lineHeight = "18px";
      endknob.innerHTML = "00:00";
      
      control.innerHTML = "play/pause";
      control.href="#";
      control.style.backgroundImage = "url("+html5flash.url+"videocontrols.png)";
      control.style.backgroundRepeat = "no-repeat";
      control.style.width = "16px";
      control.style.height = "16px";
      control.style.overflow = "hidden";
      control.style.textIndent = "16px";
      control.style.backgroundPosition = "0px -16px";
      control.style.position = "relative";
      control.style.left = "-32px";
      
      control.style.display = "block";
      control.onclick = function() {
        if (that.paused||that.ended) {
          that.play();
        } else {
          that.pause();
        }
        return false;
      };
      
      this.addEventListener("play", function() {
          control.innerHTML = "pause";
          control.style.backgroundPosition = "0px -0px";
      });
      
      this.addEventListener("pause", function() {
          control.innerHTML = "play";
          control.style.backgroundPosition = "0px -16px";
      });
      
      this.addEventListener("ended", function() {
          control.innerHTML = "play";
          control.style.backgroundPosition = "0px -16px";
      });
    
      this.addEventListener("timeupdate", function() {
          var remaining = this.currentTime;
          var hours = Math.floor(remaining / 3600);
          remaining = remaining -   (hours * 3600);
          var minutes = Math.floor(remaining / 60);
          remaining = remaining -   (minutes * 60);
          remaining = Math.floor(remaining);
          
          var left = ((controls.offsetWidth - 24) * this.currentTime / this.duration);
          if (left) {
            playhead.style.left = Math.floor(left) + "px";
          } else {
            playhead.style.left = "0px";
          }
          
          text = "";
          if (hours>0) {
            text += hours;
            text += ":";
          }
          
          if (minutes<10) {
            text += "0";
          }
          text += minutes;
          text += ":";
          
          if (remaining<10) {
            text += "0";
          }
          text += remaining;
          
          endknob.innerHTML = text;
      });
      
      
      this.domElement.appendChild(controls);
      
      
      return soundconfig;
    },
    
    canPlayType: function(type) {
      if (type.match(/^video\/flv/)) {
        return "probably";
      }
      if (type.match(/^video\/(x-)?m4v/)) {
        return "probably";
      }
      if (type.match(/^video\//)) {
        return "maybe";
      }
      return "";
    }
});

var HTMLAudioElement = HTMLMediaElement.extend({
    //no additional properties
    createSound: function() {
      var that = this;
      var soundconfig = {
          id: that.id,
          url: that.currentSrc,
          autoLoad: that.autobuffer,
          autoPlay: that.autoplay,
          whileloading: that.whileloading,
          onid3: that.onid3
      };
      
      var control = document.createElement("a");
      
      control.innerHTML = "play/pause";
      control.href="#";
      control.style.backgroundImage = "url("+html5flash.url+"audiocontrols.png)";
      control.style.backgroundRepeat = "no-repeat";
      control.style.width = "16px";
      control.style.height = "16px";
      control.style.overflow = "hidden";
      control.style.textIndent = "16px";
      control.style.backgroundPosition = "-16px 0px";
      control.style.display = "block";
      control.onclick = function() {
        if (that.paused||that.ended) {
          that.play();
        } else {
          that.pause();
        }
        return false;
      };
      
      this.addEventListener("play", function() {
          control.innerHTML = "pause";
          control.style.backgroundPosition = "-32px 0px";
      });
      
      this.addEventListener("pause", function() {
          control.innerHTML = "play";
          control.style.backgroundPosition = "-16px 0px";
      });
      
      this.addEventListener("ended", function() {
          control.innerHTML = "play";
          control.style.backgroundPosition = "-16px 0px";
      });
      
      this.domElement.parentNode.insertBefore(control, this.domElement);
      
      
      return soundconfig;
    },
        
    canPlayType: function(type) {
      if (type.match(/^audio\/mp3/)) {
        return "probably";
      }
      if (type.match(/^audio\/wav/)) {
        return "probably";
      }
      if (type.match(/^audio\/(x-)?aiff/)) {
        return "probably";
      }
      if (type.match(/^audio\//)) {
        return "maybe";
      }
      return "";
    }
});

function getHTML5Tags() {  
  var audios = document.getElementsByTagName("audio");
  var videos = document.getElementsByTagName("video");
  var html5tags = [];
  for (var i=0;i<audios.length;i++) {
    if (audios[i].play) {
      html5tags.push(audios[i]);
    } else if (audios[i].wrapper) {
      html5tags.push(audios[i].wrapper);
    } else {
      initSoundManager(audios[i]).audios.push(audios[i]);
      initSoundManager().html5tags = html5tags;
    }
  }
  
  for (var i=0;i<videos.length;i++) {
    if (videos[i].play) {
      html5tags.push(videos[i]);
    } else if (videos[i].wrapper) {
      html5tags.push(videos[i].wrapper);
    } else {
      var onloadfunction = initSoundManager.onload;
      initSoundManager(videos[i]).videos.push(videos[i]);
      initSoundManager().html5tags = html5tags;
    }
  }
  return html5tags;
}

function initSoundManager(media) {
  if (soundManager!=null) {
    return soundManager;
  }
  var container = document.createElement("div");
  container.id = "sm2-container";
  media.appendChild(container);
  
//  document.write("<div id='sm2-container'></div>");
  soundManager = new SoundManager();
  soundManager.url = html5flash.url; // path to directory containing SoundManager2 .SWF file
  soundManager.flashVersion = 9; // flash 9.0r115+ required for MovieStar mode
  soundManager.useMovieStar = true; // enable AAC/MPEG4 video in SM2
  soundManager.allowFullScreen = true; // enable full-screen mode
  soundManager.wmode = 'transparent';
  soundManager.debugMode = false;
  
  soundManager.videos = [];
  soundManager.audios = [];
  
  soundManager.onload = function() {
    for (var i=0;i<soundManager.videos.length;i++) {
      soundManager.html5tags.push(new HTMLVideoElement(soundManager.videos[i]));
    }
    for (var i=0;i<soundManager.audios.length;i++) {
      soundManager.html5tags.push(new HTMLAudioElement(soundManager.audios[i]));
    }
  }
  
  return soundManager;
}
