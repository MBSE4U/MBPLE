import 'aframe-forcegraph-component';
import Kapsule from 'kapsule';

function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
function _arrayWithHoles(r) {
  if (Array.isArray(r)) return r;
}
function _arrayWithoutHoles(r) {
  if (Array.isArray(r)) return _arrayLikeToArray(r);
}
function _defineProperty(e, r, t) {
  return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: true,
    configurable: true,
    writable: true
  }) : e[r] = t, e;
}
function _iterableToArray(r) {
  if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
}
function _iterableToArrayLimit(r, l) {
  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t) {
    var e,
      n,
      i,
      u,
      a = [],
      f = true,
      o = false;
    try {
      if (i = (t = t.call(r)).next, 0 === l) ; else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
    } catch (r) {
      o = true, n = r;
    } finally {
      try {
        if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
      } finally {
        if (o) throw n;
      }
    }
    return a;
  }
}
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function (r) {
      return Object.getOwnPropertyDescriptor(e, r).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread2(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), true).forEach(function (r) {
      _defineProperty(e, r, t[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
    });
  }
  return e;
}
function _slicedToArray(r, e) {
  return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
}
function _toConsumableArray(r) {
  return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
}
function _toPrimitive(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r);
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == typeof i ? i : i + "";
}
function _unsupportedIterableToArray(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
  }
}

//

var _3dForceGraphAr = Kapsule({
  props: {
    width: {},
    height: {},
    yOffset: {
      "default": 1.5
    },
    // marker size units
    glScale: {
      "default": 200
    },
    // gl units per marker width
    jsonUrl: {},
    graphData: {
      "default": {
        nodes: [],
        links: []
      }
    },
    numDimensions: {
      "default": 3
    },
    dagMode: {},
    dagLevelDistance: {},
    dagNodeFilter: {
      "default": function _default() {
        return true;
      }
    },
    onDagError: {
      "default": undefined
    },
    nodeRelSize: {
      "default": 4
    },
    // volume per val unit
    nodeId: {
      "default": 'id'
    },
    nodeVal: {
      "default": 'val'
    },
    nodeResolution: {
      "default": 8
    },
    // how many slice segments in the sphere's circumference
    nodeVisibility: {
      "default": true
    },
    nodeColor: {
      "default": 'color'
    },
    nodeAutoColorBy: {},
    nodeOpacity: {
      "default": 0.75
    },
    nodeThreeObject: {},
    nodeThreeObjectExtend: {
      "default": false
    },
    linkSource: {
      "default": 'source'
    },
    linkTarget: {
      "default": 'target'
    },
    linkVisibility: {
      "default": true
    },
    linkColor: {
      "default": 'color'
    },
    linkAutoColorBy: {},
    linkOpacity: {
      "default": 0.2
    },
    linkWidth: {
      "default": 0
    },
    linkResolution: {
      "default": 6
    },
    // how many radial segments in each line cylinder's geometry
    linkCurvature: {
      "default": 0
    },
    linkCurveRotation: {
      "default": 0
    },
    linkMaterial: {},
    linkThreeObject: {},
    linkThreeObjectExtend: {
      "default": false
    },
    linkPositionUpdate: {},
    linkDirectionalArrowLength: {
      "default": 0
    },
    linkDirectionalArrowColor: {},
    linkDirectionalArrowRelPos: {
      "default": 0.5
    },
    // value between 0<>1 indicating the relative pos along the (exposed) line
    linkDirectionalArrowResolution: {
      "default": 8
    },
    // how many slice segments in the arrow's conic circumference
    linkDirectionalParticles: {
      "default": 0
    },
    // animate photons travelling in the link direction
    linkDirectionalParticleSpeed: {
      "default": 0.01
    },
    // in link length ratio per frame
    linkDirectionalParticleWidth: {
      "default": 0.5
    },
    linkDirectionalParticleColor: {},
    linkDirectionalParticleResolution: {
      "default": 4
    },
    // how many slice segments in the particle sphere's circumference
    onNodeHover: {},
    onNodeClick: {},
    onLinkHover: {},
    onLinkClick: {},
    forceEngine: {
      "default": 'd3'
    },
    // d3 or ngraph
    d3AlphaMin: {
      "default": 0
    },
    d3AlphaDecay: {
      "default": 0.0228
    },
    d3VelocityDecay: {
      "default": 0.4
    },
    ngraphPhysics: {},
    warmupTicks: {
      "default": 0
    },
    // how many times to tick the force engine at init before starting to render
    cooldownTicks: {},
    cooldownTime: {
      "default": 15000
    },
    // ms
    onEngineTick: {},
    onEngineStop: {}
  },
  methods: _objectSpread2(_objectSpread2({}, Object.assign.apply(Object, [{}].concat(_toConsumableArray(['getGraphBbox', 'emitParticle', 'd3Force', 'd3ReheatSimulation', 'refresh'].map(function (method) {
    return _defineProperty({}, method, function (state) {
      var aframeComp = state.forcegraph.components.forcegraph;
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      var returnVal = aframeComp[method].apply(aframeComp, args);
      return returnVal === aframeComp ? this // chain based on this object, not the inner aframe component
      : returnVal;
    });
  }))))), {}, {
    _destructor: function _destructor() {
      this.graphData({
        nodes: [],
        links: []
      });
    }
  }),
  init: function init(domNode, state) {
    var _ref2 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      _ref2$markerAttrs = _ref2.markerAttrs,
      markerAttrs = _ref2$markerAttrs === void 0 ? {
        preset: 'hiro'
      } : _ref2$markerAttrs;
    // Wipe DOM
    domNode.innerHTML = '';
    state.container = document.createElement('div');
    domNode.appendChild(state.container);

    // Create scene
    var scene = document.createElement('a-scene');
    scene.setAttribute('embedded', '');
    scene.setAttribute('vr-mode-ui', 'enabled: false');
    scene.setAttribute('arjs', 'debugUIEnabled: false;');
    var arMarker = document.createElement('a-marker');
    // add marker attributes
    Object.entries(markerAttrs).forEach(function (_ref3) {
      var _ref4 = _slicedToArray(_ref3, 2),
        attr = _ref4[0],
        val = _ref4[1];
      return arMarker.setAttribute(attr, val);
    });
    scene.appendChild(arMarker);

    // Setup raycaster cursor
    var mouseCursor;
    scene.appendChild(mouseCursor = document.createElement('a-entity'));
    mouseCursor.setAttribute('cursor' /*, 'rayOrigin: mouse'*/); // mouse raycaster has accuracy issues in ar.js: https://github.com/AR-js-org/AR.js/issues/40
    mouseCursor.setAttribute('raycaster', 'objects: [forcegraph]');

    // Add forcegraph entity
    state.forcegraph = document.createElement('a-entity');
    state.forcegraph.setAttribute('forcegraph', null);
    arMarker.appendChild(state.forcegraph);
    var cameraEntity = document.createElement('a-entity');
    cameraEntity.setAttribute('camera', '');
    scene.appendChild(cameraEntity);

    // attach scene
    state.container.appendChild(scene);
    //domNode.appendChild(scene);
  },
  update: function update(state, changedProps) {
    changedProps.hasOwnProperty('width') && state.width && (state.container.style.width = "".concat(state.width, "px"));
    changedProps.hasOwnProperty('height') && state.height && (state.container.style.height = "".concat(state.height, "px"));
    changedProps.hasOwnProperty('glScale') && state.forcegraph.setAttribute('scale', _toConsumableArray(new Array(3)).map(function () {
      return 1 / state.glScale;
    }).join(' '));
    changedProps.hasOwnProperty('yOffset') && state.forcegraph.setAttribute('position', "0 ".concat(state.yOffset, " 0"));
    var passThroughProps = ['jsonUrl', 'numDimensions', 'dagMode', 'dagLevelDistance', 'dagNodeFilter', 'onDagError', 'nodeRelSize', 'nodeId', 'nodeVal', 'nodeResolution', 'nodeVisibility', 'nodeColor', 'nodeAutoColorBy', 'nodeOpacity', 'nodeThreeObject', 'nodeThreeObjectExtend', 'linkSource', 'linkTarget', 'linkVisibility', 'linkColor', 'linkAutoColorBy', 'linkOpacity', 'linkWidth', 'linkResolution', 'linkCurvature', 'linkCurveRotation', 'linkMaterial', 'linkThreeObject', 'linkThreeObjectExtend', 'linkPositionUpdate', 'linkDirectionalArrowLength', 'linkDirectionalArrowColor', 'linkDirectionalArrowRelPos', 'linkDirectionalArrowResolution', 'linkDirectionalParticles', 'linkDirectionalParticleSpeed', 'linkDirectionalParticleWidth', 'linkDirectionalParticleColor', 'linkDirectionalParticleResolution', 'onNodeHover', 'onNodeClick', 'onLinkHover', 'onLinkClick', 'forceEngine', 'd3AlphaMin', 'd3AlphaDecay', 'd3VelocityDecay', 'ngraphPhysics', 'warmupTicks', 'cooldownTicks', 'cooldownTime', 'onEngineTick', 'onEngineStop'];
    var newProps = Object.assign.apply(Object, [{}].concat(_toConsumableArray(Object.entries(state).filter(function (_ref5) {
      var _ref6 = _slicedToArray(_ref5, 2),
        prop = _ref6[0],
        val = _ref6[1];
      return changedProps.hasOwnProperty(prop) && passThroughProps.indexOf(prop) !== -1 && val !== undefined && val !== null;
    }).map(function (_ref7) {
      var _ref8 = _slicedToArray(_ref7, 2),
        key = _ref8[0],
        val = _ref8[1];
      return _defineProperty({}, key, val);
    })), _toConsumableArray(Object.entries(state.graphData).map(function (_ref10) {
      var _ref11 = _slicedToArray(_ref10, 2),
        key = _ref11[0],
        val = _ref11[1];
      return _defineProperty({}, key, val);
    }))));
    state.forcegraph.setAttribute('forcegraph', newProps);
  }
});

export { _3dForceGraphAr as default };
