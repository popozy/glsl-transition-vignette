import createGlslTransition from "glsl-transition";
import createTexture from "gl-texture2d";
import WeakMap from "weakmap-shim";

function SharedCache () {
}

SharedCache.prototype = {
  init: function (width, height, dpr) {
    dpr = dpr || 1;
    var canvasTransition = document.createElement("canvas");
    canvasTransition.width = dpr * width;
    canvasTransition.height = dpr * height;
    var gl = canvasTransition.getContext("webgl");
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    this.gl = gl;
    this.canvasTransition = canvasTransition;
    this.transitions = {};
  },
  resize: function (width, height, dpr) {
    dpr = dpr || 1;
    this.canvasTransition.width = dpr * width;
    this.canvasTransition.height = dpr * height;
  },
  destroy: function () {
    for (var k in this.transitions) {
      this.transitions[k].transition.dispose();
    }
    this._Transition = null;
    this.transitions = null;
    this.canvasTransition = null;
  },
  getAllIds: function () {
    return Object.keys(this.transitions);
  },
  getTransitionDrawer: function (id) {
    return this.transitions[id].render;
  },
  removeTransitionDrawer: function (id) {
    if (this.transitions[id]) {
      this.transitions[id].transition.dispose();
      delete this.transitions[id];
    }
  },
  createTransitionDrawer: function (id, glsl) {
    const gl = this.gl;
    const transition = createGlslTransition(gl, glsl);
    if (this.transitions[id]) {
      this.transitions[id].transition.dispose();
    }
    const textures = new WeakMap();

    function texture (img) {
      if (textures.has(img)) return textures.get(img);
      const t = createTexture(gl, img);
      textures.set(img, t);
      return t;
    }

    const render = (p, from, to, uniforms) => {
      transition.render(p, texture(from), texture(to), uniforms);
      return this.canvasTransition;
    };
    this.transitions[id] = { transition, render };
    return render;
  }

};

SharedCache.create = function (width, height, dpr) {
  var s = new SharedCache();
  s.init(width, height, dpr);
  return s;
};

export default SharedCache;
