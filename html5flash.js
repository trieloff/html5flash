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
  currentSrc: this.src,
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
  paused: 0.0,
  defaultPlaybackRate: 1.0,
  //TimeRanges - readonly
  played: new TimeRanges(),
  seekable: new TimeRanges(),
  ended: false,
  autoplay: false,
  loop: false,
  controls: false,
  volume: 0,
  muted: false,
  
  init: function(element) {
    this.domElement = element;
    this.src = this.domElement.getAttribute("src");
    this.autobuffer = (this.domElement.getAttribute("autobuffer")=="true");
    this.autoplay = (this.domElement.getAttribute("autoplay")=="true");
    this.loop = (this.domElement.getAttribute("loop")=="true");
    this.controls = (this.domElement.getAttribute("controls")=="true");
  },
  
  //returns void
  load: function() {
    //TODO
  },
  
  //returns String
  canPlayType: function(type) {
    //TODO
  },
  
  play: function() {
    //TODO
  },
  
  pause: function() {
    //TODO
  },
  
  //returns void
  //className, id - String
  //start, end - float
  //pauseOnExit - boolean
  //enterCallback, exitCallback - function
  addCueRange: function(className, id, start, end, pauseOnExit, enterCallback, exitCallback) {
    
  }
  
  
});

var HTMLVideoElement = HTMLMediaElement.extend({
    width: "0px",
    height: "0px",
    videoWidth: 0,
    videoHeight: 0,
    //poster frame
    poster: null,
    
    init: function(element) {
      this._super(element);
    }
});

var HTMLAudioElement = HTMLMediaElement.extend({
    //no additional properties
    init: function(element) {
      this._super(element);
    }
});

function getHTML5Tags() {
  var audios = document.getElementsByTagName("audio");
  var videos = document.getElementsByTagName("video");
  var html5tags = [];
  for (var i=0;i<audios.length;i++) {
    html5tags.push(new HTMLAudioElement(audios[i]));
  }
  
  for (var i=0;i<videos.length;i++) {
    html5tags.push(new HTMLVideoElement(audios[i]));
  }
  return html5tags;
}
