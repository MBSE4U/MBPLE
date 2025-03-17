import * as React from 'react';
import { Object3D, Material, Light, Scene, Camera, WebGLRenderer } from 'three';
import { ConfigOptions, ForceGraphVRInstance } from '3d-force-graph-vr';
import { ConfigOptions as ConfigOptions$1, ForceGraphARInstance } from '3d-force-graph-ar';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { ConfigOptions as ConfigOptions$2, ForceGraph3DInstance } from '3d-force-graph';
import ForceGraphKapsule from 'force-graph';

interface GraphData$3<NodeType = {}, LinkType = {}> {
  nodes: NodeObject$3<NodeType>[];
  links: LinkObject$3<NodeType, LinkType>[];
}

type NodeObject$3<NodeType = {}> = NodeType & {
  id?: string | number;
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
  fx?: number;
  fy?: number;
  fz?: number;
  [others: string]: any;
};

type LinkObject$3<NodeType = {}, LinkType = {}> = LinkType & {
  source?: string | number | NodeObject$3<NodeType>;
  target?: string | number | NodeObject$3<NodeType>;
  [others: string]: any;
};

type Accessor$3<In, Out> = Out | string | ((obj: In) => Out);
type NodeAccessor$3<NodeType, T> = Accessor$3<NodeObject$3<NodeType>, T>;
type LinkAccessor$3<NodeType, LinkType, T> = Accessor$3<LinkObject$3<NodeType, LinkType>, T>;

type DagMode$3 = 'td' | 'bu' | 'lr' | 'rl' | 'zout' | 'zin' | 'radialout' | 'radialin';

type ForceEngine$2 = 'd3' | 'ngraph';

interface ForceFn$3<NodeType = {}> {
  (alpha: number): void;
  initialize?: (nodes: NodeObject$3<NodeType>[], ...args: any[]) => void;
  [key: string]: any;
}

type Coords$2 = { x: number; y: number; z: number; }

type LinkPositionUpdateFn$2 = <NodeType = {}, LinkType = {}>(obj: Object3D, coords: { start: Coords$2, end: Coords$2 }, link: LinkObject$3<NodeType, LinkType>) => void | null | boolean;

interface ForceGraphProps$3<
  NodeType = {},
  LinkType = {}
> extends ConfigOptions {
  // Data input
  graphData?: GraphData$3<NodeObject$3<NodeType>, LinkObject$3<NodeType, LinkType>>;
  nodeId?: string;
  linkSource?: string;
  linkTarget?: string;

  // Container layout
  width?: number;
  height?: number;
  yOffset?: number;
  glScale?: number;

  // Node styling
  nodeLabel?: NodeAccessor$3<NodeType, string>;
  nodeDesc?: NodeAccessor$3<NodeType, string>;
  nodeRelSize?: number;
  nodeVal?: NodeAccessor$3<NodeType, number>;
  nodeVisibility?: NodeAccessor$3<NodeType, boolean>;
  nodeColor?: NodeAccessor$3<NodeType, string>;
  nodeAutoColorBy?: NodeAccessor$3<NodeType, string | null>;
  nodeOpacity?: number;
  nodeResolution?: number;
  nodeThreeObject?: NodeAccessor$3<NodeType, Object3D>;
  nodeThreeObjectExtend?: NodeAccessor$3<NodeType, boolean>;

  // Link styling
  linkLabel?: LinkAccessor$3<NodeType, LinkType, string>;
  linkDesc?: LinkAccessor$3<NodeType, LinkType, string>;
  linkVisibility?: LinkAccessor$3<NodeType, LinkType, boolean>;
  linkColor?: LinkAccessor$3<NodeType, LinkType, string>;
  linkAutoColorBy?: LinkAccessor$3<NodeType, LinkType, string | null>;
  linkWidth?: LinkAccessor$3<NodeType, LinkType, number>;
  linkOpacity?: number;
  linkResolution?: number;
  linkCurvature?: LinkAccessor$3<NodeType, LinkType, number>;
  linkCurveRotation?: LinkAccessor$3<NodeType, LinkType, number>;
  linkMaterial?: LinkAccessor$3<NodeType, LinkType, Material | boolean | null>;
  linkThreeObject?: LinkAccessor$3<NodeType, LinkType, Object3D>;
  linkThreeObjectExtend?: LinkAccessor$3<NodeType, LinkType, boolean>;
  linkPositionUpdate?: LinkPositionUpdateFn$2 | null;
  linkDirectionalArrowLength?: LinkAccessor$3<NodeType, LinkType, number>;
  linkDirectionalArrowColor?: LinkAccessor$3<NodeType, LinkType, string>;
  linkDirectionalArrowRelPos?: LinkAccessor$3<NodeType, LinkType, number>;
  linkDirectionalArrowResolution?: number;
  linkDirectionalParticles?: LinkAccessor$3<NodeType, LinkType, number>;
  linkDirectionalParticleSpeed?: LinkAccessor$3<NodeType, LinkType, number>;
  linkDirectionalParticleWidth?: LinkAccessor$3<NodeType, LinkType, number>;
  linkDirectionalParticleColor?: LinkAccessor$3<NodeType, LinkType, string>;
  linkDirectionalParticleResolution?: number;

  // Force engine (d3-force) configuration
  forceEngine?: ForceEngine$2;
  numDimensions?: 1 | 2 | 3;
  dagMode?: DagMode$3;
  dagLevelDistance?: number | null;
  dagNodeFilter?: (node: NodeObject$3<NodeType>) => boolean;
  onDagError?: ((loopNodeIds: (string | number)[]) => void) | undefined;
  d3AlphaMin?: number;
  d3AlphaDecay?: number;
  d3VelocityDecay?: number;
  ngraphPhysics?: object;
  warmupTicks?: number;
  cooldownTicks?: number;
  cooldownTime?: number;
  onEngineTick?: () => void;
  onEngineStop?: () => void;

  // Interaction
  onNodeHover?: (node: NodeObject$3<NodeType> | null, previousNode: NodeObject$3<NodeType> | null) => void;
  onNodeClick?: (link: LinkObject$3<NodeType, LinkType>) => void;
  onLinkHover?: (link: LinkObject$3<NodeType, LinkType> | null, previousLink: LinkObject$3<NodeType, LinkType> | null) => void;
  onLinkClick?: (link: LinkObject$3<NodeType, LinkType>) => void;
}

interface ForceGraphMethods$3<
  NodeType = {},
  LinkType = {}
> {
  // Link styling
  emitParticle(link: LinkObject$3<NodeType, LinkType>): ForceGraphVRInstance;

  // Force engine (d3-force) configuration
  d3Force(forceName: 'link' | 'charge' | 'center' | string): ForceFn$3<NodeObject$3<NodeType>> | undefined;
  d3Force(forceName: 'link' | 'charge' | 'center' | string, forceFn: ForceFn$3<NodeObject$3<NodeType>> | null): ForceGraphVRInstance;
  d3ReheatSimulation(): ForceGraphVRInstance;

  // Render control
  refresh(): ForceGraphVRInstance;

  // Utility
  getGraphBbox(nodeFilter?: (node: NodeObject$3<NodeType>) => boolean): { x: [number, number], y: [number, number], z: [number, number] };
}

type FCwithRef$3 = <NodeType = {}, LinkType = {}>(props: ForceGraphProps$3<NodeObject$3<NodeType>, LinkObject$3<NodeType, LinkType>> & { ref?: React.MutableRefObject<ForceGraphMethods$3<NodeObject$3<NodeType>, LinkObject$3<NodeType, LinkType>> | undefined>; }) => React.ReactElement;

declare const ForceGraph$3: FCwithRef$3;

interface GraphData$2<NodeType = {}, LinkType = {}> {
  nodes: NodeObject$2<NodeType>[];
  links: LinkObject$2<NodeType, LinkType>[];
}

type NodeObject$2<NodeType = {}> = NodeType & {
  id?: string | number;
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
  fx?: number;
  fy?: number;
  fz?: number;
  [others: string]: any;
};

type LinkObject$2<NodeType = {}, LinkType = {}> = LinkType & {
  source?: string | number | NodeObject$2<NodeType>;
  target?: string | number | NodeObject$2<NodeType>;
  [others: string]: any;
};

type Accessor$2<In, Out> = Out | string | ((obj: In) => Out);
type NodeAccessor$2<NodeType, T> = Accessor$2<NodeObject$2<NodeType>, T>;
type LinkAccessor$2<NodeType, LinkType, T> = Accessor$2<LinkObject$2<NodeType, LinkType>, T>;

type DagMode$2 = 'td' | 'bu' | 'lr' | 'rl' | 'zout' | 'zin' | 'radialout' | 'radialin';

type ForceEngine$1 = 'd3' | 'ngraph';

interface ForceFn$2<NodeType = {}> {
  (alpha: number): void;
  initialize?: (nodes: NodeObject$2<NodeType>[], ...args: any[]) => void;
  [key: string]: any;
}

type Coords$1 = { x: number; y: number; z: number; }

type LinkPositionUpdateFn$1 = <NodeType = {}, LinkType = {}>(obj: Object3D, coords: { start: Coords$1, end: Coords$1 }, link: LinkObject$2<NodeType, LinkType>) => void | null | boolean;

interface ForceGraphProps$2<
  NodeType = {},
  LinkType = {}
> extends ConfigOptions$1 {
  // Data input
  graphData?: GraphData$2<NodeObject$2<NodeType>, LinkObject$2<NodeType, LinkType>>;
  nodeId?: string;
  linkSource?: string;
  linkTarget?: string;

  // Container layout
  width?: number;
  height?: number;
  backgroundColor?: string;
  showNavInfo?: boolean;

  // Node styling
  nodeRelSize?: number;
  nodeVal?: NodeAccessor$2<NodeType, number>;
  nodeVisibility?: NodeAccessor$2<NodeType, boolean>;
  nodeColor?: NodeAccessor$2<NodeType, string>;
  nodeAutoColorBy?: NodeAccessor$2<NodeType, string | null>;
  nodeOpacity?: number;
  nodeResolution?: number;
  nodeThreeObject?: NodeAccessor$2<NodeType, Object3D>;
  nodeThreeObjectExtend?: NodeAccessor$2<NodeType, boolean>;

  // Link styling
  linkVisibility?: LinkAccessor$2<NodeType, LinkType, boolean>;
  linkColor?: LinkAccessor$2<NodeType, LinkType, string>;
  linkAutoColorBy?: LinkAccessor$2<NodeType, LinkType, string | null>;
  linkWidth?: LinkAccessor$2<NodeType, LinkType, number>;
  linkOpacity?: number;
  linkResolution?: number;
  linkCurvature?: LinkAccessor$2<NodeType, LinkType, number>;
  linkCurveRotation?: LinkAccessor$2<NodeType, LinkType, number>;
  linkMaterial?: LinkAccessor$2<NodeType, LinkType, Material | boolean | null>;
  linkThreeObject?: LinkAccessor$2<NodeType, LinkType, Object3D>;
  linkThreeObjectExtend?: LinkAccessor$2<NodeType, LinkType, boolean>;
  linkPositionUpdate?: LinkPositionUpdateFn$1 | null;
  linkDirectionalArrowLength?: LinkAccessor$2<NodeType, LinkType, number>;
  linkDirectionalArrowColor?: LinkAccessor$2<NodeType, LinkType, string>;
  linkDirectionalArrowRelPos?: LinkAccessor$2<NodeType, LinkType, number>;
  linkDirectionalArrowResolution?: number;
  linkDirectionalParticles?: LinkAccessor$2<NodeType, LinkType, number>;
  linkDirectionalParticleSpeed?: LinkAccessor$2<NodeType, LinkType, number>;
  linkDirectionalParticleWidth?: LinkAccessor$2<NodeType, LinkType, number>;
  linkDirectionalParticleColor?: LinkAccessor$2<NodeType, LinkType, string>;
  linkDirectionalParticleResolution?: number;

  // Force engine (d3-force) configuration
  forceEngine?: ForceEngine$1;
  numDimensions?: 1 | 2 | 3;
  dagMode?: DagMode$2;
  dagLevelDistance?: number | null;
  dagNodeFilter?: (node: NodeObject$2<NodeType>) => boolean;
  onDagError?: ((loopNodeIds: (string | number)[]) => void) | undefined;
  d3AlphaMin?: number;
  d3AlphaDecay?: number;
  d3VelocityDecay?: number;
  ngraphPhysics?: object;
  warmupTicks?: number;
  cooldownTicks?: number;
  cooldownTime?: number;
  onEngineTick?: () => void;
  onEngineStop?: () => void;

  // Interaction
  onNodeHover?: (node: NodeObject$2<NodeType> | null, previousNode: NodeObject$2<NodeType> | null) => void;
  onNodeClick?: (link: LinkObject$2<NodeType, LinkType>) => void;
  onLinkHover?: (link: LinkObject$2<NodeType, LinkType> | null, previousLink: LinkObject$2<NodeType, LinkType> | null) => void;
  onLinkClick?: (link: LinkObject$2<NodeType, LinkType>) => void;
}

interface ForceGraphMethods$2<
  NodeType = {},
  LinkType = {}
> {
  // Link styling
  emitParticle(link: LinkObject$2<NodeType, LinkType>): ForceGraphARInstance;

  // Force engine (d3-force) configuration
  d3Force(forceName: 'link' | 'charge' | 'center' | string): ForceFn$2<NodeObject$2<NodeType>> | undefined;
  d3Force(forceName: 'link' | 'charge' | 'center' | string, forceFn: ForceFn$2<NodeObject$2<NodeType>> | null): ForceGraphARInstance;
  d3ReheatSimulation(): ForceGraphARInstance;

  // Render control
  refresh(): ForceGraphARInstance;

  // Utility
  getGraphBbox(nodeFilter?: (node: NodeObject$2<NodeType>) => boolean): { x: [number, number], y: [number, number], z: [number, number] };
}

type FCwithRef$2 = <NodeType = {}, LinkType = {}>(props: ForceGraphProps$2<NodeObject$2<NodeType>, LinkObject$2<NodeType, LinkType>> & { ref?: React.MutableRefObject<ForceGraphMethods$2<NodeObject$2<NodeType>, LinkObject$2<NodeType, LinkType>> | undefined>; }) => React.ReactElement;

declare const ForceGraph$2: FCwithRef$2;

interface GraphData$1<NodeType = {}, LinkType = {}> {
  nodes: NodeObject$1<NodeType>[];
  links: LinkObject$1<NodeType, LinkType>[];
}

type NodeObject$1<NodeType = {}> = NodeType & {
  id?: string | number;
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
  fx?: number;
  fy?: number;
  fz?: number;
  [others: string]: any;
};

type LinkObject$1<NodeType = {}, LinkType = {}> = LinkType & {
  source?: string | number | NodeObject$1<NodeType>;
  target?: string | number | NodeObject$1<NodeType>;
  [others: string]: any;
};

type Accessor$1<In, Out> = Out | string | ((obj: In) => Out);
type NodeAccessor$1<NodeType, T> = Accessor$1<NodeObject$1<NodeType>, T>;
type LinkAccessor$1<NodeType, LinkType, T> = Accessor$1<LinkObject$1<NodeType, LinkType>, T>;

type TooltipContent$1 = string | React.ReactHTMLElement<HTMLElement>;

type DagMode$1 = 'td' | 'bu' | 'lr' | 'rl' | 'zout' | 'zin' | 'radialout' | 'radialin';

type ForceEngine = 'd3' | 'ngraph';

interface ForceFn$1<NodeType = {}> {
  (alpha: number): void;
  initialize?: (nodes: NodeObject$1<NodeType>[], ...args: any[]) => void;
  [key: string]: any;
}

type Coords = { x: number; y: number; z: number; }

type LinkPositionUpdateFn = <NodeType = {}, LinkType = {}>(obj: Object3D, coords: { start: Coords, end: Coords }, link: LinkObject$1<NodeType, LinkType>) => void | null | boolean;

interface ForceGraphProps$1<
  NodeType = {},
  LinkType = {}
> extends ConfigOptions$2 {
  // Data input
  graphData?: GraphData$1<NodeObject$1<NodeType>, LinkObject$1<NodeType, LinkType>>;
  nodeId?: string;
  linkSource?: string;
  linkTarget?: string;

  // Container layout
  width?: number;
  height?: number;
  backgroundColor?: string;
  showNavInfo?: boolean;

  // Node styling
  nodeRelSize?: number;
  nodeVal?: NodeAccessor$1<NodeType, number>;
  nodeLabel?: NodeAccessor$1<NodeType, TooltipContent$1>;
  nodeVisibility?: NodeAccessor$1<NodeType, boolean>;
  nodeColor?: NodeAccessor$1<NodeType, string>;
  nodeAutoColorBy?: NodeAccessor$1<NodeType, string | null>;
  nodeOpacity?: number;
  nodeResolution?: number;
  nodeThreeObject?: NodeAccessor$1<NodeType, Object3D>;
  nodeThreeObjectExtend?: NodeAccessor$1<NodeType, boolean>;

  // Link styling
  linkLabel?: LinkAccessor$1<NodeType, LinkType, TooltipContent$1>;
  linkVisibility?: LinkAccessor$1<NodeType, LinkType, boolean>;
  linkColor?: LinkAccessor$1<NodeType, LinkType, string>;
  linkAutoColorBy?: LinkAccessor$1<NodeType, LinkType, string | null>;
  linkWidth?: LinkAccessor$1<NodeType, LinkType, number>;
  linkOpacity?: number;
  linkResolution?: number;
  linkCurvature?: LinkAccessor$1<NodeType, LinkType, number>;
  linkCurveRotation?: LinkAccessor$1<NodeType, LinkType, number>;
  linkMaterial?: LinkAccessor$1<NodeType, LinkType, Material | boolean | null>;
  linkThreeObject?: LinkAccessor$1<NodeType, LinkType, Object3D>;
  linkThreeObjectExtend?: LinkAccessor$1<NodeType, LinkType, boolean>;
  linkPositionUpdate?: LinkPositionUpdateFn | null;
  linkDirectionalArrowLength?: LinkAccessor$1<NodeType, LinkType, number>;
  linkDirectionalArrowColor?: LinkAccessor$1<NodeType, LinkType, string>;
  linkDirectionalArrowRelPos?: LinkAccessor$1<NodeType, LinkType, number>;
  linkDirectionalArrowResolution?: number;
  linkDirectionalParticles?: LinkAccessor$1<NodeType, LinkType, number>;
  linkDirectionalParticleSpeed?: LinkAccessor$1<NodeType, LinkType, number>;
  linkDirectionalParticleWidth?: LinkAccessor$1<NodeType, LinkType, number>;
  linkDirectionalParticleColor?: LinkAccessor$1<NodeType, LinkType, string>;
  linkDirectionalParticleResolution?: number;

  // Force engine (d3-force) configuration
  forceEngine?: ForceEngine;
  numDimensions?: 1 | 2 | 3;
  dagMode?: DagMode$1;
  dagLevelDistance?: number | null;
  dagNodeFilter?: (node: NodeObject$1<NodeType>) => boolean;
  onDagError?: ((loopNodeIds: (string | number)[]) => void) | undefined;
  d3AlphaMin?: number;
  d3AlphaDecay?: number;
  d3VelocityDecay?: number;
  ngraphPhysics?: object;
  warmupTicks?: number;
  cooldownTicks?: number;
  cooldownTime?: number;
  onEngineTick?: () => void;
  onEngineStop?: () => void;

  // Interaction
  onNodeClick?: (node: NodeObject$1<NodeType>, event: MouseEvent) => void;
  onNodeRightClick?: (node: NodeObject$1<NodeType>, event: MouseEvent) => void;
  onNodeHover?: (node: NodeObject$1<NodeType> | null, previousNode: NodeObject$1<NodeType> | null) => void;
  onNodeDrag?: (node: NodeObject$1<NodeType>, translate: { x: number, y: number }) => void;
  onNodeDragEnd?: (node: NodeObject$1<NodeType>, translate: { x: number, y: number }) => void;
  onLinkClick?: (link: LinkObject$1<NodeType, LinkType>, event: MouseEvent) => void;
  onLinkRightClick?: (link: LinkObject$1<NodeType, LinkType>, event: MouseEvent) => void;
  onLinkHover?: (link: LinkObject$1<NodeType, LinkType> | null, previousLink: LinkObject$1<NodeType, LinkType> | null) => void;
  linkHoverPrecision?: number;
  onBackgroundClick?: (event: MouseEvent) => void;
  onBackgroundRightClick?: (event: MouseEvent) => void;
  enableNodeDrag?: boolean;
  enableNavigationControls?: boolean;
  enablePointerInteraction?: boolean;
}

interface ForceGraphMethods$1<
  NodeType = {},
  LinkType = {}
> {
  // Link styling
  emitParticle(link: LinkObject$1<NodeType, LinkType>): ForceGraph3DInstance;

  // Force engine (d3-force) configuration
  d3Force(forceName: 'link' | 'charge' | 'center' | string): ForceFn$1<NodeObject$1<NodeType>> | undefined;
  d3Force(forceName: 'link' | 'charge' | 'center' | string, forceFn: ForceFn$1<NodeObject$1<NodeType>> | null): ForceGraph3DInstance;
  d3ReheatSimulation(): ForceGraph3DInstance;

  // Render control
  pauseAnimation(): ForceGraph3DInstance;
  resumeAnimation(): ForceGraph3DInstance;
  cameraPosition(position: Partial<Coords>, lookAt?: Coords, transitionMs?: number): ForceGraph3DInstance;
  zoomToFit(durationMs?: number, padding?: number, nodeFilter?: (node: NodeObject$1<NodeType>) => boolean): ForceGraph3DInstance;
  postProcessingComposer(): EffectComposer;
  lights(): Light[];
  lights(lights: Light[]): ForceGraph3DInstance;
  scene(): Scene;
  camera(): Camera;
  renderer(): WebGLRenderer;
  controls(): object;
  refresh(): ForceGraph3DInstance;

  // Utility
  getGraphBbox(nodeFilter?: (node: NodeObject$1<NodeType>) => boolean): { x: [number, number], y: [number, number], z: [number, number] };
  screen2GraphCoords(x: number, y: number, distance: number): Coords;
  graph2ScreenCoords(x: number, y: number, z: number): Coords;
}

type FCwithRef$1 = <NodeType = {}, LinkType = {}>(props: ForceGraphProps$1<NodeObject$1<NodeType>, LinkObject$1<NodeType, LinkType>> & { ref?: React.MutableRefObject<ForceGraphMethods$1<NodeObject$1<NodeType>, LinkObject$1<NodeType, LinkType>> | undefined>; }) => React.ReactElement;

declare const ForceGraph$1: FCwithRef$1;

interface GraphData<NodeType = {}, LinkType = {}> {
  nodes: NodeObject<NodeType>[];
  links: LinkObject<NodeType, LinkType>[];
}

type NodeObject<NodeType = {}> = NodeType & {
  id?: string | number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
  [others: string]: any;
};

type LinkObject<NodeType = {}, LinkType = {}> = LinkType & {
  source?: string | number | NodeObject<NodeType>;
  target?: string | number | NodeObject<NodeType>;
  [others: string]: any;
};

type Accessor<In, Out> = Out | string | ((obj: In) => Out);
type NodeAccessor<NodeType, T> = Accessor<NodeObject<NodeType>, T>;
type LinkAccessor<NodeType, LinkType, T> = Accessor<LinkObject<NodeType, LinkType>, T>;

type TooltipContent = string | React.ReactHTMLElement<HTMLElement>;

type CanvasCustomRenderMode = 'replace' | 'before' | 'after';
type CanvasCustomRenderFn<T> = (obj: T, canvasContext: CanvasRenderingContext2D, globalScale: number) => void;
type CanvasPointerAreaPaintFn<T> = (obj: T, paintColor: string, canvasContext: CanvasRenderingContext2D, globalScale: number) => void;

type DagMode = 'td' | 'bu' | 'lr' | 'rl' | 'radialout' | 'radialin';

interface ForceFn<NodeType = {}> {
  (alpha: number): void;
  initialize?: (nodes: NodeObject<NodeType>[], ...args: any[]) => void;
  [key: string]: any;
}

interface ForceGraphProps<
  NodeType = {},
  LinkType = {}
> {
  // Data input
  graphData?: GraphData<NodeObject<NodeType>, LinkObject<NodeType, LinkType>>;
  nodeId?: string;
  linkSource?: string;
  linkTarget?: string;

  // Container layout
  width?: number;
  height?: number;
  backgroundColor?: string;

  // Node styling
  nodeRelSize?: number;
  nodeVal?: NodeAccessor<NodeType, number>;
  nodeLabel?: NodeAccessor<NodeType, TooltipContent>;
  nodeVisibility?: NodeAccessor<NodeType, boolean>;
  nodeColor?: NodeAccessor<NodeType, string>;
  nodeAutoColorBy?: NodeAccessor<NodeType, string | null>;
  nodeCanvasObjectMode?: string | ((obj: NodeObject<NodeType>) => CanvasCustomRenderMode | any);
  nodeCanvasObject?: CanvasCustomRenderFn<NodeObject<NodeType>>;
  nodePointerAreaPaint?: CanvasPointerAreaPaintFn<NodeObject<NodeType>>;

  // Link styling
  linkLabel?: LinkAccessor<NodeType, LinkType, TooltipContent>;
  linkVisibility?: LinkAccessor<NodeType, LinkType, boolean>;
  linkColor?: LinkAccessor<NodeType, LinkType, string>;
  linkAutoColorBy?: LinkAccessor<NodeType, LinkType, string | null>;
  linkLineDash?: LinkAccessor<NodeType, LinkType, number[] | null>;
  linkWidth?: LinkAccessor<NodeType, LinkType, number>;
  linkCurvature?: LinkAccessor<NodeType, LinkType, number>;
  linkCanvasObject?: CanvasCustomRenderFn<LinkObject<NodeType, LinkType>>;
  linkCanvasObjectMode?: string | ((obj: LinkObject<NodeType, LinkType>) => CanvasCustomRenderMode | any);
  linkDirectionalArrowLength?: LinkAccessor<NodeType, LinkType, number>;
  linkDirectionalArrowColor?: LinkAccessor<NodeType, LinkType, string>;
  linkDirectionalArrowRelPos?: LinkAccessor<NodeType, LinkType, number>;
  linkDirectionalParticles?: LinkAccessor<NodeType, LinkType, number>;
  linkDirectionalParticleSpeed?: LinkAccessor<NodeType, LinkType, number>;
  linkDirectionalParticleWidth?: LinkAccessor<NodeType, LinkType, number>;
  linkDirectionalParticleColor?: LinkAccessor<NodeType, LinkType, string>;
  linkPointerAreaPaint?: CanvasPointerAreaPaintFn<LinkObject<NodeType, LinkType>>;

  // Render control
  autoPauseRedraw?: boolean;
  minZoom?: number;
  maxZoom?: number;
  onRenderFramePre?: (canvasContext: CanvasRenderingContext2D, globalScale: number) => void;
  onRenderFramePost?: (canvasContext: CanvasRenderingContext2D, globalScale: number) => void;

  // Force engine (d3-force) configuration
  dagMode?: DagMode;
  dagLevelDistance?: number | null;
  dagNodeFilter?: (node: NodeObject<NodeType>) => boolean;
  onDagError?: ((loopNodeIds: (string | number)[]) => void) | undefined;
  d3AlphaMin?: number;
  d3AlphaDecay?: number;
  d3VelocityDecay?: number;
  ngraphPhysics?: object;
  warmupTicks?: number;
  cooldownTicks?: number;
  cooldownTime?: number;
  onEngineTick?: () => void;
  onEngineStop?: () => void;

  // Interaction
  onNodeClick?: (node: NodeObject<NodeType>, event: MouseEvent) => void;
  onNodeRightClick?: (node: NodeObject<NodeType>, event: MouseEvent) => void;
  onNodeHover?: (node: NodeObject<NodeType> | null, previousNode: NodeObject<NodeType> | null) => void;
  onNodeDrag?: (node: NodeObject<NodeType>, translate: { x: number, y: number }) => void;
  onNodeDragEnd?: (node: NodeObject<NodeType>, translate: { x: number, y: number }) => void;
  onLinkClick?: (link: LinkObject<NodeType, LinkType>, event: MouseEvent) => void;
  onLinkRightClick?: (link: LinkObject<NodeType, LinkType>, event: MouseEvent) => void;
  onLinkHover?: (link: LinkObject<NodeType, LinkType> | null, previousLink: LinkObject<NodeType, LinkType> | null) => void;
  linkHoverPrecision?: number;
  onBackgroundClick?: (event: MouseEvent) => void;
  onBackgroundRightClick?: (event: MouseEvent) => void;
  onZoom?: (transform: {k: number, x: number, y: number}) => void;
  onZoomEnd?: (transform: {k: number, x: number, y: number}) => void;
  enableNodeDrag?: boolean;
  enableZoomInteraction?: boolean | ((event: MouseEvent) => boolean);
  enablePanInteraction?: boolean | ((event: MouseEvent) => boolean);
  enablePointerInteraction?: boolean;
}

interface ForceGraphMethods<
  NodeType = {},
  LinkType = {}
> {
  // Link styling
  emitParticle(link: LinkObject<NodeType, LinkType>): ForceGraphKapsule;

  // Force engine (d3-force) configuration
  d3Force(forceName: 'link' | 'charge' | 'center' | string): ForceFn<NodeObject<NodeType>> | undefined;
  d3Force(forceName: 'link' | 'charge' | 'center' | string, forceFn: ForceFn<NodeObject<NodeType>> | null): ForceGraphKapsule;
  d3ReheatSimulation(): ForceGraphKapsule;

  // Render control
  pauseAnimation(): ForceGraphKapsule;
  resumeAnimation(): ForceGraphKapsule;
  centerAt(): {x: number, y: number};
  centerAt(x?: number, y?: number, durationMs?: number): ForceGraphKapsule;
  zoom(): number;
  zoom(scale: number, durationMs?: number): ForceGraphKapsule;
  zoomToFit(durationMs?: number, padding?: number, nodeFilter?: (node: NodeObject<NodeType>) => boolean): ForceGraphKapsule;

  // Utility
  getGraphBbox(nodeFilter?: (node: NodeObject<NodeType>) => boolean): { x: [number, number], y: [number, number] };
  screen2GraphCoords(x: number, y: number): { x: number, y: number };
  graph2ScreenCoords(x: number, y: number): { x: number, y: number };
}

type FCwithRef = <NodeType = {}, LinkType = {}>(props: ForceGraphProps<NodeObject<NodeType>, LinkObject<NodeType, LinkType>> & { ref?: React.MutableRefObject<ForceGraphMethods<NodeObject<NodeType>, LinkObject<NodeType, LinkType>> | undefined>; }) => React.ReactElement;

declare const ForceGraph: FCwithRef;

export { ForceGraph as ForceGraph2D, ForceGraph$1 as ForceGraph3D, ForceGraph$2 as ForceGraphAR, ForceGraph$3 as ForceGraphVR };
