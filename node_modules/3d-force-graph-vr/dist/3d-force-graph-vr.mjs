import 'aframe-extras';
import 'aframe-forcegraph-component';
import Kapsule from 'kapsule';
import accessorFn from 'accessor-fn';
import { parseToRgb, opacify } from 'polished';

function styleInject(css, ref) {
  if (ref === void 0) ref = {};
  var insertAt = ref.insertAt;
  if (typeof document === 'undefined') {
    return;
  }
  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';
  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }
  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z = ".graph-nav-info {\n  position: absolute;\n  bottom: 5px;\n  width: 100%;\n  text-align: center;\n  color: slategrey;\n  opacity: 0.7;\n  font-size: 10px;\n  font-family: Sans-serif;\n  z-index: 1000;\n}";
styleInject(css_248z);

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

var _3dForceGraphVr = Kapsule({
  props: {
    width: {
      "default": window.innerWidth,
      triggerUpdate: false,
      onChange: function onChange(width, state) {
        if (state.container) state.container.style.width = "".concat(width, "px");
      }
    },
    height: {
      "default": window.innerHeight,
      triggerUpdate: false,
      onChange: function onChange(height, state) {
        if (state.container) state.container.style.height = "".concat(height, "px");
      }
    },
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
    backgroundColor: {
      "default": '#002'
    },
    showNavInfo: {
      "default": true
    },
    nodeRelSize: {
      "default": 4
    },
    // volume per val unit
    nodeId: {
      "default": 'id'
    },
    nodeLabel: {
      "default": 'name'
    },
    nodeDesc: {
      "default": 'desc'
    },
    onNodeHover: {},
    onNodeClick: {},
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
    linkLabel: {
      "default": 'name'
    },
    linkDesc: {
      "default": 'desc'
    },
    onLinkHover: {},
    onLinkClick: {},
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
    // Wipe DOM
    domNode.innerHTML = '';
    state.container = document.createElement('div');
    domNode.appendChild(state.container);
    state.container.style.position = 'relative';
    state.container.style.width = "".concat(state.width, "px");
    state.container.style.height = "".concat(state.height, "px");

    // Add nav info section
    state.container.appendChild(state.navInfo = document.createElement('div'));
    state.navInfo.className = 'graph-nav-info';
    state.navInfo.textContent = 'Mouse drag: look, gamepad/arrow/wasd keys: move';

    // Create scene
    var scene = document.createElement('a-scene');
    scene.setAttribute('embedded', '');
    //scene.setAttribute('stats', null);

    scene.appendChild(state.sky = document.createElement('a-sky'));
    state.sky.setAttribute('radius', 3000);

    // Add camera
    var cameraG;
    scene.appendChild(cameraG = document.createElement('a-entity'));
    cameraG.setAttribute('position', '0 0 300');
    cameraG.setAttribute('movement-controls', 'controls: gamepad, touch; fly: true; speed: 7');
    var camera;
    cameraG.appendChild(camera = document.createElement('a-entity'));
    camera.setAttribute('camera', '');
    camera.setAttribute('position', '0 0 0');
    camera.setAttribute('look-controls', 'pointerLockEnabled: false');
    camera.setAttribute('wasd-controls', 'fly: true; acceleration: 700');

    // display cursor in middle of screen
    // let cursor;
    // camera.appendChild(cursor = document.createElement('a-cursor'));
    // cursor.setAttribute('color', 'lavender');
    // cursor.setAttribute('opacity', 0.5);
    // cursor.setAttribute('raycaster', 'objects: ----none----'); // disable cursor raycaster

    // Setup tooltip
    var tooltipEl;
    camera.appendChild(tooltipEl = document.createElement('a-text'));
    tooltipEl.setAttribute('position', '0 -0.3 -1');
    tooltipEl.setAttribute('width', 2);
    tooltipEl.setAttribute('align', 'center');
    tooltipEl.setAttribute('color', 'lavender');
    tooltipEl.setAttribute('value', '');

    // Setup sub-tooltip
    var subTooltipEl;
    camera.appendChild(subTooltipEl = document.createElement('a-text'));
    subTooltipEl.setAttribute('position', '0 -0.4 -1');
    subTooltipEl.setAttribute('width', 1.3);
    subTooltipEl.setAttribute('align', 'center');
    subTooltipEl.setAttribute('color', 'lavender');
    subTooltipEl.setAttribute('value', '');

    // Setup mouse cursor and laser raycasting controls
    state.raycasterEls = [];
    var mouseCursor;
    scene.appendChild(mouseCursor = document.createElement('a-entity'));
    mouseCursor.setAttribute('cursor', 'rayOrigin: mouse; mouseCursorStylesEnabled: true');
    mouseCursor.setAttribute('raycaster', 'objects: [forcegraph]; interval: 100');
    state.raycasterEls.push(mouseCursor);
    ['left', 'right'].forEach(function (hand) {
      var laser;
      cameraG.appendChild(laser = document.createElement('a-entity'));
      laser.setAttribute('laser-controls', "hand: ".concat(hand, "; model: false;")); // Oculus touch offsets are slightly off
      laser.setAttribute('raycaster', 'objects: [forcegraph]; interval: 100; lineColor: steelblue; lineOpacity: 0.85');
      state.raycasterEls.push(laser);
    });

    // Add forcegraph entity
    scene.appendChild(state.forcegraph = document.createElement('a-entity'));
    state.forcegraph.setAttribute('forcegraph', null);

    // attach scene
    state.container.appendChild(scene);

    // update tooltips
    state.forcegraph.setAttribute('forcegraph', Object.assign.apply(Object, _toConsumableArray(['node', 'link'].map(function (t) {
      var cct = {
        node: 'Node',
        link: 'Link'
      }[t]; // camel-case version
      return _defineProperty({}, "on".concat(cct, "Hover"), function onHover(obj, prevObj) {
        var label = obj ? accessorFn(state["".concat(t, "Label")])(obj) || '' : '';
        var subLabel = obj ? accessorFn(state["".concat(t, "Desc")])(obj) || '' : '';
        tooltipEl.setAttribute('value', label);
        subTooltipEl.setAttribute('value', subLabel);
        state["on".concat(cct, "Hover")] && state["on".concat(cct, "Hover")](obj, prevObj);
      });
    }))));
  },
  update: function update(state, changedProps) {
    if (changedProps.hasOwnProperty('backgroundColor')) {
      var alpha = parseToRgb(state.backgroundColor).alpha;
      if (alpha === undefined) alpha = 1;
      state.sky.setAttribute('color', opacify(1, state.backgroundColor));
      state.sky.setAttribute('opacity', alpha);
    }
    changedProps.hasOwnProperty('showNavInfo') && (state.navInfo.style.display = state.showNavInfo ? null : 'none');

    // deactivate raycasting against the forcegraph if no interaction props are set
    var isInteractive = ['onNodeHover', 'onLinkHover', 'onNodeClick', 'onLinkClick'].some(function (p) {
      return state[p];
    }) || ['nodeLabel', 'linkLabel'].some(function (p) {
      return state[p] !== 'name';
    }) || ['nodeDesc', 'linkDesc'].some(function (p) {
      return state[p] !== 'desc';
    });
    state.raycasterEls.forEach(function (el) {
      return el.setAttribute('raycaster', isInteractive ? 'objects: [forcegraph]; interval: 100' : 'objects: __none__');
    });
    var passThroughProps = ['jsonUrl', 'numDimensions', 'dagMode', 'dagLevelDistance', 'dagNodeFilter', 'onDagError', 'nodeRelSize', 'nodeId', 'onNodeClick', 'nodeVal', 'nodeResolution', 'nodeVisibility', 'nodeColor', 'nodeAutoColorBy', 'nodeOpacity', 'nodeThreeObject', 'nodeThreeObjectExtend', 'linkSource', 'linkTarget', 'onLinkClick', 'linkVisibility', 'linkColor', 'linkAutoColorBy', 'linkOpacity', 'linkWidth', 'linkResolution', 'linkCurvature', 'linkCurveRotation', 'linkMaterial', 'linkThreeObject', 'linkThreeObjectExtend', 'linkPositionUpdate', 'linkDirectionalArrowLength', 'linkDirectionalArrowColor', 'linkDirectionalArrowRelPos', 'linkDirectionalArrowResolution', 'linkDirectionalParticles', 'linkDirectionalParticleSpeed', 'linkDirectionalParticleWidth', 'linkDirectionalParticleColor', 'linkDirectionalParticleResolution', 'forceEngine', 'd3AlphaMin', 'd3AlphaDecay', 'd3VelocityDecay', 'ngraphPhysics', 'warmupTicks', 'cooldownTicks', 'cooldownTime', 'onEngineTick', 'onEngineStop'];
    var newProps = Object.assign.apply(Object, [{}].concat(_toConsumableArray(Object.entries(state).filter(function (_ref3) {
      var _ref4 = _slicedToArray(_ref3, 2),
        prop = _ref4[0],
        val = _ref4[1];
      return changedProps.hasOwnProperty(prop) && passThroughProps.indexOf(prop) !== -1 && val !== undefined && val !== null;
    }).map(function (_ref5) {
      var _ref6 = _slicedToArray(_ref5, 2),
        key = _ref6[0],
        val = _ref6[1];
      return _defineProperty({}, key, val);
    })), _toConsumableArray(Object.entries(state.graphData).map(function (_ref8) {
      var _ref9 = _slicedToArray(_ref8, 2),
        key = _ref9[0],
        val = _ref9[1];
      return _defineProperty({}, key, val);
    }))));
    state.forcegraph.setAttribute('forcegraph', newProps);
  }
});

export { _3dForceGraphVr as default };
