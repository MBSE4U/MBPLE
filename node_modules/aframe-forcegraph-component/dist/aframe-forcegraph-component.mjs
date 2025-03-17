import ThreeForceGraph from 'three-forcegraph';

/* global AFRAME */
if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}
var parseJson = function parseJson(prop) {
  return typeof prop === 'string' ? JSON.parse(prop) : prop; // already parsed
};
var parseFn = function parseFn(prop) {
  if (typeof prop === 'function') return prop; // already a function
  var geval = eval; // Avoid using eval directly https://github.com/rollup/rollup/wiki/Troubleshooting#avoiding-eval
  try {
    var evalled = geval('(' + prop + ')');
    return evalled;
  } catch (e) {} // Can't eval, not a function
  return null;
};
var parseAccessor = function parseAccessor(prop) {
  if (!isNaN(parseFloat(prop))) {
    return parseFloat(prop);
  } // parse numbers
  if (parseFn(prop)) {
    return parseFn(prop);
  } // parse functions
  return prop; // strings
};

/**
 * 3D Force-Directed Graph component for A-Frame.
 */
if (!AFRAME.components.hasOwnProperty('forcegraph')) {
  AFRAME.registerComponent('forcegraph', {
    schema: {
      jsonUrl: {
        type: 'string',
        "default": ''
      },
      nodes: {
        parse: parseJson,
        "default": []
      },
      links: {
        parse: parseJson,
        "default": []
      },
      numDimensions: {
        type: 'number',
        "default": 3
      },
      dagMode: {
        type: 'string',
        "default": ''
      },
      dagLevelDistance: {
        type: 'number',
        "default": 0
      },
      dagNodeFilter: {
        parse: parseFn,
        "default": function _default() {
          return true;
        }
      },
      onDagError: {
        parse: parseFn,
        "default": undefined
      },
      nodeRelSize: {
        type: 'number',
        "default": 4
      },
      // volume per val unit
      nodeId: {
        type: 'string',
        "default": 'id'
      },
      nodeVal: {
        parse: parseAccessor,
        "default": 'val'
      },
      nodeResolution: {
        type: 'number',
        "default": 8
      },
      // how many slice segments in the sphere's circumference
      nodeVisibility: {
        parse: parseAccessor,
        "default": true
      },
      nodeColor: {
        parse: parseAccessor,
        "default": 'color'
      },
      nodeAutoColorBy: {
        parse: parseAccessor,
        "default": ''
      },
      // color nodes with the same field equally
      nodeOpacity: {
        type: 'number',
        "default": 0.75
      },
      nodeThreeObject: {
        parse: parseAccessor,
        "default": null
      },
      nodeThreeObjectExtend: {
        parse: parseAccessor,
        "default": false
      },
      linkSource: {
        type: 'string',
        "default": 'source'
      },
      linkTarget: {
        type: 'string',
        "default": 'target'
      },
      linkVisibility: {
        parse: parseAccessor,
        "default": true
      },
      linkColor: {
        parse: parseAccessor,
        "default": 'color'
      },
      linkAutoColorBy: {
        parse: parseAccessor,
        "default": ''
      },
      // color links with the same field equally
      linkOpacity: {
        type: 'number',
        "default": 0.2
      },
      linkWidth: {
        parse: parseAccessor,
        "default": 0
      },
      linkResolution: {
        type: 'number',
        "default": 6
      },
      // how many radial segments in each line cylinder's geometry
      linkCurvature: {
        parse: parseAccessor,
        "default": 0
      },
      linkCurveRotation: {
        parse: parseAccessor,
        "default": 0
      },
      linkMaterial: {
        parse: parseAccessor,
        "default": null
      },
      linkThreeObject: {
        parse: parseAccessor,
        "default": null
      },
      linkThreeObjectExtend: {
        parse: parseAccessor,
        "default": false
      },
      linkPositionUpdate: {
        parse: parseFn,
        "default": null
      },
      linkDirectionalArrowLength: {
        parse: parseAccessor,
        "default": 0
      },
      linkDirectionalArrowColor: {
        parse: parseAccessor,
        "default": null
      },
      linkDirectionalArrowRelPos: {
        parse: parseAccessor,
        "default": 0.5
      },
      // value between 0<>1 indicating the relative pos along the (exposed) line
      linkDirectionalArrowResolution: {
        type: 'number',
        "default": 8
      },
      // how many slice segments in the arrow's conic circumference
      linkDirectionalParticles: {
        parse: parseAccessor,
        "default": 0
      },
      // animate photons travelling in the link direction
      linkDirectionalParticleSpeed: {
        parse: parseAccessor,
        "default": 0.01
      },
      // in link length ratio per frame
      linkDirectionalParticleWidth: {
        parse: parseAccessor,
        "default": 0.5
      },
      linkDirectionalParticleColor: {
        parse: parseAccessor,
        "default": null
      },
      linkDirectionalParticleResolution: {
        type: 'number',
        "default": 4
      },
      // how many slice segments in the particle sphere's circumference
      onNodeHover: {
        parse: parseFn,
        "default": function _default() {}
      },
      onLinkHover: {
        parse: parseFn,
        "default": function _default() {}
      },
      onNodeClick: {
        parse: parseFn,
        "default": function _default() {}
      },
      onLinkClick: {
        parse: parseFn,
        "default": function _default() {}
      },
      forceEngine: {
        type: 'string',
        "default": 'd3'
      },
      // 'd3' or 'ngraph'
      d3AlphaMin: {
        type: 'number',
        "default": 0
      },
      d3AlphaDecay: {
        type: 'number',
        "default": 0.0228
      },
      d3VelocityDecay: {
        type: 'number',
        "default": 0.4
      },
      ngraphPhysics: {
        parse: parseJson,
        "default": null
      },
      warmupTicks: {
        type: 'int',
        "default": 0
      },
      // how many times to tick the force engine at init before starting to render
      cooldownTicks: {
        type: 'int',
        "default": 1e18
      },
      // Simulate infinity (int parser doesn't accept Infinity object)
      cooldownTime: {
        type: 'int',
        "default": 15000
      },
      // ms
      onEngineTick: {
        parse: parseFn,
        "default": function _default() {}
      },
      onEngineStop: {
        parse: parseFn,
        "default": function _default() {}
      }
    },
    // Bind component methods
    getGraphBbox: function getGraphBbox(nodeFilterFn) {
      if (!this.forceGraph) {
        // Got here before component init -> initialize forceGraph
        this.forceGraph = new ThreeForceGraph();
      }
      return this.forceGraph.getGraphBbox(nodeFilterFn);
    },
    emitParticle: function emitParticle() {
      if (!this.forceGraph) {
        // Got here before component init -> initialize forceGraph
        this.forceGraph = new ThreeForceGraph();
      }
      var forceGraph = this.forceGraph;
      var returnVal = forceGraph.emitParticle.apply(forceGraph, arguments);
      return returnVal === forceGraph ? this // return self, not the inner forcegraph component
      : returnVal;
    },
    d3Force: function d3Force() {
      if (!this.forceGraph) {
        // Got here before component init -> initialize forceGraph
        this.forceGraph = new ThreeForceGraph();
      }
      var forceGraph = this.forceGraph;
      var returnVal = forceGraph.d3Force.apply(forceGraph, arguments);
      return returnVal === forceGraph ? this // return self, not the inner forcegraph component
      : returnVal;
    },
    d3ReheatSimulation: function d3ReheatSimulation() {
      this.forceGraph && this.forceGraph.d3ReheatSimulation();
      return this;
    },
    refresh: function refresh() {
      this.forceGraph && this.forceGraph.refresh();
      return this;
    },
    init: function init() {
      var _this = this;
      var state = this.state = {}; // Internal state

      // Add info msg
      state.infoEl = document.createElement('a-text');
      state.infoEl.setAttribute('position', '0 -0.1 -1'); // Canvas center
      state.infoEl.setAttribute('width', 1);
      state.infoEl.setAttribute('align', 'center');
      state.infoEl.setAttribute('color', 'lavender');

      // Get camera dom element and attach fixed view elements to camera
      var cameraEl = document.querySelector('a-entity[camera], a-camera');
      cameraEl.appendChild(state.infoEl);

      // Keep reference to Three camera object
      state.cameraObj = cameraEl.object3D.children.filter(function (child) {
        return child.type === 'PerspectiveCamera';
      })[0];

      // On camera switch
      this.el.sceneEl.addEventListener('camera-set-active', function (evt) {
        // Switch camera reference
        state.cameraObj = evt.detail.cameraEl.components.camera.camera;
      });

      // setup FG object
      if (!this.forceGraph) this.forceGraph = new ThreeForceGraph(); // initialize forceGraph if it doesn't exist yet
      this.forceGraph.onFinishUpdate(function () {
        return _this.el.setObject3D('forcegraphGroup', _this.forceGraph);
      }) // Bind forcegraph to elem
      .onLoading(function () {
        return state.infoEl.setAttribute('value', 'Loading...');
      }) // Add loading msg
      .onFinishLoading(function () {
        return state.infoEl.setAttribute('value', '');
      });

      // prefer raycaster events over mouseenter/mouseleave because they expose immediately available intersection data via detail.getIntersection()
      this.el.addEventListener('raycaster-intersected', function (ev) {
        return state.hoverDetail = ev.detail;
      });
      this.el.addEventListener('raycaster-intersected-cleared', function (ev) {
        return state.hoverDetail = ev.detail;
      });
      this.el.addEventListener('click', function () {
        return state.hoverObj && _this.data['on' + (state.hoverObj.__graphObjType === 'node' ? 'Node' : 'Link') + 'Click'](state.hoverObj.__data);
      });
    },
    remove: function remove() {
      // Clean-up elems
      this.state.infoEl.remove();
      this.el.removeObject3D('forcegraphGroup');
    },
    update: function update(oldData) {
      var comp = this;
      var elData = this.data;
      var diff = AFRAME.utils.diff(elData, oldData);
      var fgProps = ['jsonUrl', 'numDimensions', 'dagMode', 'dagLevelDistance', 'dagNodeFilter', 'onDagError', 'nodeRelSize', 'nodeId', 'nodeVal', 'nodeResolution', 'nodeVisibility', 'nodeColor', 'nodeAutoColorBy', 'nodeOpacity', 'nodeThreeObject', 'nodeThreeObjectExtend', 'linkSource', 'linkTarget', 'linkVisibility', 'linkColor', 'linkAutoColorBy', 'linkOpacity', 'linkWidth', 'linkResolution', 'linkCurvature', 'linkCurveRotation', 'linkMaterial', 'linkThreeObject', 'linkThreeObjectExtend', 'linkPositionUpdate', 'linkDirectionalArrowLength', 'linkDirectionalArrowColor', 'linkDirectionalArrowRelPos', 'linkDirectionalArrowResolution', 'linkDirectionalParticles', 'linkDirectionalParticleSpeed', 'linkDirectionalParticleWidth', 'linkDirectionalParticleColor', 'linkDirectionalParticleResolution', 'forceEngine', 'd3AlphaMin', 'd3AphaDecay', 'd3VelocityDecay', 'ngraphPhysics', 'warmupTicks', 'cooldownTicks', 'cooldownTime', 'onEngineTick', 'onEngineStop'];
      fgProps.filter(function (p) {
        return p in diff;
      }).forEach(function (p) {
        comp.forceGraph[p](elData[p] !== '' ? elData[p] : null);
      }); // Convert blank values into nulls

      if ('nodes' in diff || 'links' in diff) {
        comp.forceGraph.graphData({
          nodes: elData.nodes,
          links: elData.links
        });
      }
    },
    tick: function tick(t, td) {
      var state = this.state;
      var props = this.data;

      // Update hover (intersected) object
      var intersection = state.hoverDetail ? state.hoverDetail.getIntersection ? state.hoverDetail.getIntersection(this.el) // available in raycaster-intersected events
      : state.hoverDetail.intersection || undefined // available in mouseenter/mouseleave events (with delayed update)
      : undefined;

      // Note:
      // Unfortunately we only have access to the intersected object closer to the camera (1st element in the raycaster intersectObjects result),
      // there is no ".getIntersections()" method available in the event details. Therefore, we can't prioritize hover on nodes over links, or even exclude
      // objects that are neither nodes or links. This makes the interaction a bit erratic if nodes have a lot of links in front.
      // Configuring the raycaster.params.Line.threshold might help with this somewhat, but that config is also not available via the a-frame raycaster component.

      // recurse up until forcegraph obj is found
      var topObject = intersection ? intersection.object : undefined;
      while (topObject && !topObject.hasOwnProperty('__graphObjType')) topObject = topObject.parent;
      if (topObject !== state.hoverObj) {
        var prevObjType = state.hoverObj ? state.hoverObj.__graphObjType : null;
        var prevObjData = state.hoverObj ? state.hoverObj.__data : null;
        var objType = topObject ? topObject.__graphObjType : null;
        var objData = topObject ? topObject.__data : null;
        if (prevObjType && prevObjType !== objType) {
          // Hover out
          props['on' + (prevObjType === 'node' ? 'Node' : 'Link') + 'Hover'](null, prevObjData);
        }
        if (objType) {
          // Hover in
          props['on' + (objType === 'node' ? 'Node' : 'Link') + 'Hover'](objData, prevObjType === objType ? prevObjData : null);
        }
        state.hoverObj = topObject;
      }

      // Run force-graph ticker
      this.forceGraph.tickFrame();
    }
  });
}
