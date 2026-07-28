// AUTO-GENERIERT von tools/bakeWorld.mjs — NICHT von Hand editieren.
// Geografische Kandidaten/Hooks; noch keine Brücken-, Tunnel- oder Schifffahrtssimulation.
/* eslint-disable */

export type BakedRoadClass = 'local' | 'collector' | 'arterial';
export interface BakedTilePoint { x: number; y: number }
export interface BakedWorldPoint { x: number; y: number; z: number }
export interface BridgeCandidate {
  id: string;
  start: BakedTilePoint;
  end: BakedTilePoint;
  span: number;
  elevationDelta: number;
  waterType: 'river' | 'lake' | 'coast';
  startShoreType: number;
  endShoreType: number;
  rampGrade: number;
  clearanceRequired: boolean;
  supportedRoadClasses: BakedRoadClass[];
}
export interface ElevatedRoadCandidate {
  id: string;
  start: BakedTilePoint;
  end: BakedTilePoint;
  startHeight: number;
  endHeight: number;
  maxPillarHeight: number;
  span: number;
  terrainClearance: number;
}
export interface TunnelCandidate {
  id: string;
  entranceA: BakedWorldPoint;
  entranceB: BakedWorldPoint;
  length: number;
  mountainDepth: number;
  minimumUnlockLevel: number;
}
export interface HarborCandidate {
  id: string;
  position: BakedTilePoint;
  waterAccess: BakedTilePoint;
  regionId: number;
  depth: number;
  shoreType: number;
  buildableApron: boolean;
}
export interface WaterRouteNode {
  id: string;
  position: BakedWorldPoint;
  type: 'sea' | 'river' | 'lake' | 'harbor' | 'dock';
  clearance: number;
  depth: number;
  width: number;
  regionId: number;
}
export interface WaterRouteEdge {
  id: string;
  from: string;
  to: string;
  length: number;
  minDepth: number;
  minClearance: number;
  kind: 'waterway' | 'harbor_link';
}

export const bridgeCandidates: readonly BridgeCandidate[] = [
  {
    "id": "bridge_01",
    "start": {
      "x": 370,
      "y": 172
    },
    "end": {
      "x": 370,
      "y": 175
    },
    "span": 2,
    "elevationDelta": 0,
    "waterType": "river",
    "startShoreType": 2,
    "endShoreType": 2,
    "rampGrade": 0,
    "clearanceRequired": false,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_02",
    "start": {
      "x": 382,
      "y": 310
    },
    "end": {
      "x": 382,
      "y": 313
    },
    "span": 2,
    "elevationDelta": 0,
    "waterType": "river",
    "startShoreType": 2,
    "endShoreType": 2,
    "rampGrade": 0,
    "clearanceRequired": false,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_03",
    "start": {
      "x": 210,
      "y": 334
    },
    "end": {
      "x": 210,
      "y": 337
    },
    "span": 2,
    "elevationDelta": 0.052,
    "waterType": "river",
    "startShoreType": 2,
    "endShoreType": 2,
    "rampGrade": 0.026,
    "clearanceRequired": false,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_04",
    "start": {
      "x": 294,
      "y": 410
    },
    "end": {
      "x": 297,
      "y": 410
    },
    "span": 2,
    "elevationDelta": 0.107,
    "waterType": "river",
    "startShoreType": 2,
    "endShoreType": 2,
    "rampGrade": 0.054,
    "clearanceRequired": false,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_05",
    "start": {
      "x": 314,
      "y": 364
    },
    "end": {
      "x": 317,
      "y": 364
    },
    "span": 2,
    "elevationDelta": 0.162,
    "waterType": "river",
    "startShoreType": 2,
    "endShoreType": 2,
    "rampGrade": 0.081,
    "clearanceRequired": false,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_06",
    "start": {
      "x": 348,
      "y": 152
    },
    "end": {
      "x": 348,
      "y": 156
    },
    "span": 3,
    "elevationDelta": 0,
    "waterType": "river",
    "startShoreType": 2,
    "endShoreType": 2,
    "rampGrade": 0,
    "clearanceRequired": false,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_07",
    "start": {
      "x": 392,
      "y": 236
    },
    "end": {
      "x": 392,
      "y": 240
    },
    "span": 3,
    "elevationDelta": 0.157,
    "waterType": "coast",
    "startShoreType": 1,
    "endShoreType": 1,
    "rampGrade": 0.052,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_08",
    "start": {
      "x": 378,
      "y": 322
    },
    "end": {
      "x": 378,
      "y": 326
    },
    "span": 3,
    "elevationDelta": 0.16,
    "waterType": "river",
    "startShoreType": 2,
    "endShoreType": 2,
    "rampGrade": 0.053,
    "clearanceRequired": false,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_09",
    "start": {
      "x": 290,
      "y": 274
    },
    "end": {
      "x": 294,
      "y": 274
    },
    "span": 3,
    "elevationDelta": 0.389,
    "waterType": "river",
    "startShoreType": 2,
    "endShoreType": 2,
    "rampGrade": 0.13,
    "clearanceRequired": false,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_10",
    "start": {
      "x": 114,
      "y": 316
    },
    "end": {
      "x": 114,
      "y": 321
    },
    "span": 4,
    "elevationDelta": 0,
    "waterType": "coast",
    "startShoreType": 2,
    "endShoreType": 2,
    "rampGrade": 0,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_11",
    "start": {
      "x": 122,
      "y": 338
    },
    "end": {
      "x": 122,
      "y": 343
    },
    "span": 4,
    "elevationDelta": 0,
    "waterType": "coast",
    "startShoreType": 2,
    "endShoreType": 2,
    "rampGrade": 0,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_12",
    "start": {
      "x": 212,
      "y": 228
    },
    "end": {
      "x": 216,
      "y": 228
    },
    "span": 3,
    "elevationDelta": 0.421,
    "waterType": "river",
    "startShoreType": 2,
    "endShoreType": 2,
    "rampGrade": 0.14,
    "clearanceRequired": false,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_13",
    "start": {
      "x": 302,
      "y": 368
    },
    "end": {
      "x": 302,
      "y": 373
    },
    "span": 4,
    "elevationDelta": 0.144,
    "waterType": "lake",
    "startShoreType": 3,
    "endShoreType": 3,
    "rampGrade": 0.036,
    "clearanceRequired": false,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_14",
    "start": {
      "x": 260,
      "y": 118
    },
    "end": {
      "x": 264,
      "y": 118
    },
    "span": 3,
    "elevationDelta": 0.597,
    "waterType": "river",
    "startShoreType": 2,
    "endShoreType": 2,
    "rampGrade": 0.199,
    "clearanceRequired": false,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_15",
    "start": {
      "x": 246,
      "y": 156
    },
    "end": {
      "x": 251,
      "y": 156
    },
    "span": 4,
    "elevationDelta": 0.256,
    "waterType": "coast",
    "startShoreType": 2,
    "endShoreType": 2,
    "rampGrade": 0.064,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_16",
    "start": {
      "x": 316,
      "y": 142
    },
    "end": {
      "x": 322,
      "y": 142
    },
    "span": 5,
    "elevationDelta": 0.003,
    "waterType": "coast",
    "startShoreType": 2,
    "endShoreType": 2,
    "rampGrade": 0.001,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_17",
    "start": {
      "x": 270,
      "y": 332
    },
    "end": {
      "x": 275,
      "y": 332
    },
    "span": 4,
    "elevationDelta": 0.481,
    "waterType": "coast",
    "startShoreType": 1,
    "endShoreType": 1,
    "rampGrade": 0.12,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_18",
    "start": {
      "x": 182,
      "y": 334
    },
    "end": {
      "x": 188,
      "y": 334
    },
    "span": 5,
    "elevationDelta": 0.122,
    "waterType": "coast",
    "startShoreType": 1,
    "endShoreType": 1,
    "rampGrade": 0.024,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_19",
    "start": {
      "x": 234,
      "y": 200
    },
    "end": {
      "x": 240,
      "y": 200
    },
    "span": 5,
    "elevationDelta": 0.214,
    "waterType": "coast",
    "startShoreType": 1,
    "endShoreType": 1,
    "rampGrade": 0.043,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_20",
    "start": {
      "x": 218,
      "y": 260
    },
    "end": {
      "x": 224,
      "y": 260
    },
    "span": 5,
    "elevationDelta": 0.32,
    "waterType": "coast",
    "startShoreType": 1,
    "endShoreType": 1,
    "rampGrade": 0.064,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_21",
    "start": {
      "x": 228,
      "y": 234
    },
    "end": {
      "x": 235,
      "y": 234
    },
    "span": 6,
    "elevationDelta": 0.008,
    "waterType": "coast",
    "startShoreType": 2,
    "endShoreType": 2,
    "rampGrade": 0.001,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_22",
    "start": {
      "x": 304,
      "y": 134
    },
    "end": {
      "x": 304,
      "y": 141
    },
    "span": 6,
    "elevationDelta": 0.019,
    "waterType": "coast",
    "startShoreType": 1,
    "endShoreType": 1,
    "rampGrade": 0.003,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_23",
    "start": {
      "x": 260,
      "y": 200
    },
    "end": {
      "x": 260,
      "y": 207
    },
    "span": 6,
    "elevationDelta": 0.029,
    "waterType": "coast",
    "startShoreType": 1,
    "endShoreType": 1,
    "rampGrade": 0.005,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_24",
    "start": {
      "x": 358,
      "y": 210
    },
    "end": {
      "x": 365,
      "y": 210
    },
    "span": 6,
    "elevationDelta": 0.106,
    "waterType": "coast",
    "startShoreType": 2,
    "endShoreType": 2,
    "rampGrade": 0.018,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_25",
    "start": {
      "x": 174,
      "y": 274
    },
    "end": {
      "x": 180,
      "y": 274
    },
    "span": 5,
    "elevationDelta": 0.537,
    "waterType": "coast",
    "startShoreType": 2,
    "endShoreType": 2,
    "rampGrade": 0.107,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_26",
    "start": {
      "x": 284,
      "y": 170
    },
    "end": {
      "x": 291,
      "y": 170
    },
    "span": 6,
    "elevationDelta": 0.207,
    "waterType": "coast",
    "startShoreType": 1,
    "endShoreType": 1,
    "rampGrade": 0.035,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_27",
    "start": {
      "x": 338,
      "y": 206
    },
    "end": {
      "x": 338,
      "y": 213
    },
    "span": 6,
    "elevationDelta": 0.231,
    "waterType": "coast",
    "startShoreType": 1,
    "endShoreType": 1,
    "rampGrade": 0.039,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_28",
    "start": {
      "x": 158,
      "y": 322
    },
    "end": {
      "x": 158,
      "y": 329
    },
    "span": 6,
    "elevationDelta": 0.298,
    "waterType": "coast",
    "startShoreType": 1,
    "endShoreType": 2,
    "rampGrade": 0.05,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_29",
    "start": {
      "x": 188,
      "y": 172
    },
    "end": {
      "x": 195,
      "y": 172
    },
    "span": 6,
    "elevationDelta": 0.383,
    "waterType": "coast",
    "startShoreType": 1,
    "endShoreType": 1,
    "rampGrade": 0.064,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_30",
    "start": {
      "x": 126,
      "y": 204
    },
    "end": {
      "x": 126,
      "y": 212
    },
    "span": 7,
    "elevationDelta": 0,
    "waterType": "coast",
    "startShoreType": 1,
    "endShoreType": 2,
    "rampGrade": 0,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_31",
    "start": {
      "x": 288,
      "y": 310
    },
    "end": {
      "x": 288,
      "y": 318
    },
    "span": 7,
    "elevationDelta": 0.086,
    "waterType": "coast",
    "startShoreType": 1,
    "endShoreType": 1,
    "rampGrade": 0.012,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_32",
    "start": {
      "x": 226,
      "y": 192
    },
    "end": {
      "x": 234,
      "y": 192
    },
    "span": 7,
    "elevationDelta": 0.392,
    "waterType": "coast",
    "startShoreType": 2,
    "endShoreType": 2,
    "rampGrade": 0.056,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_33",
    "start": {
      "x": 392,
      "y": 254
    },
    "end": {
      "x": 392,
      "y": 263
    },
    "span": 8,
    "elevationDelta": 0,
    "waterType": "coast",
    "startShoreType": 1,
    "endShoreType": 1,
    "rampGrade": 0,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_34",
    "start": {
      "x": 134,
      "y": 292
    },
    "end": {
      "x": 134,
      "y": 301
    },
    "span": 8,
    "elevationDelta": 0,
    "waterType": "coast",
    "startShoreType": 1,
    "endShoreType": 2,
    "rampGrade": 0,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_35",
    "start": {
      "x": 396,
      "y": 280
    },
    "end": {
      "x": 396,
      "y": 288
    },
    "span": 7,
    "elevationDelta": 0.406,
    "waterType": "coast",
    "startShoreType": 2,
    "endShoreType": 1,
    "rampGrade": 0.058,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_36",
    "start": {
      "x": 216,
      "y": 278
    },
    "end": {
      "x": 225,
      "y": 278
    },
    "span": 8,
    "elevationDelta": 0.013,
    "waterType": "coast",
    "startShoreType": 1,
    "endShoreType": 1,
    "rampGrade": 0.002,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_37",
    "start": {
      "x": 348,
      "y": 200
    },
    "end": {
      "x": 348,
      "y": 209
    },
    "span": 8,
    "elevationDelta": 0.093,
    "waterType": "coast",
    "startShoreType": 1,
    "endShoreType": 1,
    "rampGrade": 0.012,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_38",
    "start": {
      "x": 358,
      "y": 250
    },
    "end": {
      "x": 367,
      "y": 250
    },
    "span": 8,
    "elevationDelta": 0.141,
    "waterType": "coast",
    "startShoreType": 1,
    "endShoreType": 1,
    "rampGrade": 0.018,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_39",
    "start": {
      "x": 178,
      "y": 320
    },
    "end": {
      "x": 178,
      "y": 329
    },
    "span": 8,
    "elevationDelta": 0.17,
    "waterType": "coast",
    "startShoreType": 2,
    "endShoreType": 1,
    "rampGrade": 0.021,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_40",
    "start": {
      "x": 390,
      "y": 212
    },
    "end": {
      "x": 390,
      "y": 221
    },
    "span": 8,
    "elevationDelta": 0.177,
    "waterType": "coast",
    "startShoreType": 2,
    "endShoreType": 2,
    "rampGrade": 0.022,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_41",
    "start": {
      "x": 142,
      "y": 336
    },
    "end": {
      "x": 151,
      "y": 336
    },
    "span": 8,
    "elevationDelta": 0.186,
    "waterType": "coast",
    "startShoreType": 1,
    "endShoreType": 1,
    "rampGrade": 0.023,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_42",
    "start": {
      "x": 378,
      "y": 244
    },
    "end": {
      "x": 388,
      "y": 244
    },
    "span": 9,
    "elevationDelta": 0,
    "waterType": "coast",
    "startShoreType": 2,
    "endShoreType": 1,
    "rampGrade": 0,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_43",
    "start": {
      "x": 324,
      "y": 266
    },
    "end": {
      "x": 334,
      "y": 266
    },
    "span": 9,
    "elevationDelta": 0.075,
    "waterType": "coast",
    "startShoreType": 2,
    "endShoreType": 1,
    "rampGrade": 0.008,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_44",
    "start": {
      "x": 292,
      "y": 118
    },
    "end": {
      "x": 302,
      "y": 118
    },
    "span": 9,
    "elevationDelta": 0.21,
    "waterType": "coast",
    "startShoreType": 2,
    "endShoreType": 1,
    "rampGrade": 0.023,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_45",
    "start": {
      "x": 226,
      "y": 248
    },
    "end": {
      "x": 235,
      "y": 248
    },
    "span": 8,
    "elevationDelta": 0.61,
    "waterType": "coast",
    "startShoreType": 1,
    "endShoreType": 2,
    "rampGrade": 0.076,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "local",
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_46",
    "start": {
      "x": 372,
      "y": 194
    },
    "end": {
      "x": 372,
      "y": 204
    },
    "span": 9,
    "elevationDelta": 0.354,
    "waterType": "coast",
    "startShoreType": 1,
    "endShoreType": 1,
    "rampGrade": 0.039,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_47",
    "start": {
      "x": 328,
      "y": 246
    },
    "end": {
      "x": 338,
      "y": 246
    },
    "span": 9,
    "elevationDelta": 0.417,
    "waterType": "coast",
    "startShoreType": 2,
    "endShoreType": 1,
    "rampGrade": 0.046,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "collector",
      "arterial"
    ]
  },
  {
    "id": "bridge_48",
    "start": {
      "x": 168,
      "y": 318
    },
    "end": {
      "x": 168,
      "y": 329
    },
    "span": 10,
    "elevationDelta": 0.039,
    "waterType": "coast",
    "startShoreType": 1,
    "endShoreType": 2,
    "rampGrade": 0.004,
    "clearanceRequired": true,
    "supportedRoadClasses": [
      "collector",
      "arterial"
    ]
  }
];

export const elevatedRoadCandidates: readonly ElevatedRoadCandidate[] = [
  {
    "id": "viaduct_01",
    "start": {
      "x": 266,
      "y": 314
    },
    "end": {
      "x": 276,
      "y": 314
    },
    "startHeight": 5.826,
    "endHeight": 1.068,
    "maxPillarHeight": 2.532,
    "span": 10,
    "terrainClearance": 1.5
  },
  {
    "id": "viaduct_02",
    "start": {
      "x": 318,
      "y": 310
    },
    "end": {
      "x": 330,
      "y": 310
    },
    "startHeight": 1.515,
    "endHeight": 8.291,
    "maxPillarHeight": 4.078,
    "span": 12,
    "terrainClearance": 1.631
  },
  {
    "id": "viaduct_03",
    "start": {
      "x": 170,
      "y": 210
    },
    "end": {
      "x": 182,
      "y": 210
    },
    "startHeight": 6.382,
    "endHeight": 6.473,
    "maxPillarHeight": 3.202,
    "span": 12,
    "terrainClearance": 1.5
  },
  {
    "id": "viaduct_04",
    "start": {
      "x": 134,
      "y": 194
    },
    "end": {
      "x": 146,
      "y": 194
    },
    "startHeight": 1.74,
    "endHeight": 7.87,
    "maxPillarHeight": 2.901,
    "span": 12,
    "terrainClearance": 1.5
  },
  {
    "id": "viaduct_05",
    "start": {
      "x": 194,
      "y": 214
    },
    "end": {
      "x": 206,
      "y": 214
    },
    "startHeight": 3.937,
    "endHeight": 4.634,
    "maxPillarHeight": 2.791,
    "span": 12,
    "terrainClearance": 1.5
  },
  {
    "id": "viaduct_06",
    "start": {
      "x": 234,
      "y": 378
    },
    "end": {
      "x": 234,
      "y": 390
    },
    "startHeight": 6.65,
    "endHeight": 6.866,
    "maxPillarHeight": 2.605,
    "span": 12,
    "terrainClearance": 1.5
  },
  {
    "id": "viaduct_07",
    "start": {
      "x": 266,
      "y": 282
    },
    "end": {
      "x": 266,
      "y": 296
    },
    "startHeight": 4.232,
    "endHeight": 10.628,
    "maxPillarHeight": 3.051,
    "span": 14,
    "terrainClearance": 1.5
  },
  {
    "id": "viaduct_08",
    "start": {
      "x": 154,
      "y": 258
    },
    "end": {
      "x": 154,
      "y": 272
    },
    "startHeight": 4.263,
    "endHeight": 10.3,
    "maxPillarHeight": 2.873,
    "span": 14,
    "terrainClearance": 1.5
  },
  {
    "id": "viaduct_09",
    "start": {
      "x": 274,
      "y": 398
    },
    "end": {
      "x": 288,
      "y": 398
    },
    "startHeight": 5.179,
    "endHeight": 4.572,
    "maxPillarHeight": 2.753,
    "span": 14,
    "terrainClearance": 1.5
  },
  {
    "id": "viaduct_10",
    "start": {
      "x": 334,
      "y": 338
    },
    "end": {
      "x": 334,
      "y": 352
    },
    "startHeight": 12.074,
    "endHeight": 0.05,
    "maxPillarHeight": 2.557,
    "span": 14,
    "terrainClearance": 1.5
  },
  {
    "id": "viaduct_11",
    "start": {
      "x": 306,
      "y": 234
    },
    "end": {
      "x": 306,
      "y": 248
    },
    "startHeight": 6.183,
    "endHeight": 5.992,
    "maxPillarHeight": 2.55,
    "span": 14,
    "terrainClearance": 1.5
  },
  {
    "id": "viaduct_12",
    "start": {
      "x": 182,
      "y": 186
    },
    "end": {
      "x": 196,
      "y": 186
    },
    "startHeight": 6.869,
    "endHeight": 4.837,
    "maxPillarHeight": 2.511,
    "span": 14,
    "terrainClearance": 1.5
  },
  {
    "id": "viaduct_13",
    "start": {
      "x": 370,
      "y": 314
    },
    "end": {
      "x": 370,
      "y": 332
    },
    "startHeight": 10.491,
    "endHeight": 12.087,
    "maxPillarHeight": 5.065,
    "span": 18,
    "terrainClearance": 2.026
  },
  {
    "id": "viaduct_14",
    "start": {
      "x": 238,
      "y": 258
    },
    "end": {
      "x": 254,
      "y": 258
    },
    "startHeight": 3.061,
    "endHeight": 4.378,
    "maxPillarHeight": 2.85,
    "span": 16,
    "terrainClearance": 1.5
  },
  {
    "id": "viaduct_15",
    "start": {
      "x": 198,
      "y": 374
    },
    "end": {
      "x": 198,
      "y": 390
    },
    "startHeight": 10.109,
    "endHeight": 1.608,
    "maxPillarHeight": 2.807,
    "span": 16,
    "terrainClearance": 1.5
  },
  {
    "id": "viaduct_16",
    "start": {
      "x": 214,
      "y": 366
    },
    "end": {
      "x": 230,
      "y": 366
    },
    "startHeight": 4.546,
    "endHeight": 7.219,
    "maxPillarHeight": 2.779,
    "span": 16,
    "terrainClearance": 1.5
  },
  {
    "id": "viaduct_17",
    "start": {
      "x": 214,
      "y": 146
    },
    "end": {
      "x": 230,
      "y": 146
    },
    "startHeight": 5.85,
    "endHeight": 1.22,
    "maxPillarHeight": 2.502,
    "span": 16,
    "terrainClearance": 1.5
  },
  {
    "id": "viaduct_18",
    "start": {
      "x": 290,
      "y": 322
    },
    "end": {
      "x": 308,
      "y": 322
    },
    "startHeight": 2.539,
    "endHeight": 12.132,
    "maxPillarHeight": 3.061,
    "span": 18,
    "terrainClearance": 1.5
  },
  {
    "id": "viaduct_19",
    "start": {
      "x": 366,
      "y": 162
    },
    "end": {
      "x": 366,
      "y": 180
    },
    "startHeight": 5.238,
    "endHeight": 4.093,
    "maxPillarHeight": 2.79,
    "span": 18,
    "terrainClearance": 1.5
  },
  {
    "id": "viaduct_20",
    "start": {
      "x": 298,
      "y": 362
    },
    "end": {
      "x": 298,
      "y": 380
    },
    "startHeight": 4.208,
    "endHeight": 3.679,
    "maxPillarHeight": 2.762,
    "span": 18,
    "terrainClearance": 1.5
  },
  {
    "id": "viaduct_21",
    "start": {
      "x": 378,
      "y": 294
    },
    "end": {
      "x": 378,
      "y": 312
    },
    "startHeight": 5.717,
    "endHeight": 1.832,
    "maxPillarHeight": 2.62,
    "span": 18,
    "terrainClearance": 1.5
  },
  {
    "id": "viaduct_22",
    "start": {
      "x": 326,
      "y": 366
    },
    "end": {
      "x": 326,
      "y": 384
    },
    "startHeight": 2.916,
    "endHeight": 6.383,
    "maxPillarHeight": 2.596,
    "span": 18,
    "terrainClearance": 1.5
  },
  {
    "id": "viaduct_23",
    "start": {
      "x": 278,
      "y": 334
    },
    "end": {
      "x": 278,
      "y": 352
    },
    "startHeight": 1.151,
    "endHeight": 5.544,
    "maxPillarHeight": 2.535,
    "span": 18,
    "terrainClearance": 1.5
  },
  {
    "id": "viaduct_24",
    "start": {
      "x": 222,
      "y": 178
    },
    "end": {
      "x": 222,
      "y": 198
    },
    "startHeight": 10.654,
    "endHeight": 5.359,
    "maxPillarHeight": 4.135,
    "span": 20,
    "terrainClearance": 1.654
  }
];

export const tunnelCandidates: readonly TunnelCandidate[] = [
  {
    "id": "tunnel_01",
    "entranceA": {
      "x": 358,
      "y": 12.893,
      "z": 298
    },
    "entranceB": {
      "x": 358,
      "y": 12.858,
      "z": 308
    },
    "length": 10,
    "mountainDepth": 3.276,
    "minimumUnlockLevel": 10
  },
  {
    "id": "tunnel_02",
    "entranceA": {
      "x": 296,
      "y": 11.295,
      "z": 248
    },
    "entranceB": {
      "x": 296,
      "y": 11.388,
      "z": 259
    },
    "length": 11,
    "mountainDepth": 7.141,
    "minimumUnlockLevel": 10
  },
  {
    "id": "tunnel_03",
    "entranceA": {
      "x": 236,
      "y": 11.076,
      "z": 166
    },
    "entranceB": {
      "x": 247,
      "y": 6.735,
      "z": 166
    },
    "length": 11,
    "mountainDepth": 6.228,
    "minimumUnlockLevel": 10
  },
  {
    "id": "tunnel_04",
    "entranceA": {
      "x": 226,
      "y": 7.666,
      "z": 132
    },
    "entranceB": {
      "x": 237,
      "y": 12.902,
      "z": 132
    },
    "length": 11,
    "mountainDepth": 3.607,
    "minimumUnlockLevel": 10
  },
  {
    "id": "tunnel_05",
    "entranceA": {
      "x": 330,
      "y": 11.928,
      "z": 156
    },
    "entranceB": {
      "x": 330,
      "y": 12.719,
      "z": 169
    },
    "length": 13,
    "mountainDepth": 3.068,
    "minimumUnlockLevel": 10
  },
  {
    "id": "tunnel_06",
    "entranceA": {
      "x": 266,
      "y": 6.995,
      "z": 364
    },
    "entranceB": {
      "x": 281,
      "y": 11.922,
      "z": 364
    },
    "length": 15,
    "mountainDepth": 4.937,
    "minimumUnlockLevel": 10
  },
  {
    "id": "tunnel_07",
    "entranceA": {
      "x": 178,
      "y": 9.599,
      "z": 154
    },
    "entranceB": {
      "x": 178,
      "y": 11.405,
      "z": 171
    },
    "length": 17,
    "mountainDepth": 6.904,
    "minimumUnlockLevel": 10
  },
  {
    "id": "tunnel_08",
    "entranceA": {
      "x": 240,
      "y": 12.809,
      "z": 184
    },
    "entranceB": {
      "x": 257,
      "y": 7.004,
      "z": 184
    },
    "length": 17,
    "mountainDepth": 6.162,
    "minimumUnlockLevel": 10
  },
  {
    "id": "tunnel_09",
    "entranceA": {
      "x": 210,
      "y": 7.84,
      "z": 170
    },
    "entranceB": {
      "x": 210,
      "y": 11.092,
      "z": 191
    },
    "length": 21,
    "mountainDepth": 12.386,
    "minimumUnlockLevel": 12
  }
];

export const harborCandidates: readonly HarborCandidate[] = [
  {
    "id": "harbor_01",
    "position": {
      "x": 218,
      "y": 236
    },
    "waterAccess": {
      "x": 217,
      "y": 236
    },
    "regionId": 11,
    "depth": 0.73,
    "shoreType": 2,
    "buildableApron": true
  },
  {
    "id": "harbor_02",
    "position": {
      "x": 264,
      "y": 118
    },
    "waterAccess": {
      "x": 263,
      "y": 118
    },
    "regionId": 10,
    "depth": 0.73,
    "shoreType": 2,
    "buildableApron": true
  },
  {
    "id": "harbor_03",
    "position": {
      "x": 290,
      "y": 130
    },
    "waterAccess": {
      "x": 290,
      "y": 131
    },
    "regionId": 10,
    "depth": 0.73,
    "shoreType": 1,
    "buildableApron": true
  },
  {
    "id": "harbor_04",
    "position": {
      "x": 316,
      "y": 142
    },
    "waterAccess": {
      "x": 317,
      "y": 142
    },
    "regionId": 1,
    "depth": 0.73,
    "shoreType": 2,
    "buildableApron": true
  },
  {
    "id": "harbor_05",
    "position": {
      "x": 244,
      "y": 144
    },
    "waterAccess": {
      "x": 244,
      "y": 145
    },
    "regionId": 10,
    "depth": 0.73,
    "shoreType": 1,
    "buildableApron": true
  },
  {
    "id": "harbor_06",
    "position": {
      "x": 274,
      "y": 184
    },
    "waterAccess": {
      "x": 273,
      "y": 184
    },
    "regionId": 1,
    "depth": 0.73,
    "shoreType": 1,
    "buildableApron": true
  },
  {
    "id": "harbor_07",
    "position": {
      "x": 372,
      "y": 194
    },
    "waterAccess": {
      "x": 373,
      "y": 194
    },
    "regionId": 1,
    "depth": 0.73,
    "shoreType": 1,
    "buildableApron": true
  },
  {
    "id": "harbor_08",
    "position": {
      "x": 234,
      "y": 200
    },
    "waterAccess": {
      "x": 235,
      "y": 200
    },
    "regionId": 11,
    "depth": 0.73,
    "shoreType": 1,
    "buildableApron": true
  },
  {
    "id": "harbor_09",
    "position": {
      "x": 348,
      "y": 200
    },
    "waterAccess": {
      "x": 347,
      "y": 200
    },
    "regionId": 1,
    "depth": 0.73,
    "shoreType": 1,
    "buildableApron": true
  },
  {
    "id": "harbor_10",
    "position": {
      "x": 380,
      "y": 240
    },
    "waterAccess": {
      "x": 381,
      "y": 240
    },
    "regionId": 12,
    "depth": 0.73,
    "shoreType": 2,
    "buildableApron": true
  },
  {
    "id": "harbor_11",
    "position": {
      "x": 160,
      "y": 242
    },
    "waterAccess": {
      "x": 161,
      "y": 242
    },
    "regionId": 9,
    "depth": 0.73,
    "shoreType": 1,
    "buildableApron": true
  },
  {
    "id": "harbor_12",
    "position": {
      "x": 330,
      "y": 250
    },
    "waterAccess": {
      "x": 331,
      "y": 250
    },
    "regionId": 1,
    "depth": 0.73,
    "shoreType": 1,
    "buildableApron": true
  },
  {
    "id": "harbor_13",
    "position": {
      "x": 250,
      "y": 264
    },
    "waterAccess": {
      "x": 249,
      "y": 264
    },
    "regionId": 1,
    "depth": 0.73,
    "shoreType": 1,
    "buildableApron": true
  },
  {
    "id": "harbor_14",
    "position": {
      "x": 386,
      "y": 266
    },
    "waterAccess": {
      "x": 385,
      "y": 266
    },
    "regionId": 4,
    "depth": 0.73,
    "shoreType": 1,
    "buildableApron": true
  },
  {
    "id": "harbor_15",
    "position": {
      "x": 274,
      "y": 268
    },
    "waterAccess": {
      "x": 273,
      "y": 268
    },
    "regionId": 1,
    "depth": 0.73,
    "shoreType": 1,
    "buildableApron": true
  },
  {
    "id": "harbor_16",
    "position": {
      "x": 180,
      "y": 274
    },
    "waterAccess": {
      "x": 179,
      "y": 274
    },
    "regionId": 3,
    "depth": 0.73,
    "shoreType": 2,
    "buildableApron": true
  }
];

export const centralFoundingPoint: BakedTilePoint = {"x":129,"y":252};
export const coastalArrivalPoint: BakedTilePoint = {"x":160,"y":242};
export const futureHarborCandidateId = 'harbor_11';
export const initialSupplyRoute: readonly BakedTilePoint[] = [{"x":160,"y":242},{"x":160,"y":243},{"x":160,"y":244},{"x":159,"y":244},{"x":159,"y":245},{"x":158,"y":245},{"x":157,"y":245},{"x":157,"y":246},{"x":156,"y":246},{"x":156,"y":247},{"x":155,"y":247},{"x":155,"y":248},{"x":154,"y":248},{"x":153,"y":248},{"x":152,"y":248},{"x":151,"y":248},{"x":150,"y":248},{"x":150,"y":249},{"x":149,"y":249},{"x":148,"y":249},{"x":147,"y":249},{"x":147,"y":250},{"x":146,"y":250},{"x":145,"y":250},{"x":145,"y":251},{"x":144,"y":251},{"x":144,"y":252},{"x":143,"y":252},{"x":143,"y":253},{"x":142,"y":253},{"x":142,"y":254},{"x":141,"y":254},{"x":141,"y":255},{"x":140,"y":255},{"x":139,"y":255},{"x":138,"y":255},{"x":137,"y":255},{"x":136,"y":255},{"x":135,"y":255},{"x":134,"y":255},{"x":133,"y":255},{"x":132,"y":255},{"x":131,"y":255},{"x":130,"y":255},{"x":129,"y":255}];

export const waterRouteNodes: readonly WaterRouteNode[] = [
  {
    "id": "water_8_8",
    "position": {
      "x": 8,
      "y": 0,
      "z": 8
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_24_8",
    "position": {
      "x": 24,
      "y": 0,
      "z": 8
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_40_8",
    "position": {
      "x": 40,
      "y": 0,
      "z": 8
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_56_8",
    "position": {
      "x": 56,
      "y": 0,
      "z": 8
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_72_8",
    "position": {
      "x": 72,
      "y": 0,
      "z": 8
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_88_8",
    "position": {
      "x": 88,
      "y": 0,
      "z": 8
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_104_8",
    "position": {
      "x": 104,
      "y": 0,
      "z": 8
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_120_8",
    "position": {
      "x": 120,
      "y": 0,
      "z": 8
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_136_8",
    "position": {
      "x": 136,
      "y": 0,
      "z": 8
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_152_8",
    "position": {
      "x": 152,
      "y": 0,
      "z": 8
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_168_8",
    "position": {
      "x": 168,
      "y": 0,
      "z": 8
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_184_8",
    "position": {
      "x": 184,
      "y": 0,
      "z": 8
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_200_8",
    "position": {
      "x": 200,
      "y": 0,
      "z": 8
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_216_8",
    "position": {
      "x": 216,
      "y": 0,
      "z": 8
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_232_8",
    "position": {
      "x": 232,
      "y": 0,
      "z": 8
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_248_8",
    "position": {
      "x": 248,
      "y": 0,
      "z": 8
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_264_8",
    "position": {
      "x": 264,
      "y": 0,
      "z": 8
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_280_8",
    "position": {
      "x": 280,
      "y": 0,
      "z": 8
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_296_8",
    "position": {
      "x": 296,
      "y": 0,
      "z": 8
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_312_8",
    "position": {
      "x": 312,
      "y": 0,
      "z": 8
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_328_8",
    "position": {
      "x": 328,
      "y": 0,
      "z": 8
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_344_8",
    "position": {
      "x": 344,
      "y": 0,
      "z": 8
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_360_8",
    "position": {
      "x": 360,
      "y": 0,
      "z": 8
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_376_8",
    "position": {
      "x": 376,
      "y": 0,
      "z": 8
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_392_8",
    "position": {
      "x": 392,
      "y": 0,
      "z": 8
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_408_8",
    "position": {
      "x": 408,
      "y": 0,
      "z": 8
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_424_8",
    "position": {
      "x": 424,
      "y": 0,
      "z": 8
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_440_8",
    "position": {
      "x": 440,
      "y": 0,
      "z": 8
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_456_8",
    "position": {
      "x": 456,
      "y": 0,
      "z": 8
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_472_8",
    "position": {
      "x": 472,
      "y": 0,
      "z": 8
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_488_8",
    "position": {
      "x": 488,
      "y": 0,
      "z": 8
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_8_24",
    "position": {
      "x": 8,
      "y": 0,
      "z": 24
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_24_24",
    "position": {
      "x": 24,
      "y": 0,
      "z": 24
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_40_24",
    "position": {
      "x": 40,
      "y": 0,
      "z": 24
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_56_24",
    "position": {
      "x": 56,
      "y": 0,
      "z": 24
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_72_24",
    "position": {
      "x": 72,
      "y": 0,
      "z": 24
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_88_24",
    "position": {
      "x": 88,
      "y": 0,
      "z": 24
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_104_24",
    "position": {
      "x": 104,
      "y": 0,
      "z": 24
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_120_24",
    "position": {
      "x": 120,
      "y": 0,
      "z": 24
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_136_24",
    "position": {
      "x": 136,
      "y": 0,
      "z": 24
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_152_24",
    "position": {
      "x": 152,
      "y": 0,
      "z": 24
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_168_24",
    "position": {
      "x": 168,
      "y": 0,
      "z": 24
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_184_24",
    "position": {
      "x": 184,
      "y": 0,
      "z": 24
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_200_24",
    "position": {
      "x": 200,
      "y": 0,
      "z": 24
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_216_24",
    "position": {
      "x": 216,
      "y": 0,
      "z": 24
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_232_24",
    "position": {
      "x": 232,
      "y": 0,
      "z": 24
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_248_24",
    "position": {
      "x": 248,
      "y": 0,
      "z": 24
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_264_24",
    "position": {
      "x": 264,
      "y": 0,
      "z": 24
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_280_24",
    "position": {
      "x": 280,
      "y": 0,
      "z": 24
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_296_24",
    "position": {
      "x": 296,
      "y": 0,
      "z": 24
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_312_24",
    "position": {
      "x": 312,
      "y": 0,
      "z": 24
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_328_24",
    "position": {
      "x": 328,
      "y": 0,
      "z": 24
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_344_24",
    "position": {
      "x": 344,
      "y": 0,
      "z": 24
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_360_24",
    "position": {
      "x": 360,
      "y": 0,
      "z": 24
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_376_24",
    "position": {
      "x": 376,
      "y": 0,
      "z": 24
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_392_24",
    "position": {
      "x": 392,
      "y": 0,
      "z": 24
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_408_24",
    "position": {
      "x": 408,
      "y": 0,
      "z": 24
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_424_24",
    "position": {
      "x": 424,
      "y": 0,
      "z": 24
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_440_24",
    "position": {
      "x": 440,
      "y": 0,
      "z": 24
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_456_24",
    "position": {
      "x": 456,
      "y": 0,
      "z": 24
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_472_24",
    "position": {
      "x": 472,
      "y": 0,
      "z": 24
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_488_24",
    "position": {
      "x": 488,
      "y": 0,
      "z": 24
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_8_40",
    "position": {
      "x": 8,
      "y": 0,
      "z": 40
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_24_40",
    "position": {
      "x": 24,
      "y": 0,
      "z": 40
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_40_40",
    "position": {
      "x": 40,
      "y": 0,
      "z": 40
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_56_40",
    "position": {
      "x": 56,
      "y": 0,
      "z": 40
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_72_40",
    "position": {
      "x": 72,
      "y": 0,
      "z": 40
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_88_40",
    "position": {
      "x": 88,
      "y": 0,
      "z": 40
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_104_40",
    "position": {
      "x": 104,
      "y": 0,
      "z": 40
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_120_40",
    "position": {
      "x": 120,
      "y": 0,
      "z": 40
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_136_40",
    "position": {
      "x": 136,
      "y": 0,
      "z": 40
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_152_40",
    "position": {
      "x": 152,
      "y": 0,
      "z": 40
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_168_40",
    "position": {
      "x": 168,
      "y": 0,
      "z": 40
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_184_40",
    "position": {
      "x": 184,
      "y": 0,
      "z": 40
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_200_40",
    "position": {
      "x": 200,
      "y": 0,
      "z": 40
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_216_40",
    "position": {
      "x": 216,
      "y": 0,
      "z": 40
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_232_40",
    "position": {
      "x": 232,
      "y": 0,
      "z": 40
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_248_40",
    "position": {
      "x": 248,
      "y": 0,
      "z": 40
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_264_40",
    "position": {
      "x": 264,
      "y": 0,
      "z": 40
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_280_40",
    "position": {
      "x": 280,
      "y": 0,
      "z": 40
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_296_40",
    "position": {
      "x": 296,
      "y": 0,
      "z": 40
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_312_40",
    "position": {
      "x": 312,
      "y": 0,
      "z": 40
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_328_40",
    "position": {
      "x": 328,
      "y": 0,
      "z": 40
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_344_40",
    "position": {
      "x": 344,
      "y": 0,
      "z": 40
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_360_40",
    "position": {
      "x": 360,
      "y": 0,
      "z": 40
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_376_40",
    "position": {
      "x": 376,
      "y": 0,
      "z": 40
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_392_40",
    "position": {
      "x": 392,
      "y": 0,
      "z": 40
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_408_40",
    "position": {
      "x": 408,
      "y": 0,
      "z": 40
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_424_40",
    "position": {
      "x": 424,
      "y": 0,
      "z": 40
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_440_40",
    "position": {
      "x": 440,
      "y": 0,
      "z": 40
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_456_40",
    "position": {
      "x": 456,
      "y": 0,
      "z": 40
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_472_40",
    "position": {
      "x": 472,
      "y": 0,
      "z": 40
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_488_40",
    "position": {
      "x": 488,
      "y": 0,
      "z": 40
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_8_56",
    "position": {
      "x": 8,
      "y": 0,
      "z": 56
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_24_56",
    "position": {
      "x": 24,
      "y": 0,
      "z": 56
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_40_56",
    "position": {
      "x": 40,
      "y": 0,
      "z": 56
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_56_56",
    "position": {
      "x": 56,
      "y": 0,
      "z": 56
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_72_56",
    "position": {
      "x": 72,
      "y": 0,
      "z": 56
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_88_56",
    "position": {
      "x": 88,
      "y": 0,
      "z": 56
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_104_56",
    "position": {
      "x": 104,
      "y": 0,
      "z": 56
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_120_56",
    "position": {
      "x": 120,
      "y": 0,
      "z": 56
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_136_56",
    "position": {
      "x": 136,
      "y": 0,
      "z": 56
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_152_56",
    "position": {
      "x": 152,
      "y": 0,
      "z": 56
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_168_56",
    "position": {
      "x": 168,
      "y": 0,
      "z": 56
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_184_56",
    "position": {
      "x": 184,
      "y": 0,
      "z": 56
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_200_56",
    "position": {
      "x": 200,
      "y": 0,
      "z": 56
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_216_56",
    "position": {
      "x": 216,
      "y": 0,
      "z": 56
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_232_56",
    "position": {
      "x": 232,
      "y": 0,
      "z": 56
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_248_56",
    "position": {
      "x": 248,
      "y": 0,
      "z": 56
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_264_56",
    "position": {
      "x": 264,
      "y": 0,
      "z": 56
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_280_56",
    "position": {
      "x": 280,
      "y": 0,
      "z": 56
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_296_56",
    "position": {
      "x": 296,
      "y": 0,
      "z": 56
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_312_56",
    "position": {
      "x": 312,
      "y": 0,
      "z": 56
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_328_56",
    "position": {
      "x": 328,
      "y": 0,
      "z": 56
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_344_56",
    "position": {
      "x": 344,
      "y": 0,
      "z": 56
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_360_56",
    "position": {
      "x": 360,
      "y": 0,
      "z": 56
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_376_56",
    "position": {
      "x": 376,
      "y": 0,
      "z": 56
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_392_56",
    "position": {
      "x": 392,
      "y": 0,
      "z": 56
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_408_56",
    "position": {
      "x": 408,
      "y": 0,
      "z": 56
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_424_56",
    "position": {
      "x": 424,
      "y": 0,
      "z": 56
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_440_56",
    "position": {
      "x": 440,
      "y": 0,
      "z": 56
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_456_56",
    "position": {
      "x": 456,
      "y": 0,
      "z": 56
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_472_56",
    "position": {
      "x": 472,
      "y": 0,
      "z": 56
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_488_56",
    "position": {
      "x": 488,
      "y": 0,
      "z": 56
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_8_72",
    "position": {
      "x": 8,
      "y": 0,
      "z": 72
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_24_72",
    "position": {
      "x": 24,
      "y": 0,
      "z": 72
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_40_72",
    "position": {
      "x": 40,
      "y": 0,
      "z": 72
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_56_72",
    "position": {
      "x": 56,
      "y": 0,
      "z": 72
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_72_72",
    "position": {
      "x": 72,
      "y": 0,
      "z": 72
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_88_72",
    "position": {
      "x": 88,
      "y": 0,
      "z": 72
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_104_72",
    "position": {
      "x": 104,
      "y": 0,
      "z": 72
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_120_72",
    "position": {
      "x": 120,
      "y": 0,
      "z": 72
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_136_72",
    "position": {
      "x": 136,
      "y": 0,
      "z": 72
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_152_72",
    "position": {
      "x": 152,
      "y": 0,
      "z": 72
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_168_72",
    "position": {
      "x": 168,
      "y": 0,
      "z": 72
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_184_72",
    "position": {
      "x": 184,
      "y": 0,
      "z": 72
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_200_72",
    "position": {
      "x": 200,
      "y": 0,
      "z": 72
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_216_72",
    "position": {
      "x": 216,
      "y": 0,
      "z": 72
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_232_72",
    "position": {
      "x": 232,
      "y": 0,
      "z": 72
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_248_72",
    "position": {
      "x": 248,
      "y": 0,
      "z": 72
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_264_72",
    "position": {
      "x": 264,
      "y": 0,
      "z": 72
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_280_72",
    "position": {
      "x": 280,
      "y": 0,
      "z": 72
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_296_72",
    "position": {
      "x": 296,
      "y": 0,
      "z": 72
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_312_72",
    "position": {
      "x": 312,
      "y": 0,
      "z": 72
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_328_72",
    "position": {
      "x": 328,
      "y": 0,
      "z": 72
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_344_72",
    "position": {
      "x": 344,
      "y": 0,
      "z": 72
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_360_72",
    "position": {
      "x": 360,
      "y": 0,
      "z": 72
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_376_72",
    "position": {
      "x": 376,
      "y": 0,
      "z": 72
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_392_72",
    "position": {
      "x": 392,
      "y": 0,
      "z": 72
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_408_72",
    "position": {
      "x": 408,
      "y": 0,
      "z": 72
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_424_72",
    "position": {
      "x": 424,
      "y": 0,
      "z": 72
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_440_72",
    "position": {
      "x": 440,
      "y": 0,
      "z": 72
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_456_72",
    "position": {
      "x": 456,
      "y": 0,
      "z": 72
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_472_72",
    "position": {
      "x": 472,
      "y": 0,
      "z": 72
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_488_72",
    "position": {
      "x": 488,
      "y": 0,
      "z": 72
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_8_88",
    "position": {
      "x": 8,
      "y": 0,
      "z": 88
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_24_88",
    "position": {
      "x": 24,
      "y": 0,
      "z": 88
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_40_88",
    "position": {
      "x": 40,
      "y": 0,
      "z": 88
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_56_88",
    "position": {
      "x": 56,
      "y": 0,
      "z": 88
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_72_88",
    "position": {
      "x": 72,
      "y": 0,
      "z": 88
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_88_88",
    "position": {
      "x": 88,
      "y": 0,
      "z": 88
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_104_88",
    "position": {
      "x": 104,
      "y": 0,
      "z": 88
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_120_88",
    "position": {
      "x": 120,
      "y": 0,
      "z": 88
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_136_88",
    "position": {
      "x": 136,
      "y": 0,
      "z": 88
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_152_88",
    "position": {
      "x": 152,
      "y": 0,
      "z": 88
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_168_88",
    "position": {
      "x": 168,
      "y": 0,
      "z": 88
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_184_88",
    "position": {
      "x": 184,
      "y": 0,
      "z": 88
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_200_88",
    "position": {
      "x": 200,
      "y": 0,
      "z": 88
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_216_88",
    "position": {
      "x": 216,
      "y": 0,
      "z": 88
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_232_88",
    "position": {
      "x": 232,
      "y": 0,
      "z": 88
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_248_88",
    "position": {
      "x": 248,
      "y": 0,
      "z": 88
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_264_88",
    "position": {
      "x": 264,
      "y": 0,
      "z": 88
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 24,
    "regionId": 0
  },
  {
    "id": "water_280_88",
    "position": {
      "x": 280,
      "y": 0,
      "z": 88
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 28,
    "regionId": 0
  },
  {
    "id": "water_296_88",
    "position": {
      "x": 296,
      "y": 0,
      "z": 88
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_312_88",
    "position": {
      "x": 312,
      "y": 0,
      "z": 88
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_328_88",
    "position": {
      "x": 328,
      "y": 0,
      "z": 88
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_344_88",
    "position": {
      "x": 344,
      "y": 0,
      "z": 88
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_360_88",
    "position": {
      "x": 360,
      "y": 0,
      "z": 88
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_376_88",
    "position": {
      "x": 376,
      "y": 0,
      "z": 88
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_392_88",
    "position": {
      "x": 392,
      "y": 0,
      "z": 88
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_408_88",
    "position": {
      "x": 408,
      "y": 0,
      "z": 88
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_424_88",
    "position": {
      "x": 424,
      "y": 0,
      "z": 88
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_440_88",
    "position": {
      "x": 440,
      "y": 0,
      "z": 88
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_456_88",
    "position": {
      "x": 456,
      "y": 0,
      "z": 88
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_472_88",
    "position": {
      "x": 472,
      "y": 0,
      "z": 88
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_488_88",
    "position": {
      "x": 488,
      "y": 0,
      "z": 88
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_8_104",
    "position": {
      "x": 8,
      "y": 0,
      "z": 104
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_24_104",
    "position": {
      "x": 24,
      "y": 0,
      "z": 104
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_40_104",
    "position": {
      "x": 40,
      "y": 0,
      "z": 104
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_56_104",
    "position": {
      "x": 56,
      "y": 0,
      "z": 104
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_72_104",
    "position": {
      "x": 72,
      "y": 0,
      "z": 104
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_88_104",
    "position": {
      "x": 88,
      "y": 0,
      "z": 104
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_104_104",
    "position": {
      "x": 104,
      "y": 0,
      "z": 104
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_120_104",
    "position": {
      "x": 120,
      "y": 0,
      "z": 104
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_136_104",
    "position": {
      "x": 136,
      "y": 0,
      "z": 104
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_152_104",
    "position": {
      "x": 152,
      "y": 0,
      "z": 104
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_168_104",
    "position": {
      "x": 168,
      "y": 0,
      "z": 104
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_184_104",
    "position": {
      "x": 184,
      "y": 0,
      "z": 104
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_200_104",
    "position": {
      "x": 200,
      "y": 0,
      "z": 104
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_216_104",
    "position": {
      "x": 216,
      "y": 0,
      "z": 104
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 30,
    "regionId": 0
  },
  {
    "id": "water_232_104",
    "position": {
      "x": 232,
      "y": 0,
      "z": 104
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.29,
    "width": 6,
    "regionId": 0
  },
  {
    "id": "water_248_104",
    "position": {
      "x": 248,
      "y": 0,
      "z": 104
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.01,
    "width": 4,
    "regionId": 0
  },
  {
    "id": "water_296_104",
    "position": {
      "x": 296,
      "y": 0,
      "z": 104
    },
    "type": "sea",
    "clearance": 8,
    "depth": 2.69,
    "width": 16,
    "regionId": 0
  },
  {
    "id": "water_312_104",
    "position": {
      "x": 312,
      "y": 0,
      "z": 104
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 30,
    "regionId": 0
  },
  {
    "id": "water_328_104",
    "position": {
      "x": 328,
      "y": 0,
      "z": 104
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 26,
    "regionId": 0
  },
  {
    "id": "water_344_104",
    "position": {
      "x": 344,
      "y": 0,
      "z": 104
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_360_104",
    "position": {
      "x": 360,
      "y": 0,
      "z": 104
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_376_104",
    "position": {
      "x": 376,
      "y": 0,
      "z": 104
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_392_104",
    "position": {
      "x": 392,
      "y": 0,
      "z": 104
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_408_104",
    "position": {
      "x": 408,
      "y": 0,
      "z": 104
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_424_104",
    "position": {
      "x": 424,
      "y": 0,
      "z": 104
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_440_104",
    "position": {
      "x": 440,
      "y": 0,
      "z": 104
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_456_104",
    "position": {
      "x": 456,
      "y": 0,
      "z": 104
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_472_104",
    "position": {
      "x": 472,
      "y": 0,
      "z": 104
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_488_104",
    "position": {
      "x": 488,
      "y": 0,
      "z": 104
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_8_120",
    "position": {
      "x": 8,
      "y": 0,
      "z": 120
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_24_120",
    "position": {
      "x": 24,
      "y": 0,
      "z": 120
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_40_120",
    "position": {
      "x": 40,
      "y": 0,
      "z": 120
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_56_120",
    "position": {
      "x": 56,
      "y": 0,
      "z": 120
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_72_120",
    "position": {
      "x": 72,
      "y": 0,
      "z": 120
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_88_120",
    "position": {
      "x": 88,
      "y": 0,
      "z": 120
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_104_120",
    "position": {
      "x": 104,
      "y": 0,
      "z": 120
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_120_120",
    "position": {
      "x": 120,
      "y": 0,
      "z": 120
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_136_120",
    "position": {
      "x": 136,
      "y": 0,
      "z": 120
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_152_120",
    "position": {
      "x": 152,
      "y": 0,
      "z": 120
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_168_120",
    "position": {
      "x": 168,
      "y": 0,
      "z": 120
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_184_120",
    "position": {
      "x": 184,
      "y": 0,
      "z": 120
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_200_120",
    "position": {
      "x": 200,
      "y": 0,
      "z": 120
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 24,
    "regionId": 0
  },
  {
    "id": "water_296_120",
    "position": {
      "x": 296,
      "y": 0,
      "z": 120
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.57,
    "width": 8,
    "regionId": 0
  },
  {
    "id": "water_344_120",
    "position": {
      "x": 344,
      "y": 0,
      "z": 120
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 30,
    "regionId": 0
  },
  {
    "id": "water_360_120",
    "position": {
      "x": 360,
      "y": 0,
      "z": 120
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_376_120",
    "position": {
      "x": 376,
      "y": 0,
      "z": 120
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_392_120",
    "position": {
      "x": 392,
      "y": 0,
      "z": 120
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_408_120",
    "position": {
      "x": 408,
      "y": 0,
      "z": 120
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_424_120",
    "position": {
      "x": 424,
      "y": 0,
      "z": 120
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_440_120",
    "position": {
      "x": 440,
      "y": 0,
      "z": 120
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_456_120",
    "position": {
      "x": 456,
      "y": 0,
      "z": 120
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_472_120",
    "position": {
      "x": 472,
      "y": 0,
      "z": 120
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_488_120",
    "position": {
      "x": 488,
      "y": 0,
      "z": 120
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_8_136",
    "position": {
      "x": 8,
      "y": 0,
      "z": 136
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_24_136",
    "position": {
      "x": 24,
      "y": 0,
      "z": 136
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_40_136",
    "position": {
      "x": 40,
      "y": 0,
      "z": 136
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_56_136",
    "position": {
      "x": 56,
      "y": 0,
      "z": 136
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_72_136",
    "position": {
      "x": 72,
      "y": 0,
      "z": 136
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_88_136",
    "position": {
      "x": 88,
      "y": 0,
      "z": 136
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_104_136",
    "position": {
      "x": 104,
      "y": 0,
      "z": 136
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_120_136",
    "position": {
      "x": 120,
      "y": 0,
      "z": 136
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_136_136",
    "position": {
      "x": 136,
      "y": 0,
      "z": 136
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_152_136",
    "position": {
      "x": 152,
      "y": 0,
      "z": 136
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_168_136",
    "position": {
      "x": 168,
      "y": 0,
      "z": 136
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.57,
    "width": 8,
    "regionId": 0
  },
  {
    "id": "water_184_136",
    "position": {
      "x": 184,
      "y": 0,
      "z": 136
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 20,
    "regionId": 0
  },
  {
    "id": "water_200_136",
    "position": {
      "x": 200,
      "y": 0,
      "z": 136
    },
    "type": "sea",
    "clearance": 8,
    "depth": 2.69,
    "width": 16,
    "regionId": 0
  },
  {
    "id": "water_264_136",
    "position": {
      "x": 264,
      "y": 0,
      "z": 136
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.01,
    "width": 4,
    "regionId": 0
  },
  {
    "id": "water_280_136",
    "position": {
      "x": 280,
      "y": 0,
      "z": 136
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.57,
    "width": 8,
    "regionId": 0
  },
  {
    "id": "water_296_136",
    "position": {
      "x": 296,
      "y": 0,
      "z": 136
    },
    "type": "sea",
    "clearance": 8,
    "depth": 2.97,
    "width": 18,
    "regionId": 0
  },
  {
    "id": "water_328_136",
    "position": {
      "x": 328,
      "y": 0,
      "z": 136
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.29,
    "width": 6,
    "regionId": 0
  },
  {
    "id": "water_344_136",
    "position": {
      "x": 344,
      "y": 0,
      "z": 136
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.01,
    "width": 4,
    "regionId": 0
  },
  {
    "id": "water_360_136",
    "position": {
      "x": 360,
      "y": 0,
      "z": 136
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 30,
    "regionId": 0
  },
  {
    "id": "water_376_136",
    "position": {
      "x": 376,
      "y": 0,
      "z": 136
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_392_136",
    "position": {
      "x": 392,
      "y": 0,
      "z": 136
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_408_136",
    "position": {
      "x": 408,
      "y": 0,
      "z": 136
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_424_136",
    "position": {
      "x": 424,
      "y": 0,
      "z": 136
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_440_136",
    "position": {
      "x": 440,
      "y": 0,
      "z": 136
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_456_136",
    "position": {
      "x": 456,
      "y": 0,
      "z": 136
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_472_136",
    "position": {
      "x": 472,
      "y": 0,
      "z": 136
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_488_136",
    "position": {
      "x": 488,
      "y": 0,
      "z": 136
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_8_152",
    "position": {
      "x": 8,
      "y": 0,
      "z": 152
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_24_152",
    "position": {
      "x": 24,
      "y": 0,
      "z": 152
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_40_152",
    "position": {
      "x": 40,
      "y": 0,
      "z": 152
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_56_152",
    "position": {
      "x": 56,
      "y": 0,
      "z": 152
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_72_152",
    "position": {
      "x": 72,
      "y": 0,
      "z": 152
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_88_152",
    "position": {
      "x": 88,
      "y": 0,
      "z": 152
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_104_152",
    "position": {
      "x": 104,
      "y": 0,
      "z": 152
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_120_152",
    "position": {
      "x": 120,
      "y": 0,
      "z": 152
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_136_152",
    "position": {
      "x": 136,
      "y": 0,
      "z": 152
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_152_152",
    "position": {
      "x": 152,
      "y": 0,
      "z": 152
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.85,
    "width": 10,
    "regionId": 0
  },
  {
    "id": "water_200_152",
    "position": {
      "x": 200,
      "y": 0,
      "z": 152
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.85,
    "width": 10,
    "regionId": 0
  },
  {
    "id": "water_248_152",
    "position": {
      "x": 248,
      "y": 0,
      "z": 152
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.57,
    "width": 8,
    "regionId": 0
  },
  {
    "id": "water_392_152",
    "position": {
      "x": 392,
      "y": 0,
      "z": 152
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_408_152",
    "position": {
      "x": 408,
      "y": 0,
      "z": 152
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_424_152",
    "position": {
      "x": 424,
      "y": 0,
      "z": 152
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_440_152",
    "position": {
      "x": 440,
      "y": 0,
      "z": 152
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_456_152",
    "position": {
      "x": 456,
      "y": 0,
      "z": 152
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_472_152",
    "position": {
      "x": 472,
      "y": 0,
      "z": 152
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_488_152",
    "position": {
      "x": 488,
      "y": 0,
      "z": 152
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_8_168",
    "position": {
      "x": 8,
      "y": 0,
      "z": 168
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_24_168",
    "position": {
      "x": 24,
      "y": 0,
      "z": 168
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_40_168",
    "position": {
      "x": 40,
      "y": 0,
      "z": 168
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_56_168",
    "position": {
      "x": 56,
      "y": 0,
      "z": 168
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_72_168",
    "position": {
      "x": 72,
      "y": 0,
      "z": 168
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_88_168",
    "position": {
      "x": 88,
      "y": 0,
      "z": 168
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_104_168",
    "position": {
      "x": 104,
      "y": 0,
      "z": 168
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_120_168",
    "position": {
      "x": 120,
      "y": 0,
      "z": 168
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_136_168",
    "position": {
      "x": 136,
      "y": 0,
      "z": 168
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.85,
    "width": 10,
    "regionId": 0
  },
  {
    "id": "water_376_168",
    "position": {
      "x": 376,
      "y": 0,
      "z": 168
    },
    "type": "sea",
    "clearance": 8,
    "depth": 0.73,
    "width": 2,
    "regionId": 0
  },
  {
    "id": "water_392_168",
    "position": {
      "x": 392,
      "y": 0,
      "z": 168
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_408_168",
    "position": {
      "x": 408,
      "y": 0,
      "z": 168
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_424_168",
    "position": {
      "x": 424,
      "y": 0,
      "z": 168
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_440_168",
    "position": {
      "x": 440,
      "y": 0,
      "z": 168
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_456_168",
    "position": {
      "x": 456,
      "y": 0,
      "z": 168
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_472_168",
    "position": {
      "x": 472,
      "y": 0,
      "z": 168
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_488_168",
    "position": {
      "x": 488,
      "y": 0,
      "z": 168
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_8_184",
    "position": {
      "x": 8,
      "y": 0,
      "z": 184
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_24_184",
    "position": {
      "x": 24,
      "y": 0,
      "z": 184
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_40_184",
    "position": {
      "x": 40,
      "y": 0,
      "z": 184
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_56_184",
    "position": {
      "x": 56,
      "y": 0,
      "z": 184
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_72_184",
    "position": {
      "x": 72,
      "y": 0,
      "z": 184
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_88_184",
    "position": {
      "x": 88,
      "y": 0,
      "z": 184
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_104_184",
    "position": {
      "x": 104,
      "y": 0,
      "z": 184
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_120_184",
    "position": {
      "x": 120,
      "y": 0,
      "z": 184
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_136_184",
    "position": {
      "x": 136,
      "y": 0,
      "z": 184
    },
    "type": "sea",
    "clearance": 8,
    "depth": 2.41,
    "width": 14,
    "regionId": 0
  },
  {
    "id": "water_392_184",
    "position": {
      "x": 392,
      "y": 0,
      "z": 184
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_408_184",
    "position": {
      "x": 408,
      "y": 0,
      "z": 184
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_424_184",
    "position": {
      "x": 424,
      "y": 0,
      "z": 184
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_440_184",
    "position": {
      "x": 440,
      "y": 0,
      "z": 184
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_456_184",
    "position": {
      "x": 456,
      "y": 0,
      "z": 184
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_472_184",
    "position": {
      "x": 472,
      "y": 0,
      "z": 184
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_488_184",
    "position": {
      "x": 488,
      "y": 0,
      "z": 184
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_8_200",
    "position": {
      "x": 8,
      "y": 0,
      "z": 200
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_24_200",
    "position": {
      "x": 24,
      "y": 0,
      "z": 200
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_40_200",
    "position": {
      "x": 40,
      "y": 0,
      "z": 200
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_56_200",
    "position": {
      "x": 56,
      "y": 0,
      "z": 200
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_72_200",
    "position": {
      "x": 72,
      "y": 0,
      "z": 200
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_88_200",
    "position": {
      "x": 88,
      "y": 0,
      "z": 200
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_104_200",
    "position": {
      "x": 104,
      "y": 0,
      "z": 200
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_120_200",
    "position": {
      "x": 120,
      "y": 0,
      "z": 200
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.85,
    "width": 10,
    "regionId": 0
  },
  {
    "id": "water_264_200",
    "position": {
      "x": 264,
      "y": 0,
      "z": 200
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.01,
    "width": 4,
    "regionId": 0
  },
  {
    "id": "water_344_200",
    "position": {
      "x": 344,
      "y": 0,
      "z": 200
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.57,
    "width": 8,
    "regionId": 0
  },
  {
    "id": "water_360_200",
    "position": {
      "x": 360,
      "y": 0,
      "z": 200
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.29,
    "width": 6,
    "regionId": 0
  },
  {
    "id": "water_376_200",
    "position": {
      "x": 376,
      "y": 0,
      "z": 200
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.01,
    "width": 4,
    "regionId": 0
  },
  {
    "id": "water_392_200",
    "position": {
      "x": 392,
      "y": 0,
      "z": 200
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.29,
    "width": 6,
    "regionId": 0
  },
  {
    "id": "water_408_200",
    "position": {
      "x": 408,
      "y": 0,
      "z": 200
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_424_200",
    "position": {
      "x": 424,
      "y": 0,
      "z": 200
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_440_200",
    "position": {
      "x": 440,
      "y": 0,
      "z": 200
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_456_200",
    "position": {
      "x": 456,
      "y": 0,
      "z": 200
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_472_200",
    "position": {
      "x": 472,
      "y": 0,
      "z": 200
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_488_200",
    "position": {
      "x": 488,
      "y": 0,
      "z": 200
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_8_216",
    "position": {
      "x": 8,
      "y": 0,
      "z": 216
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_24_216",
    "position": {
      "x": 24,
      "y": 0,
      "z": 216
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_40_216",
    "position": {
      "x": 40,
      "y": 0,
      "z": 216
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_56_216",
    "position": {
      "x": 56,
      "y": 0,
      "z": 216
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_72_216",
    "position": {
      "x": 72,
      "y": 0,
      "z": 216
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_88_216",
    "position": {
      "x": 88,
      "y": 0,
      "z": 216
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_104_216",
    "position": {
      "x": 104,
      "y": 0,
      "z": 216
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_120_216",
    "position": {
      "x": 120,
      "y": 0,
      "z": 216
    },
    "type": "sea",
    "clearance": 8,
    "depth": 2.13,
    "width": 12,
    "regionId": 0
  },
  {
    "id": "water_184_216",
    "position": {
      "x": 184,
      "y": 0,
      "z": 216
    },
    "type": "sea",
    "clearance": 8,
    "depth": 0.73,
    "width": 2,
    "regionId": 0
  },
  {
    "id": "water_248_216",
    "position": {
      "x": 248,
      "y": 0,
      "z": 216
    },
    "type": "sea",
    "clearance": 8,
    "depth": 0.73,
    "width": 2,
    "regionId": 0
  },
  {
    "id": "water_392_216",
    "position": {
      "x": 392,
      "y": 0,
      "z": 216
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.29,
    "width": 6,
    "regionId": 0
  },
  {
    "id": "water_408_216",
    "position": {
      "x": 408,
      "y": 0,
      "z": 216
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_424_216",
    "position": {
      "x": 424,
      "y": 0,
      "z": 216
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_440_216",
    "position": {
      "x": 440,
      "y": 0,
      "z": 216
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_456_216",
    "position": {
      "x": 456,
      "y": 0,
      "z": 216
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_472_216",
    "position": {
      "x": 472,
      "y": 0,
      "z": 216
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_488_216",
    "position": {
      "x": 488,
      "y": 0,
      "z": 216
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_8_232",
    "position": {
      "x": 8,
      "y": 0,
      "z": 232
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_24_232",
    "position": {
      "x": 24,
      "y": 0,
      "z": 232
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_40_232",
    "position": {
      "x": 40,
      "y": 0,
      "z": 232
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_56_232",
    "position": {
      "x": 56,
      "y": 0,
      "z": 232
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_72_232",
    "position": {
      "x": 72,
      "y": 0,
      "z": 232
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_88_232",
    "position": {
      "x": 88,
      "y": 0,
      "z": 232
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_104_232",
    "position": {
      "x": 104,
      "y": 0,
      "z": 232
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_120_232",
    "position": {
      "x": 120,
      "y": 0,
      "z": 232
    },
    "type": "sea",
    "clearance": 8,
    "depth": 0.73,
    "width": 2,
    "regionId": 0
  },
  {
    "id": "water_168_232",
    "position": {
      "x": 168,
      "y": 0,
      "z": 232
    },
    "type": "sea",
    "clearance": 8,
    "depth": 2.41,
    "width": 14,
    "regionId": 0
  },
  {
    "id": "water_184_232",
    "position": {
      "x": 184,
      "y": 0,
      "z": 232
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_200_232",
    "position": {
      "x": 200,
      "y": 0,
      "z": 232
    },
    "type": "sea",
    "clearance": 8,
    "depth": 2.97,
    "width": 18,
    "regionId": 0
  },
  {
    "id": "water_216_232",
    "position": {
      "x": 216,
      "y": 0,
      "z": 232
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.01,
    "width": 4,
    "regionId": 0
  },
  {
    "id": "water_232_232",
    "position": {
      "x": 232,
      "y": 0,
      "z": 232
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.01,
    "width": 4,
    "regionId": 0
  },
  {
    "id": "water_408_232",
    "position": {
      "x": 408,
      "y": 0,
      "z": 232
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 28,
    "regionId": 0
  },
  {
    "id": "water_424_232",
    "position": {
      "x": 424,
      "y": 0,
      "z": 232
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_440_232",
    "position": {
      "x": 440,
      "y": 0,
      "z": 232
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_456_232",
    "position": {
      "x": 456,
      "y": 0,
      "z": 232
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_472_232",
    "position": {
      "x": 472,
      "y": 0,
      "z": 232
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_488_232",
    "position": {
      "x": 488,
      "y": 0,
      "z": 232
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_8_248",
    "position": {
      "x": 8,
      "y": 0,
      "z": 248
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_24_248",
    "position": {
      "x": 24,
      "y": 0,
      "z": 248
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_40_248",
    "position": {
      "x": 40,
      "y": 0,
      "z": 248
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_56_248",
    "position": {
      "x": 56,
      "y": 0,
      "z": 248
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_72_248",
    "position": {
      "x": 72,
      "y": 0,
      "z": 248
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_88_248",
    "position": {
      "x": 88,
      "y": 0,
      "z": 248
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_104_248",
    "position": {
      "x": 104,
      "y": 0,
      "z": 248
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.85,
    "width": 10,
    "regionId": 0
  },
  {
    "id": "water_168_248",
    "position": {
      "x": 168,
      "y": 0,
      "z": 248
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.85,
    "width": 10,
    "regionId": 0
  },
  {
    "id": "water_184_248",
    "position": {
      "x": 184,
      "y": 0,
      "z": 248
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_200_248",
    "position": {
      "x": 200,
      "y": 0,
      "z": 248
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.85,
    "width": 10,
    "regionId": 0
  },
  {
    "id": "water_232_248",
    "position": {
      "x": 232,
      "y": 0,
      "z": 248
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.29,
    "width": 6,
    "regionId": 0
  },
  {
    "id": "water_408_248",
    "position": {
      "x": 408,
      "y": 0,
      "z": 248
    },
    "type": "sea",
    "clearance": 8,
    "depth": 0.73,
    "width": 2,
    "regionId": 0
  },
  {
    "id": "water_424_248",
    "position": {
      "x": 424,
      "y": 0,
      "z": 248
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_440_248",
    "position": {
      "x": 440,
      "y": 0,
      "z": 248
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_456_248",
    "position": {
      "x": 456,
      "y": 0,
      "z": 248
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_472_248",
    "position": {
      "x": 472,
      "y": 0,
      "z": 248
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_488_248",
    "position": {
      "x": 488,
      "y": 0,
      "z": 248
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_8_264",
    "position": {
      "x": 8,
      "y": 0,
      "z": 264
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_24_264",
    "position": {
      "x": 24,
      "y": 0,
      "z": 264
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_40_264",
    "position": {
      "x": 40,
      "y": 0,
      "z": 264
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_56_264",
    "position": {
      "x": 56,
      "y": 0,
      "z": 264
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_72_264",
    "position": {
      "x": 72,
      "y": 0,
      "z": 264
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_88_264",
    "position": {
      "x": 88,
      "y": 0,
      "z": 264
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 26,
    "regionId": 0
  },
  {
    "id": "water_168_264",
    "position": {
      "x": 168,
      "y": 0,
      "z": 264
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.57,
    "width": 8,
    "regionId": 0
  },
  {
    "id": "water_184_264",
    "position": {
      "x": 184,
      "y": 0,
      "z": 264
    },
    "type": "sea",
    "clearance": 8,
    "depth": 2.97,
    "width": 18,
    "regionId": 0
  },
  {
    "id": "water_200_264",
    "position": {
      "x": 200,
      "y": 0,
      "z": 264
    },
    "type": "sea",
    "clearance": 8,
    "depth": 2.69,
    "width": 16,
    "regionId": 0
  },
  {
    "id": "water_216_264",
    "position": {
      "x": 216,
      "y": 0,
      "z": 264
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.57,
    "width": 8,
    "regionId": 0
  },
  {
    "id": "water_248_264",
    "position": {
      "x": 248,
      "y": 0,
      "z": 264
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.01,
    "width": 4,
    "regionId": 0
  },
  {
    "id": "water_280_264",
    "position": {
      "x": 280,
      "y": 0,
      "z": 264
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.01,
    "width": 4,
    "regionId": 0
  },
  {
    "id": "water_328_264",
    "position": {
      "x": 328,
      "y": 0,
      "z": 264
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.01,
    "width": 4,
    "regionId": 0
  },
  {
    "id": "water_360_264",
    "position": {
      "x": 360,
      "y": 0,
      "z": 264
    },
    "type": "sea",
    "clearance": 8,
    "depth": 0.73,
    "width": 2,
    "regionId": 0
  },
  {
    "id": "water_376_264",
    "position": {
      "x": 376,
      "y": 0,
      "z": 264
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.85,
    "width": 10,
    "regionId": 0
  },
  {
    "id": "water_408_264",
    "position": {
      "x": 408,
      "y": 0,
      "z": 264
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.57,
    "width": 8,
    "regionId": 0
  },
  {
    "id": "water_424_264",
    "position": {
      "x": 424,
      "y": 0,
      "z": 264
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_440_264",
    "position": {
      "x": 440,
      "y": 0,
      "z": 264
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_456_264",
    "position": {
      "x": 456,
      "y": 0,
      "z": 264
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_472_264",
    "position": {
      "x": 472,
      "y": 0,
      "z": 264
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_488_264",
    "position": {
      "x": 488,
      "y": 0,
      "z": 264
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_8_280",
    "position": {
      "x": 8,
      "y": 0,
      "z": 280
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_24_280",
    "position": {
      "x": 24,
      "y": 0,
      "z": 280
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_40_280",
    "position": {
      "x": 40,
      "y": 0,
      "z": 280
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_56_280",
    "position": {
      "x": 56,
      "y": 0,
      "z": 280
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_72_280",
    "position": {
      "x": 72,
      "y": 0,
      "z": 280
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_88_280",
    "position": {
      "x": 88,
      "y": 0,
      "z": 280
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_104_280",
    "position": {
      "x": 104,
      "y": 0,
      "z": 280
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.57,
    "width": 8,
    "regionId": 0
  },
  {
    "id": "water_248_280",
    "position": {
      "x": 248,
      "y": 0,
      "z": 280
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.29,
    "width": 6,
    "regionId": 0
  },
  {
    "id": "water_280_280",
    "position": {
      "x": 280,
      "y": 0,
      "z": 280
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 20,
    "regionId": 0
  },
  {
    "id": "water_296_280",
    "position": {
      "x": 296,
      "y": 0,
      "z": 280
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.85,
    "width": 10,
    "regionId": 0
  },
  {
    "id": "water_312_280",
    "position": {
      "x": 312,
      "y": 0,
      "z": 280
    },
    "type": "sea",
    "clearance": 8,
    "depth": 2.69,
    "width": 16,
    "regionId": 0
  },
  {
    "id": "water_328_280",
    "position": {
      "x": 328,
      "y": 0,
      "z": 280
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.57,
    "width": 8,
    "regionId": 0
  },
  {
    "id": "water_408_280",
    "position": {
      "x": 408,
      "y": 0,
      "z": 280
    },
    "type": "sea",
    "clearance": 8,
    "depth": 2.69,
    "width": 16,
    "regionId": 0
  },
  {
    "id": "water_424_280",
    "position": {
      "x": 424,
      "y": 0,
      "z": 280
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_440_280",
    "position": {
      "x": 440,
      "y": 0,
      "z": 280
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_456_280",
    "position": {
      "x": 456,
      "y": 0,
      "z": 280
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_472_280",
    "position": {
      "x": 472,
      "y": 0,
      "z": 280
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_488_280",
    "position": {
      "x": 488,
      "y": 0,
      "z": 280
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_8_296",
    "position": {
      "x": 8,
      "y": 0,
      "z": 296
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_24_296",
    "position": {
      "x": 24,
      "y": 0,
      "z": 296
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_40_296",
    "position": {
      "x": 40,
      "y": 0,
      "z": 296
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_56_296",
    "position": {
      "x": 56,
      "y": 0,
      "z": 296
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_72_296",
    "position": {
      "x": 72,
      "y": 0,
      "z": 296
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_88_296",
    "position": {
      "x": 88,
      "y": 0,
      "z": 296
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_104_296",
    "position": {
      "x": 104,
      "y": 0,
      "z": 296
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_120_296",
    "position": {
      "x": 120,
      "y": 0,
      "z": 296
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 24,
    "regionId": 0
  },
  {
    "id": "water_136_296",
    "position": {
      "x": 136,
      "y": 0,
      "z": 296
    },
    "type": "sea",
    "clearance": 8,
    "depth": 0.73,
    "width": 2,
    "regionId": 0
  },
  {
    "id": "water_232_296",
    "position": {
      "x": 232,
      "y": 0,
      "z": 296
    },
    "type": "sea",
    "clearance": 8,
    "depth": 0.73,
    "width": 2,
    "regionId": 0
  },
  {
    "id": "water_312_296",
    "position": {
      "x": 312,
      "y": 0,
      "z": 296
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.01,
    "width": 4,
    "regionId": 0
  },
  {
    "id": "water_328_296",
    "position": {
      "x": 328,
      "y": 0,
      "z": 296
    },
    "type": "sea",
    "clearance": 8,
    "depth": 2.69,
    "width": 16,
    "regionId": 0
  },
  {
    "id": "water_408_296",
    "position": {
      "x": 408,
      "y": 0,
      "z": 296
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 22,
    "regionId": 0
  },
  {
    "id": "water_424_296",
    "position": {
      "x": 424,
      "y": 0,
      "z": 296
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_440_296",
    "position": {
      "x": 440,
      "y": 0,
      "z": 296
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_456_296",
    "position": {
      "x": 456,
      "y": 0,
      "z": 296
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_472_296",
    "position": {
      "x": 472,
      "y": 0,
      "z": 296
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_488_296",
    "position": {
      "x": 488,
      "y": 0,
      "z": 296
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_8_312",
    "position": {
      "x": 8,
      "y": 0,
      "z": 312
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_24_312",
    "position": {
      "x": 24,
      "y": 0,
      "z": 312
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_40_312",
    "position": {
      "x": 40,
      "y": 0,
      "z": 312
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_56_312",
    "position": {
      "x": 56,
      "y": 0,
      "z": 312
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_72_312",
    "position": {
      "x": 72,
      "y": 0,
      "z": 312
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_88_312",
    "position": {
      "x": 88,
      "y": 0,
      "z": 312
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_104_312",
    "position": {
      "x": 104,
      "y": 0,
      "z": 312
    },
    "type": "sea",
    "clearance": 8,
    "depth": 2.69,
    "width": 16,
    "regionId": 0
  },
  {
    "id": "water_216_312",
    "position": {
      "x": 216,
      "y": 0,
      "z": 312
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.57,
    "width": 8,
    "regionId": 0
  },
  {
    "id": "water_280_312",
    "position": {
      "x": 280,
      "y": 0,
      "z": 312
    },
    "type": "sea",
    "clearance": 8,
    "depth": 0.73,
    "width": 2,
    "regionId": 0
  },
  {
    "id": "water_296_312",
    "position": {
      "x": 296,
      "y": 0,
      "z": 312
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.85,
    "width": 10,
    "regionId": 0
  },
  {
    "id": "water_392_312",
    "position": {
      "x": 392,
      "y": 0,
      "z": 312
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 22,
    "regionId": 0
  },
  {
    "id": "water_408_312",
    "position": {
      "x": 408,
      "y": 0,
      "z": 312
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_424_312",
    "position": {
      "x": 424,
      "y": 0,
      "z": 312
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_440_312",
    "position": {
      "x": 440,
      "y": 0,
      "z": 312
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_456_312",
    "position": {
      "x": 456,
      "y": 0,
      "z": 312
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_472_312",
    "position": {
      "x": 472,
      "y": 0,
      "z": 312
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_488_312",
    "position": {
      "x": 488,
      "y": 0,
      "z": 312
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_8_328",
    "position": {
      "x": 8,
      "y": 0,
      "z": 328
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_24_328",
    "position": {
      "x": 24,
      "y": 0,
      "z": 328
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_40_328",
    "position": {
      "x": 40,
      "y": 0,
      "z": 328
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_56_328",
    "position": {
      "x": 56,
      "y": 0,
      "z": 328
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_72_328",
    "position": {
      "x": 72,
      "y": 0,
      "z": 328
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_88_328",
    "position": {
      "x": 88,
      "y": 0,
      "z": 328
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_104_328",
    "position": {
      "x": 104,
      "y": 0,
      "z": 328
    },
    "type": "sea",
    "clearance": 8,
    "depth": 2.13,
    "width": 12,
    "regionId": 0
  },
  {
    "id": "water_152_328",
    "position": {
      "x": 152,
      "y": 0,
      "z": 328
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.85,
    "width": 10,
    "regionId": 0
  },
  {
    "id": "water_168_328",
    "position": {
      "x": 168,
      "y": 0,
      "z": 328
    },
    "type": "sea",
    "clearance": 8,
    "depth": 0.73,
    "width": 2,
    "regionId": 0
  },
  {
    "id": "water_184_328",
    "position": {
      "x": 184,
      "y": 0,
      "z": 328
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.85,
    "width": 10,
    "regionId": 0
  },
  {
    "id": "water_200_328",
    "position": {
      "x": 200,
      "y": 0,
      "z": 328
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.29,
    "width": 6,
    "regionId": 0
  },
  {
    "id": "water_392_328",
    "position": {
      "x": 392,
      "y": 0,
      "z": 328
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 24,
    "regionId": 0
  },
  {
    "id": "water_408_328",
    "position": {
      "x": 408,
      "y": 0,
      "z": 328
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_424_328",
    "position": {
      "x": 424,
      "y": 0,
      "z": 328
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_440_328",
    "position": {
      "x": 440,
      "y": 0,
      "z": 328
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_456_328",
    "position": {
      "x": 456,
      "y": 0,
      "z": 328
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_472_328",
    "position": {
      "x": 472,
      "y": 0,
      "z": 328
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_488_328",
    "position": {
      "x": 488,
      "y": 0,
      "z": 328
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_8_344",
    "position": {
      "x": 8,
      "y": 0,
      "z": 344
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_24_344",
    "position": {
      "x": 24,
      "y": 0,
      "z": 344
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_40_344",
    "position": {
      "x": 40,
      "y": 0,
      "z": 344
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_56_344",
    "position": {
      "x": 56,
      "y": 0,
      "z": 344
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_72_344",
    "position": {
      "x": 72,
      "y": 0,
      "z": 344
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_88_344",
    "position": {
      "x": 88,
      "y": 0,
      "z": 344
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_104_344",
    "position": {
      "x": 104,
      "y": 0,
      "z": 344
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_120_344",
    "position": {
      "x": 120,
      "y": 0,
      "z": 344
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.01,
    "width": 4,
    "regionId": 0
  },
  {
    "id": "water_232_344",
    "position": {
      "x": 232,
      "y": 0,
      "z": 344
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.01,
    "width": 4,
    "regionId": 0
  },
  {
    "id": "water_264_344",
    "position": {
      "x": 264,
      "y": 0,
      "z": 344
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.85,
    "width": 10,
    "regionId": 0
  },
  {
    "id": "water_392_344",
    "position": {
      "x": 392,
      "y": 0,
      "z": 344
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 20,
    "regionId": 0
  },
  {
    "id": "water_408_344",
    "position": {
      "x": 408,
      "y": 0,
      "z": 344
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_424_344",
    "position": {
      "x": 424,
      "y": 0,
      "z": 344
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_440_344",
    "position": {
      "x": 440,
      "y": 0,
      "z": 344
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_456_344",
    "position": {
      "x": 456,
      "y": 0,
      "z": 344
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_472_344",
    "position": {
      "x": 472,
      "y": 0,
      "z": 344
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_488_344",
    "position": {
      "x": 488,
      "y": 0,
      "z": 344
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_8_360",
    "position": {
      "x": 8,
      "y": 0,
      "z": 360
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_24_360",
    "position": {
      "x": 24,
      "y": 0,
      "z": 360
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_40_360",
    "position": {
      "x": 40,
      "y": 0,
      "z": 360
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_56_360",
    "position": {
      "x": 56,
      "y": 0,
      "z": 360
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_72_360",
    "position": {
      "x": 72,
      "y": 0,
      "z": 360
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_88_360",
    "position": {
      "x": 88,
      "y": 0,
      "z": 360
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_104_360",
    "position": {
      "x": 104,
      "y": 0,
      "z": 360
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_120_360",
    "position": {
      "x": 120,
      "y": 0,
      "z": 360
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 28,
    "regionId": 0
  },
  {
    "id": "water_344_360",
    "position": {
      "x": 344,
      "y": 0,
      "z": 360
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 26,
    "regionId": 0
  },
  {
    "id": "water_360_360",
    "position": {
      "x": 360,
      "y": 0,
      "z": 360
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 26,
    "regionId": 0
  },
  {
    "id": "water_376_360",
    "position": {
      "x": 376,
      "y": 0,
      "z": 360
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 24,
    "regionId": 0
  },
  {
    "id": "water_392_360",
    "position": {
      "x": 392,
      "y": 0,
      "z": 360
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_408_360",
    "position": {
      "x": 408,
      "y": 0,
      "z": 360
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_424_360",
    "position": {
      "x": 424,
      "y": 0,
      "z": 360
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_440_360",
    "position": {
      "x": 440,
      "y": 0,
      "z": 360
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_456_360",
    "position": {
      "x": 456,
      "y": 0,
      "z": 360
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_472_360",
    "position": {
      "x": 472,
      "y": 0,
      "z": 360
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_488_360",
    "position": {
      "x": 488,
      "y": 0,
      "z": 360
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_8_376",
    "position": {
      "x": 8,
      "y": 0,
      "z": 376
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_24_376",
    "position": {
      "x": 24,
      "y": 0,
      "z": 376
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_40_376",
    "position": {
      "x": 40,
      "y": 0,
      "z": 376
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_56_376",
    "position": {
      "x": 56,
      "y": 0,
      "z": 376
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_72_376",
    "position": {
      "x": 72,
      "y": 0,
      "z": 376
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_88_376",
    "position": {
      "x": 88,
      "y": 0,
      "z": 376
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_104_376",
    "position": {
      "x": 104,
      "y": 0,
      "z": 376
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_120_376",
    "position": {
      "x": 120,
      "y": 0,
      "z": 376
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_136_376",
    "position": {
      "x": 136,
      "y": 0,
      "z": 376
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 24,
    "regionId": 0
  },
  {
    "id": "water_152_376",
    "position": {
      "x": 152,
      "y": 0,
      "z": 376
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.29,
    "width": 6,
    "regionId": 0
  },
  {
    "id": "water_312_376",
    "position": {
      "x": 312,
      "y": 0,
      "z": 376
    },
    "type": "lake",
    "clearance": 8,
    "depth": 0.8,
    "width": 10,
    "regionId": 2
  },
  {
    "id": "water_344_376",
    "position": {
      "x": 344,
      "y": 0,
      "z": 376
    },
    "type": "sea",
    "clearance": 8,
    "depth": 2.69,
    "width": 16,
    "regionId": 0
  },
  {
    "id": "water_360_376",
    "position": {
      "x": 360,
      "y": 0,
      "z": 376
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_376_376",
    "position": {
      "x": 376,
      "y": 0,
      "z": 376
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_392_376",
    "position": {
      "x": 392,
      "y": 0,
      "z": 376
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_408_376",
    "position": {
      "x": 408,
      "y": 0,
      "z": 376
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_424_376",
    "position": {
      "x": 424,
      "y": 0,
      "z": 376
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_440_376",
    "position": {
      "x": 440,
      "y": 0,
      "z": 376
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_456_376",
    "position": {
      "x": 456,
      "y": 0,
      "z": 376
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_472_376",
    "position": {
      "x": 472,
      "y": 0,
      "z": 376
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_488_376",
    "position": {
      "x": 488,
      "y": 0,
      "z": 376
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_8_392",
    "position": {
      "x": 8,
      "y": 0,
      "z": 392
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_24_392",
    "position": {
      "x": 24,
      "y": 0,
      "z": 392
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_40_392",
    "position": {
      "x": 40,
      "y": 0,
      "z": 392
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_56_392",
    "position": {
      "x": 56,
      "y": 0,
      "z": 392
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_72_392",
    "position": {
      "x": 72,
      "y": 0,
      "z": 392
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_88_392",
    "position": {
      "x": 88,
      "y": 0,
      "z": 392
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_104_392",
    "position": {
      "x": 104,
      "y": 0,
      "z": 392
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_120_392",
    "position": {
      "x": 120,
      "y": 0,
      "z": 392
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_136_392",
    "position": {
      "x": 136,
      "y": 0,
      "z": 392
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_216_392",
    "position": {
      "x": 216,
      "y": 0,
      "z": 392
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.29,
    "width": 6,
    "regionId": 0
  },
  {
    "id": "water_344_392",
    "position": {
      "x": 344,
      "y": 0,
      "z": 392
    },
    "type": "sea",
    "clearance": 8,
    "depth": 2.41,
    "width": 14,
    "regionId": 0
  },
  {
    "id": "water_360_392",
    "position": {
      "x": 360,
      "y": 0,
      "z": 392
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_376_392",
    "position": {
      "x": 376,
      "y": 0,
      "z": 392
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_392_392",
    "position": {
      "x": 392,
      "y": 0,
      "z": 392
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_408_392",
    "position": {
      "x": 408,
      "y": 0,
      "z": 392
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_424_392",
    "position": {
      "x": 424,
      "y": 0,
      "z": 392
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_440_392",
    "position": {
      "x": 440,
      "y": 0,
      "z": 392
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_456_392",
    "position": {
      "x": 456,
      "y": 0,
      "z": 392
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_472_392",
    "position": {
      "x": 472,
      "y": 0,
      "z": 392
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_488_392",
    "position": {
      "x": 488,
      "y": 0,
      "z": 392
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_8_408",
    "position": {
      "x": 8,
      "y": 0,
      "z": 408
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_24_408",
    "position": {
      "x": 24,
      "y": 0,
      "z": 408
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_40_408",
    "position": {
      "x": 40,
      "y": 0,
      "z": 408
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_56_408",
    "position": {
      "x": 56,
      "y": 0,
      "z": 408
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_72_408",
    "position": {
      "x": 72,
      "y": 0,
      "z": 408
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_88_408",
    "position": {
      "x": 88,
      "y": 0,
      "z": 408
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_104_408",
    "position": {
      "x": 104,
      "y": 0,
      "z": 408
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_120_408",
    "position": {
      "x": 120,
      "y": 0,
      "z": 408
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_136_408",
    "position": {
      "x": 136,
      "y": 0,
      "z": 408
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_152_408",
    "position": {
      "x": 152,
      "y": 0,
      "z": 408
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_168_408",
    "position": {
      "x": 168,
      "y": 0,
      "z": 408
    },
    "type": "sea",
    "clearance": 8,
    "depth": 2.69,
    "width": 16,
    "regionId": 0
  },
  {
    "id": "water_184_408",
    "position": {
      "x": 184,
      "y": 0,
      "z": 408
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.29,
    "width": 6,
    "regionId": 0
  },
  {
    "id": "water_200_408",
    "position": {
      "x": 200,
      "y": 0,
      "z": 408
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 22,
    "regionId": 0
  },
  {
    "id": "water_216_408",
    "position": {
      "x": 216,
      "y": 0,
      "z": 408
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 22,
    "regionId": 0
  },
  {
    "id": "water_232_408",
    "position": {
      "x": 232,
      "y": 0,
      "z": 408
    },
    "type": "sea",
    "clearance": 8,
    "depth": 0.73,
    "width": 2,
    "regionId": 0
  },
  {
    "id": "water_248_408",
    "position": {
      "x": 248,
      "y": 0,
      "z": 408
    },
    "type": "sea",
    "clearance": 8,
    "depth": 2.69,
    "width": 16,
    "regionId": 0
  },
  {
    "id": "water_264_408",
    "position": {
      "x": 264,
      "y": 0,
      "z": 408
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.01,
    "width": 4,
    "regionId": 0
  },
  {
    "id": "water_280_408",
    "position": {
      "x": 280,
      "y": 0,
      "z": 408
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.57,
    "width": 8,
    "regionId": 0
  },
  {
    "id": "water_312_408",
    "position": {
      "x": 312,
      "y": 0,
      "z": 408
    },
    "type": "sea",
    "clearance": 8,
    "depth": 1.29,
    "width": 6,
    "regionId": 0
  },
  {
    "id": "water_328_408",
    "position": {
      "x": 328,
      "y": 0,
      "z": 408
    },
    "type": "sea",
    "clearance": 8,
    "depth": 2.97,
    "width": 18,
    "regionId": 0
  },
  {
    "id": "water_344_408",
    "position": {
      "x": 344,
      "y": 0,
      "z": 408
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_360_408",
    "position": {
      "x": 360,
      "y": 0,
      "z": 408
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_376_408",
    "position": {
      "x": 376,
      "y": 0,
      "z": 408
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_392_408",
    "position": {
      "x": 392,
      "y": 0,
      "z": 408
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_408_408",
    "position": {
      "x": 408,
      "y": 0,
      "z": 408
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_424_408",
    "position": {
      "x": 424,
      "y": 0,
      "z": 408
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_440_408",
    "position": {
      "x": 440,
      "y": 0,
      "z": 408
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_456_408",
    "position": {
      "x": 456,
      "y": 0,
      "z": 408
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_472_408",
    "position": {
      "x": 472,
      "y": 0,
      "z": 408
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_488_408",
    "position": {
      "x": 488,
      "y": 0,
      "z": 408
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_8_424",
    "position": {
      "x": 8,
      "y": 0,
      "z": 424
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_24_424",
    "position": {
      "x": 24,
      "y": 0,
      "z": 424
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_40_424",
    "position": {
      "x": 40,
      "y": 0,
      "z": 424
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_56_424",
    "position": {
      "x": 56,
      "y": 0,
      "z": 424
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_72_424",
    "position": {
      "x": 72,
      "y": 0,
      "z": 424
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_88_424",
    "position": {
      "x": 88,
      "y": 0,
      "z": 424
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_104_424",
    "position": {
      "x": 104,
      "y": 0,
      "z": 424
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_120_424",
    "position": {
      "x": 120,
      "y": 0,
      "z": 424
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_136_424",
    "position": {
      "x": 136,
      "y": 0,
      "z": 424
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_152_424",
    "position": {
      "x": 152,
      "y": 0,
      "z": 424
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_168_424",
    "position": {
      "x": 168,
      "y": 0,
      "z": 424
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_184_424",
    "position": {
      "x": 184,
      "y": 0,
      "z": 424
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_200_424",
    "position": {
      "x": 200,
      "y": 0,
      "z": 424
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_216_424",
    "position": {
      "x": 216,
      "y": 0,
      "z": 424
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_232_424",
    "position": {
      "x": 232,
      "y": 0,
      "z": 424
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_248_424",
    "position": {
      "x": 248,
      "y": 0,
      "z": 424
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_264_424",
    "position": {
      "x": 264,
      "y": 0,
      "z": 424
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_280_424",
    "position": {
      "x": 280,
      "y": 0,
      "z": 424
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_296_424",
    "position": {
      "x": 296,
      "y": 0,
      "z": 424
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 30,
    "regionId": 0
  },
  {
    "id": "water_312_424",
    "position": {
      "x": 312,
      "y": 0,
      "z": 424
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_328_424",
    "position": {
      "x": 328,
      "y": 0,
      "z": 424
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_344_424",
    "position": {
      "x": 344,
      "y": 0,
      "z": 424
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_360_424",
    "position": {
      "x": 360,
      "y": 0,
      "z": 424
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_376_424",
    "position": {
      "x": 376,
      "y": 0,
      "z": 424
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_392_424",
    "position": {
      "x": 392,
      "y": 0,
      "z": 424
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_408_424",
    "position": {
      "x": 408,
      "y": 0,
      "z": 424
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_424_424",
    "position": {
      "x": 424,
      "y": 0,
      "z": 424
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_440_424",
    "position": {
      "x": 440,
      "y": 0,
      "z": 424
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_456_424",
    "position": {
      "x": 456,
      "y": 0,
      "z": 424
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_472_424",
    "position": {
      "x": 472,
      "y": 0,
      "z": 424
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_488_424",
    "position": {
      "x": 488,
      "y": 0,
      "z": 424
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_8_440",
    "position": {
      "x": 8,
      "y": 0,
      "z": 440
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_24_440",
    "position": {
      "x": 24,
      "y": 0,
      "z": 440
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_40_440",
    "position": {
      "x": 40,
      "y": 0,
      "z": 440
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_56_440",
    "position": {
      "x": 56,
      "y": 0,
      "z": 440
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_72_440",
    "position": {
      "x": 72,
      "y": 0,
      "z": 440
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_88_440",
    "position": {
      "x": 88,
      "y": 0,
      "z": 440
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_104_440",
    "position": {
      "x": 104,
      "y": 0,
      "z": 440
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_120_440",
    "position": {
      "x": 120,
      "y": 0,
      "z": 440
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_136_440",
    "position": {
      "x": 136,
      "y": 0,
      "z": 440
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_152_440",
    "position": {
      "x": 152,
      "y": 0,
      "z": 440
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_168_440",
    "position": {
      "x": 168,
      "y": 0,
      "z": 440
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_184_440",
    "position": {
      "x": 184,
      "y": 0,
      "z": 440
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_200_440",
    "position": {
      "x": 200,
      "y": 0,
      "z": 440
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_216_440",
    "position": {
      "x": 216,
      "y": 0,
      "z": 440
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_232_440",
    "position": {
      "x": 232,
      "y": 0,
      "z": 440
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_248_440",
    "position": {
      "x": 248,
      "y": 0,
      "z": 440
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_264_440",
    "position": {
      "x": 264,
      "y": 0,
      "z": 440
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_280_440",
    "position": {
      "x": 280,
      "y": 0,
      "z": 440
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_296_440",
    "position": {
      "x": 296,
      "y": 0,
      "z": 440
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_312_440",
    "position": {
      "x": 312,
      "y": 0,
      "z": 440
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_328_440",
    "position": {
      "x": 328,
      "y": 0,
      "z": 440
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_344_440",
    "position": {
      "x": 344,
      "y": 0,
      "z": 440
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_360_440",
    "position": {
      "x": 360,
      "y": 0,
      "z": 440
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_376_440",
    "position": {
      "x": 376,
      "y": 0,
      "z": 440
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_392_440",
    "position": {
      "x": 392,
      "y": 0,
      "z": 440
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_408_440",
    "position": {
      "x": 408,
      "y": 0,
      "z": 440
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_424_440",
    "position": {
      "x": 424,
      "y": 0,
      "z": 440
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_440_440",
    "position": {
      "x": 440,
      "y": 0,
      "z": 440
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_456_440",
    "position": {
      "x": 456,
      "y": 0,
      "z": 440
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_472_440",
    "position": {
      "x": 472,
      "y": 0,
      "z": 440
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_488_440",
    "position": {
      "x": 488,
      "y": 0,
      "z": 440
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_8_456",
    "position": {
      "x": 8,
      "y": 0,
      "z": 456
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_24_456",
    "position": {
      "x": 24,
      "y": 0,
      "z": 456
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_40_456",
    "position": {
      "x": 40,
      "y": 0,
      "z": 456
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_56_456",
    "position": {
      "x": 56,
      "y": 0,
      "z": 456
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_72_456",
    "position": {
      "x": 72,
      "y": 0,
      "z": 456
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_88_456",
    "position": {
      "x": 88,
      "y": 0,
      "z": 456
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_104_456",
    "position": {
      "x": 104,
      "y": 0,
      "z": 456
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_120_456",
    "position": {
      "x": 120,
      "y": 0,
      "z": 456
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_136_456",
    "position": {
      "x": 136,
      "y": 0,
      "z": 456
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_152_456",
    "position": {
      "x": 152,
      "y": 0,
      "z": 456
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_168_456",
    "position": {
      "x": 168,
      "y": 0,
      "z": 456
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_184_456",
    "position": {
      "x": 184,
      "y": 0,
      "z": 456
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_200_456",
    "position": {
      "x": 200,
      "y": 0,
      "z": 456
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_216_456",
    "position": {
      "x": 216,
      "y": 0,
      "z": 456
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_232_456",
    "position": {
      "x": 232,
      "y": 0,
      "z": 456
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_248_456",
    "position": {
      "x": 248,
      "y": 0,
      "z": 456
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_264_456",
    "position": {
      "x": 264,
      "y": 0,
      "z": 456
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_280_456",
    "position": {
      "x": 280,
      "y": 0,
      "z": 456
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_296_456",
    "position": {
      "x": 296,
      "y": 0,
      "z": 456
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_312_456",
    "position": {
      "x": 312,
      "y": 0,
      "z": 456
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_328_456",
    "position": {
      "x": 328,
      "y": 0,
      "z": 456
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_344_456",
    "position": {
      "x": 344,
      "y": 0,
      "z": 456
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_360_456",
    "position": {
      "x": 360,
      "y": 0,
      "z": 456
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_376_456",
    "position": {
      "x": 376,
      "y": 0,
      "z": 456
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_392_456",
    "position": {
      "x": 392,
      "y": 0,
      "z": 456
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_408_456",
    "position": {
      "x": 408,
      "y": 0,
      "z": 456
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_424_456",
    "position": {
      "x": 424,
      "y": 0,
      "z": 456
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_440_456",
    "position": {
      "x": 440,
      "y": 0,
      "z": 456
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_456_456",
    "position": {
      "x": 456,
      "y": 0,
      "z": 456
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_472_456",
    "position": {
      "x": 472,
      "y": 0,
      "z": 456
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_488_456",
    "position": {
      "x": 488,
      "y": 0,
      "z": 456
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_8_472",
    "position": {
      "x": 8,
      "y": 0,
      "z": 472
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_24_472",
    "position": {
      "x": 24,
      "y": 0,
      "z": 472
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_40_472",
    "position": {
      "x": 40,
      "y": 0,
      "z": 472
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_56_472",
    "position": {
      "x": 56,
      "y": 0,
      "z": 472
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_72_472",
    "position": {
      "x": 72,
      "y": 0,
      "z": 472
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_88_472",
    "position": {
      "x": 88,
      "y": 0,
      "z": 472
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_104_472",
    "position": {
      "x": 104,
      "y": 0,
      "z": 472
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_120_472",
    "position": {
      "x": 120,
      "y": 0,
      "z": 472
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_136_472",
    "position": {
      "x": 136,
      "y": 0,
      "z": 472
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_152_472",
    "position": {
      "x": 152,
      "y": 0,
      "z": 472
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_168_472",
    "position": {
      "x": 168,
      "y": 0,
      "z": 472
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_184_472",
    "position": {
      "x": 184,
      "y": 0,
      "z": 472
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_200_472",
    "position": {
      "x": 200,
      "y": 0,
      "z": 472
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_216_472",
    "position": {
      "x": 216,
      "y": 0,
      "z": 472
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_232_472",
    "position": {
      "x": 232,
      "y": 0,
      "z": 472
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_248_472",
    "position": {
      "x": 248,
      "y": 0,
      "z": 472
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_264_472",
    "position": {
      "x": 264,
      "y": 0,
      "z": 472
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_280_472",
    "position": {
      "x": 280,
      "y": 0,
      "z": 472
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_296_472",
    "position": {
      "x": 296,
      "y": 0,
      "z": 472
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_312_472",
    "position": {
      "x": 312,
      "y": 0,
      "z": 472
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_328_472",
    "position": {
      "x": 328,
      "y": 0,
      "z": 472
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_344_472",
    "position": {
      "x": 344,
      "y": 0,
      "z": 472
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_360_472",
    "position": {
      "x": 360,
      "y": 0,
      "z": 472
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_376_472",
    "position": {
      "x": 376,
      "y": 0,
      "z": 472
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_392_472",
    "position": {
      "x": 392,
      "y": 0,
      "z": 472
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_408_472",
    "position": {
      "x": 408,
      "y": 0,
      "z": 472
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_424_472",
    "position": {
      "x": 424,
      "y": 0,
      "z": 472
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_440_472",
    "position": {
      "x": 440,
      "y": 0,
      "z": 472
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_456_472",
    "position": {
      "x": 456,
      "y": 0,
      "z": 472
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_472_472",
    "position": {
      "x": 472,
      "y": 0,
      "z": 472
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_488_472",
    "position": {
      "x": 488,
      "y": 0,
      "z": 472
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_8_488",
    "position": {
      "x": 8,
      "y": 0,
      "z": 488
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_24_488",
    "position": {
      "x": 24,
      "y": 0,
      "z": 488
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_40_488",
    "position": {
      "x": 40,
      "y": 0,
      "z": 488
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_56_488",
    "position": {
      "x": 56,
      "y": 0,
      "z": 488
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_72_488",
    "position": {
      "x": 72,
      "y": 0,
      "z": 488
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_88_488",
    "position": {
      "x": 88,
      "y": 0,
      "z": 488
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_104_488",
    "position": {
      "x": 104,
      "y": 0,
      "z": 488
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_120_488",
    "position": {
      "x": 120,
      "y": 0,
      "z": 488
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_136_488",
    "position": {
      "x": 136,
      "y": 0,
      "z": 488
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_152_488",
    "position": {
      "x": 152,
      "y": 0,
      "z": 488
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_168_488",
    "position": {
      "x": 168,
      "y": 0,
      "z": 488
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_184_488",
    "position": {
      "x": 184,
      "y": 0,
      "z": 488
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_200_488",
    "position": {
      "x": 200,
      "y": 0,
      "z": 488
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_216_488",
    "position": {
      "x": 216,
      "y": 0,
      "z": 488
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_232_488",
    "position": {
      "x": 232,
      "y": 0,
      "z": 488
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_248_488",
    "position": {
      "x": 248,
      "y": 0,
      "z": 488
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_264_488",
    "position": {
      "x": 264,
      "y": 0,
      "z": 488
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_280_488",
    "position": {
      "x": 280,
      "y": 0,
      "z": 488
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_296_488",
    "position": {
      "x": 296,
      "y": 0,
      "z": 488
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_312_488",
    "position": {
      "x": 312,
      "y": 0,
      "z": 488
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_328_488",
    "position": {
      "x": 328,
      "y": 0,
      "z": 488
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_344_488",
    "position": {
      "x": 344,
      "y": 0,
      "z": 488
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_360_488",
    "position": {
      "x": 360,
      "y": 0,
      "z": 488
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_376_488",
    "position": {
      "x": 376,
      "y": 0,
      "z": 488
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_392_488",
    "position": {
      "x": 392,
      "y": 0,
      "z": 488
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_408_488",
    "position": {
      "x": 408,
      "y": 0,
      "z": 488
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_424_488",
    "position": {
      "x": 424,
      "y": 0,
      "z": 488
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_440_488",
    "position": {
      "x": 440,
      "y": 0,
      "z": 488
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_456_488",
    "position": {
      "x": 456,
      "y": 0,
      "z": 488
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_472_488",
    "position": {
      "x": 472,
      "y": 0,
      "z": 488
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "water_488_488",
    "position": {
      "x": 488,
      "y": 0,
      "z": 488
    },
    "type": "sea",
    "clearance": 8,
    "depth": 3,
    "width": 32,
    "regionId": 0
  },
  {
    "id": "harbor_01",
    "position": {
      "x": 217,
      "y": 0,
      "z": 236
    },
    "type": "harbor",
    "clearance": 8,
    "depth": 0.73,
    "width": 5,
    "regionId": 11
  },
  {
    "id": "harbor_02",
    "position": {
      "x": 263,
      "y": 0,
      "z": 118
    },
    "type": "harbor",
    "clearance": 8,
    "depth": 0.73,
    "width": 5,
    "regionId": 10
  },
  {
    "id": "harbor_03",
    "position": {
      "x": 290,
      "y": 0,
      "z": 131
    },
    "type": "harbor",
    "clearance": 8,
    "depth": 0.73,
    "width": 5,
    "regionId": 10
  },
  {
    "id": "harbor_04",
    "position": {
      "x": 317,
      "y": 0,
      "z": 142
    },
    "type": "harbor",
    "clearance": 8,
    "depth": 0.73,
    "width": 5,
    "regionId": 1
  },
  {
    "id": "harbor_05",
    "position": {
      "x": 244,
      "y": 0,
      "z": 145
    },
    "type": "harbor",
    "clearance": 8,
    "depth": 0.73,
    "width": 5,
    "regionId": 10
  },
  {
    "id": "harbor_06",
    "position": {
      "x": 273,
      "y": 0,
      "z": 184
    },
    "type": "harbor",
    "clearance": 8,
    "depth": 0.73,
    "width": 5,
    "regionId": 1
  },
  {
    "id": "harbor_07",
    "position": {
      "x": 373,
      "y": 0,
      "z": 194
    },
    "type": "harbor",
    "clearance": 8,
    "depth": 0.73,
    "width": 5,
    "regionId": 1
  },
  {
    "id": "harbor_08",
    "position": {
      "x": 235,
      "y": 0,
      "z": 200
    },
    "type": "harbor",
    "clearance": 8,
    "depth": 0.73,
    "width": 5,
    "regionId": 11
  },
  {
    "id": "harbor_09",
    "position": {
      "x": 347,
      "y": 0,
      "z": 200
    },
    "type": "harbor",
    "clearance": 8,
    "depth": 0.73,
    "width": 5,
    "regionId": 1
  },
  {
    "id": "harbor_10",
    "position": {
      "x": 381,
      "y": 0,
      "z": 240
    },
    "type": "harbor",
    "clearance": 8,
    "depth": 0.73,
    "width": 5,
    "regionId": 12
  },
  {
    "id": "harbor_11",
    "position": {
      "x": 161,
      "y": 0,
      "z": 242
    },
    "type": "harbor",
    "clearance": 8,
    "depth": 0.73,
    "width": 5,
    "regionId": 9
  },
  {
    "id": "harbor_12",
    "position": {
      "x": 331,
      "y": 0,
      "z": 250
    },
    "type": "harbor",
    "clearance": 8,
    "depth": 0.73,
    "width": 5,
    "regionId": 1
  },
  {
    "id": "harbor_13",
    "position": {
      "x": 249,
      "y": 0,
      "z": 264
    },
    "type": "harbor",
    "clearance": 8,
    "depth": 0.73,
    "width": 5,
    "regionId": 1
  },
  {
    "id": "harbor_14",
    "position": {
      "x": 385,
      "y": 0,
      "z": 266
    },
    "type": "harbor",
    "clearance": 8,
    "depth": 0.73,
    "width": 5,
    "regionId": 4
  },
  {
    "id": "harbor_15",
    "position": {
      "x": 273,
      "y": 0,
      "z": 268
    },
    "type": "harbor",
    "clearance": 8,
    "depth": 0.73,
    "width": 5,
    "regionId": 1
  },
  {
    "id": "harbor_16",
    "position": {
      "x": 179,
      "y": 0,
      "z": 274
    },
    "type": "harbor",
    "clearance": 8,
    "depth": 0.73,
    "width": 5,
    "regionId": 3
  }
];

export const waterRouteEdges: readonly WaterRouteEdge[] = [
  {
    "id": "water_edge_0001",
    "from": "water_8_8",
    "to": "water_24_8",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0002",
    "from": "water_8_8",
    "to": "water_8_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0003",
    "from": "water_8_8",
    "to": "water_24_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0004",
    "from": "water_24_8",
    "to": "water_40_8",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0005",
    "from": "water_24_8",
    "to": "water_24_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0006",
    "from": "water_24_8",
    "to": "water_8_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0007",
    "from": "water_24_8",
    "to": "water_40_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0008",
    "from": "water_40_8",
    "to": "water_56_8",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0009",
    "from": "water_40_8",
    "to": "water_40_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0010",
    "from": "water_40_8",
    "to": "water_24_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0011",
    "from": "water_40_8",
    "to": "water_56_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0012",
    "from": "water_56_8",
    "to": "water_72_8",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0013",
    "from": "water_56_8",
    "to": "water_56_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0014",
    "from": "water_56_8",
    "to": "water_40_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0015",
    "from": "water_56_8",
    "to": "water_72_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0016",
    "from": "water_72_8",
    "to": "water_88_8",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0017",
    "from": "water_72_8",
    "to": "water_72_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0018",
    "from": "water_72_8",
    "to": "water_56_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0019",
    "from": "water_72_8",
    "to": "water_88_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0020",
    "from": "water_88_8",
    "to": "water_104_8",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0021",
    "from": "water_88_8",
    "to": "water_88_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0022",
    "from": "water_88_8",
    "to": "water_72_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0023",
    "from": "water_88_8",
    "to": "water_104_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0024",
    "from": "water_104_8",
    "to": "water_120_8",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0025",
    "from": "water_104_8",
    "to": "water_104_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0026",
    "from": "water_104_8",
    "to": "water_88_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0027",
    "from": "water_104_8",
    "to": "water_120_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0028",
    "from": "water_120_8",
    "to": "water_136_8",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0029",
    "from": "water_120_8",
    "to": "water_120_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0030",
    "from": "water_120_8",
    "to": "water_104_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0031",
    "from": "water_120_8",
    "to": "water_136_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0032",
    "from": "water_136_8",
    "to": "water_152_8",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0033",
    "from": "water_136_8",
    "to": "water_136_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0034",
    "from": "water_136_8",
    "to": "water_120_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0035",
    "from": "water_136_8",
    "to": "water_152_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0036",
    "from": "water_152_8",
    "to": "water_168_8",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0037",
    "from": "water_152_8",
    "to": "water_152_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0038",
    "from": "water_152_8",
    "to": "water_136_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0039",
    "from": "water_152_8",
    "to": "water_168_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0040",
    "from": "water_168_8",
    "to": "water_184_8",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0041",
    "from": "water_168_8",
    "to": "water_168_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0042",
    "from": "water_168_8",
    "to": "water_152_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0043",
    "from": "water_168_8",
    "to": "water_184_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0044",
    "from": "water_184_8",
    "to": "water_200_8",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0045",
    "from": "water_184_8",
    "to": "water_184_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0046",
    "from": "water_184_8",
    "to": "water_168_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0047",
    "from": "water_184_8",
    "to": "water_200_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0048",
    "from": "water_200_8",
    "to": "water_216_8",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0049",
    "from": "water_200_8",
    "to": "water_200_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0050",
    "from": "water_200_8",
    "to": "water_184_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0051",
    "from": "water_200_8",
    "to": "water_216_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0052",
    "from": "water_216_8",
    "to": "water_232_8",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0053",
    "from": "water_216_8",
    "to": "water_216_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0054",
    "from": "water_216_8",
    "to": "water_200_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0055",
    "from": "water_216_8",
    "to": "water_232_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0056",
    "from": "water_232_8",
    "to": "water_248_8",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0057",
    "from": "water_232_8",
    "to": "water_232_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0058",
    "from": "water_232_8",
    "to": "water_216_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0059",
    "from": "water_232_8",
    "to": "water_248_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0060",
    "from": "water_248_8",
    "to": "water_264_8",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0061",
    "from": "water_248_8",
    "to": "water_248_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0062",
    "from": "water_248_8",
    "to": "water_232_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0063",
    "from": "water_248_8",
    "to": "water_264_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0064",
    "from": "water_264_8",
    "to": "water_280_8",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0065",
    "from": "water_264_8",
    "to": "water_264_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0066",
    "from": "water_264_8",
    "to": "water_248_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0067",
    "from": "water_264_8",
    "to": "water_280_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0068",
    "from": "water_280_8",
    "to": "water_296_8",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0069",
    "from": "water_280_8",
    "to": "water_280_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0070",
    "from": "water_280_8",
    "to": "water_264_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0071",
    "from": "water_280_8",
    "to": "water_296_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0072",
    "from": "water_296_8",
    "to": "water_312_8",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0073",
    "from": "water_296_8",
    "to": "water_296_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0074",
    "from": "water_296_8",
    "to": "water_280_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0075",
    "from": "water_296_8",
    "to": "water_312_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0076",
    "from": "water_312_8",
    "to": "water_328_8",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0077",
    "from": "water_312_8",
    "to": "water_312_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0078",
    "from": "water_312_8",
    "to": "water_296_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0079",
    "from": "water_312_8",
    "to": "water_328_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0080",
    "from": "water_328_8",
    "to": "water_344_8",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0081",
    "from": "water_328_8",
    "to": "water_328_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0082",
    "from": "water_328_8",
    "to": "water_312_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0083",
    "from": "water_328_8",
    "to": "water_344_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0084",
    "from": "water_344_8",
    "to": "water_360_8",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0085",
    "from": "water_344_8",
    "to": "water_344_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0086",
    "from": "water_344_8",
    "to": "water_328_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0087",
    "from": "water_344_8",
    "to": "water_360_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0088",
    "from": "water_360_8",
    "to": "water_376_8",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0089",
    "from": "water_360_8",
    "to": "water_360_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0090",
    "from": "water_360_8",
    "to": "water_344_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0091",
    "from": "water_360_8",
    "to": "water_376_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0092",
    "from": "water_376_8",
    "to": "water_392_8",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0093",
    "from": "water_376_8",
    "to": "water_376_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0094",
    "from": "water_376_8",
    "to": "water_360_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0095",
    "from": "water_376_8",
    "to": "water_392_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0096",
    "from": "water_392_8",
    "to": "water_408_8",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0097",
    "from": "water_392_8",
    "to": "water_392_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0098",
    "from": "water_392_8",
    "to": "water_376_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0099",
    "from": "water_392_8",
    "to": "water_408_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0100",
    "from": "water_408_8",
    "to": "water_424_8",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0101",
    "from": "water_408_8",
    "to": "water_408_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0102",
    "from": "water_408_8",
    "to": "water_392_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0103",
    "from": "water_408_8",
    "to": "water_424_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0104",
    "from": "water_424_8",
    "to": "water_440_8",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0105",
    "from": "water_424_8",
    "to": "water_424_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0106",
    "from": "water_424_8",
    "to": "water_408_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0107",
    "from": "water_424_8",
    "to": "water_440_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0108",
    "from": "water_440_8",
    "to": "water_456_8",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0109",
    "from": "water_440_8",
    "to": "water_440_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0110",
    "from": "water_440_8",
    "to": "water_424_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0111",
    "from": "water_440_8",
    "to": "water_456_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0112",
    "from": "water_456_8",
    "to": "water_472_8",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0113",
    "from": "water_456_8",
    "to": "water_456_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0114",
    "from": "water_456_8",
    "to": "water_440_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0115",
    "from": "water_456_8",
    "to": "water_472_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0116",
    "from": "water_472_8",
    "to": "water_488_8",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0117",
    "from": "water_472_8",
    "to": "water_472_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0118",
    "from": "water_472_8",
    "to": "water_456_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0119",
    "from": "water_472_8",
    "to": "water_488_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0120",
    "from": "water_488_8",
    "to": "water_488_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0121",
    "from": "water_488_8",
    "to": "water_472_24",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0122",
    "from": "water_8_24",
    "to": "water_24_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0123",
    "from": "water_8_24",
    "to": "water_8_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0124",
    "from": "water_8_24",
    "to": "water_24_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0125",
    "from": "water_24_24",
    "to": "water_40_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0126",
    "from": "water_24_24",
    "to": "water_24_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0127",
    "from": "water_24_24",
    "to": "water_8_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0128",
    "from": "water_24_24",
    "to": "water_40_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0129",
    "from": "water_40_24",
    "to": "water_56_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0130",
    "from": "water_40_24",
    "to": "water_40_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0131",
    "from": "water_40_24",
    "to": "water_24_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0132",
    "from": "water_40_24",
    "to": "water_56_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0133",
    "from": "water_56_24",
    "to": "water_72_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0134",
    "from": "water_56_24",
    "to": "water_56_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0135",
    "from": "water_56_24",
    "to": "water_40_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0136",
    "from": "water_56_24",
    "to": "water_72_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0137",
    "from": "water_72_24",
    "to": "water_88_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0138",
    "from": "water_72_24",
    "to": "water_72_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0139",
    "from": "water_72_24",
    "to": "water_56_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0140",
    "from": "water_72_24",
    "to": "water_88_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0141",
    "from": "water_88_24",
    "to": "water_104_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0142",
    "from": "water_88_24",
    "to": "water_88_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0143",
    "from": "water_88_24",
    "to": "water_72_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0144",
    "from": "water_88_24",
    "to": "water_104_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0145",
    "from": "water_104_24",
    "to": "water_120_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0146",
    "from": "water_104_24",
    "to": "water_104_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0147",
    "from": "water_104_24",
    "to": "water_88_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0148",
    "from": "water_104_24",
    "to": "water_120_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0149",
    "from": "water_120_24",
    "to": "water_136_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0150",
    "from": "water_120_24",
    "to": "water_120_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0151",
    "from": "water_120_24",
    "to": "water_104_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0152",
    "from": "water_120_24",
    "to": "water_136_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0153",
    "from": "water_136_24",
    "to": "water_152_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0154",
    "from": "water_136_24",
    "to": "water_136_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0155",
    "from": "water_136_24",
    "to": "water_120_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0156",
    "from": "water_136_24",
    "to": "water_152_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0157",
    "from": "water_152_24",
    "to": "water_168_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0158",
    "from": "water_152_24",
    "to": "water_152_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0159",
    "from": "water_152_24",
    "to": "water_136_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0160",
    "from": "water_152_24",
    "to": "water_168_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0161",
    "from": "water_168_24",
    "to": "water_184_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0162",
    "from": "water_168_24",
    "to": "water_168_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0163",
    "from": "water_168_24",
    "to": "water_152_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0164",
    "from": "water_168_24",
    "to": "water_184_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0165",
    "from": "water_184_24",
    "to": "water_200_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0166",
    "from": "water_184_24",
    "to": "water_184_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0167",
    "from": "water_184_24",
    "to": "water_168_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0168",
    "from": "water_184_24",
    "to": "water_200_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0169",
    "from": "water_200_24",
    "to": "water_216_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0170",
    "from": "water_200_24",
    "to": "water_200_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0171",
    "from": "water_200_24",
    "to": "water_184_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0172",
    "from": "water_200_24",
    "to": "water_216_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0173",
    "from": "water_216_24",
    "to": "water_232_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0174",
    "from": "water_216_24",
    "to": "water_216_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0175",
    "from": "water_216_24",
    "to": "water_200_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0176",
    "from": "water_216_24",
    "to": "water_232_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0177",
    "from": "water_232_24",
    "to": "water_248_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0178",
    "from": "water_232_24",
    "to": "water_232_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0179",
    "from": "water_232_24",
    "to": "water_216_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0180",
    "from": "water_232_24",
    "to": "water_248_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0181",
    "from": "water_248_24",
    "to": "water_264_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0182",
    "from": "water_248_24",
    "to": "water_248_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0183",
    "from": "water_248_24",
    "to": "water_232_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0184",
    "from": "water_248_24",
    "to": "water_264_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0185",
    "from": "water_264_24",
    "to": "water_280_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0186",
    "from": "water_264_24",
    "to": "water_264_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0187",
    "from": "water_264_24",
    "to": "water_248_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0188",
    "from": "water_264_24",
    "to": "water_280_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0189",
    "from": "water_280_24",
    "to": "water_296_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0190",
    "from": "water_280_24",
    "to": "water_280_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0191",
    "from": "water_280_24",
    "to": "water_264_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0192",
    "from": "water_280_24",
    "to": "water_296_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0193",
    "from": "water_296_24",
    "to": "water_312_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0194",
    "from": "water_296_24",
    "to": "water_296_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0195",
    "from": "water_296_24",
    "to": "water_280_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0196",
    "from": "water_296_24",
    "to": "water_312_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0197",
    "from": "water_312_24",
    "to": "water_328_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0198",
    "from": "water_312_24",
    "to": "water_312_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0199",
    "from": "water_312_24",
    "to": "water_296_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0200",
    "from": "water_312_24",
    "to": "water_328_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0201",
    "from": "water_328_24",
    "to": "water_344_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0202",
    "from": "water_328_24",
    "to": "water_328_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0203",
    "from": "water_328_24",
    "to": "water_312_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0204",
    "from": "water_328_24",
    "to": "water_344_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0205",
    "from": "water_344_24",
    "to": "water_360_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0206",
    "from": "water_344_24",
    "to": "water_344_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0207",
    "from": "water_344_24",
    "to": "water_328_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0208",
    "from": "water_344_24",
    "to": "water_360_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0209",
    "from": "water_360_24",
    "to": "water_376_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0210",
    "from": "water_360_24",
    "to": "water_360_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0211",
    "from": "water_360_24",
    "to": "water_344_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0212",
    "from": "water_360_24",
    "to": "water_376_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0213",
    "from": "water_376_24",
    "to": "water_392_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0214",
    "from": "water_376_24",
    "to": "water_376_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0215",
    "from": "water_376_24",
    "to": "water_360_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0216",
    "from": "water_376_24",
    "to": "water_392_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0217",
    "from": "water_392_24",
    "to": "water_408_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0218",
    "from": "water_392_24",
    "to": "water_392_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0219",
    "from": "water_392_24",
    "to": "water_376_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0220",
    "from": "water_392_24",
    "to": "water_408_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0221",
    "from": "water_408_24",
    "to": "water_424_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0222",
    "from": "water_408_24",
    "to": "water_408_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0223",
    "from": "water_408_24",
    "to": "water_392_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0224",
    "from": "water_408_24",
    "to": "water_424_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0225",
    "from": "water_424_24",
    "to": "water_440_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0226",
    "from": "water_424_24",
    "to": "water_424_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0227",
    "from": "water_424_24",
    "to": "water_408_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0228",
    "from": "water_424_24",
    "to": "water_440_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0229",
    "from": "water_440_24",
    "to": "water_456_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0230",
    "from": "water_440_24",
    "to": "water_440_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0231",
    "from": "water_440_24",
    "to": "water_424_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0232",
    "from": "water_440_24",
    "to": "water_456_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0233",
    "from": "water_456_24",
    "to": "water_472_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0234",
    "from": "water_456_24",
    "to": "water_456_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0235",
    "from": "water_456_24",
    "to": "water_440_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0236",
    "from": "water_456_24",
    "to": "water_472_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0237",
    "from": "water_472_24",
    "to": "water_488_24",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0238",
    "from": "water_472_24",
    "to": "water_472_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0239",
    "from": "water_472_24",
    "to": "water_456_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0240",
    "from": "water_472_24",
    "to": "water_488_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0241",
    "from": "water_488_24",
    "to": "water_488_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0242",
    "from": "water_488_24",
    "to": "water_472_40",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0243",
    "from": "water_8_40",
    "to": "water_24_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0244",
    "from": "water_8_40",
    "to": "water_8_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0245",
    "from": "water_8_40",
    "to": "water_24_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0246",
    "from": "water_24_40",
    "to": "water_40_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0247",
    "from": "water_24_40",
    "to": "water_24_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0248",
    "from": "water_24_40",
    "to": "water_8_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0249",
    "from": "water_24_40",
    "to": "water_40_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0250",
    "from": "water_40_40",
    "to": "water_56_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0251",
    "from": "water_40_40",
    "to": "water_40_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0252",
    "from": "water_40_40",
    "to": "water_24_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0253",
    "from": "water_40_40",
    "to": "water_56_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0254",
    "from": "water_56_40",
    "to": "water_72_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0255",
    "from": "water_56_40",
    "to": "water_56_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0256",
    "from": "water_56_40",
    "to": "water_40_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0257",
    "from": "water_56_40",
    "to": "water_72_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0258",
    "from": "water_72_40",
    "to": "water_88_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0259",
    "from": "water_72_40",
    "to": "water_72_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0260",
    "from": "water_72_40",
    "to": "water_56_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0261",
    "from": "water_72_40",
    "to": "water_88_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0262",
    "from": "water_88_40",
    "to": "water_104_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0263",
    "from": "water_88_40",
    "to": "water_88_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0264",
    "from": "water_88_40",
    "to": "water_72_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0265",
    "from": "water_88_40",
    "to": "water_104_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0266",
    "from": "water_104_40",
    "to": "water_120_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0267",
    "from": "water_104_40",
    "to": "water_104_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0268",
    "from": "water_104_40",
    "to": "water_88_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0269",
    "from": "water_104_40",
    "to": "water_120_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0270",
    "from": "water_120_40",
    "to": "water_136_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0271",
    "from": "water_120_40",
    "to": "water_120_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0272",
    "from": "water_120_40",
    "to": "water_104_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0273",
    "from": "water_120_40",
    "to": "water_136_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0274",
    "from": "water_136_40",
    "to": "water_152_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0275",
    "from": "water_136_40",
    "to": "water_136_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0276",
    "from": "water_136_40",
    "to": "water_120_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0277",
    "from": "water_136_40",
    "to": "water_152_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0278",
    "from": "water_152_40",
    "to": "water_168_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0279",
    "from": "water_152_40",
    "to": "water_152_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0280",
    "from": "water_152_40",
    "to": "water_136_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0281",
    "from": "water_152_40",
    "to": "water_168_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0282",
    "from": "water_168_40",
    "to": "water_184_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0283",
    "from": "water_168_40",
    "to": "water_168_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0284",
    "from": "water_168_40",
    "to": "water_152_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0285",
    "from": "water_168_40",
    "to": "water_184_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0286",
    "from": "water_184_40",
    "to": "water_200_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0287",
    "from": "water_184_40",
    "to": "water_184_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0288",
    "from": "water_184_40",
    "to": "water_168_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0289",
    "from": "water_184_40",
    "to": "water_200_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0290",
    "from": "water_200_40",
    "to": "water_216_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0291",
    "from": "water_200_40",
    "to": "water_200_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0292",
    "from": "water_200_40",
    "to": "water_184_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0293",
    "from": "water_200_40",
    "to": "water_216_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0294",
    "from": "water_216_40",
    "to": "water_232_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0295",
    "from": "water_216_40",
    "to": "water_216_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0296",
    "from": "water_216_40",
    "to": "water_200_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0297",
    "from": "water_216_40",
    "to": "water_232_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0298",
    "from": "water_232_40",
    "to": "water_248_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0299",
    "from": "water_232_40",
    "to": "water_232_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0300",
    "from": "water_232_40",
    "to": "water_216_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0301",
    "from": "water_232_40",
    "to": "water_248_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0302",
    "from": "water_248_40",
    "to": "water_264_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0303",
    "from": "water_248_40",
    "to": "water_248_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0304",
    "from": "water_248_40",
    "to": "water_232_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0305",
    "from": "water_248_40",
    "to": "water_264_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0306",
    "from": "water_264_40",
    "to": "water_280_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0307",
    "from": "water_264_40",
    "to": "water_264_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0308",
    "from": "water_264_40",
    "to": "water_248_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0309",
    "from": "water_264_40",
    "to": "water_280_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0310",
    "from": "water_280_40",
    "to": "water_296_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0311",
    "from": "water_280_40",
    "to": "water_280_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0312",
    "from": "water_280_40",
    "to": "water_264_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0313",
    "from": "water_280_40",
    "to": "water_296_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0314",
    "from": "water_296_40",
    "to": "water_312_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0315",
    "from": "water_296_40",
    "to": "water_296_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0316",
    "from": "water_296_40",
    "to": "water_280_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0317",
    "from": "water_296_40",
    "to": "water_312_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0318",
    "from": "water_312_40",
    "to": "water_328_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0319",
    "from": "water_312_40",
    "to": "water_312_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0320",
    "from": "water_312_40",
    "to": "water_296_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0321",
    "from": "water_312_40",
    "to": "water_328_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0322",
    "from": "water_328_40",
    "to": "water_344_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0323",
    "from": "water_328_40",
    "to": "water_328_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0324",
    "from": "water_328_40",
    "to": "water_312_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0325",
    "from": "water_328_40",
    "to": "water_344_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0326",
    "from": "water_344_40",
    "to": "water_360_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0327",
    "from": "water_344_40",
    "to": "water_344_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0328",
    "from": "water_344_40",
    "to": "water_328_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0329",
    "from": "water_344_40",
    "to": "water_360_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0330",
    "from": "water_360_40",
    "to": "water_376_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0331",
    "from": "water_360_40",
    "to": "water_360_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0332",
    "from": "water_360_40",
    "to": "water_344_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0333",
    "from": "water_360_40",
    "to": "water_376_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0334",
    "from": "water_376_40",
    "to": "water_392_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0335",
    "from": "water_376_40",
    "to": "water_376_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0336",
    "from": "water_376_40",
    "to": "water_360_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0337",
    "from": "water_376_40",
    "to": "water_392_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0338",
    "from": "water_392_40",
    "to": "water_408_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0339",
    "from": "water_392_40",
    "to": "water_392_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0340",
    "from": "water_392_40",
    "to": "water_376_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0341",
    "from": "water_392_40",
    "to": "water_408_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0342",
    "from": "water_408_40",
    "to": "water_424_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0343",
    "from": "water_408_40",
    "to": "water_408_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0344",
    "from": "water_408_40",
    "to": "water_392_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0345",
    "from": "water_408_40",
    "to": "water_424_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0346",
    "from": "water_424_40",
    "to": "water_440_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0347",
    "from": "water_424_40",
    "to": "water_424_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0348",
    "from": "water_424_40",
    "to": "water_408_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0349",
    "from": "water_424_40",
    "to": "water_440_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0350",
    "from": "water_440_40",
    "to": "water_456_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0351",
    "from": "water_440_40",
    "to": "water_440_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0352",
    "from": "water_440_40",
    "to": "water_424_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0353",
    "from": "water_440_40",
    "to": "water_456_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0354",
    "from": "water_456_40",
    "to": "water_472_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0355",
    "from": "water_456_40",
    "to": "water_456_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0356",
    "from": "water_456_40",
    "to": "water_440_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0357",
    "from": "water_456_40",
    "to": "water_472_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0358",
    "from": "water_472_40",
    "to": "water_488_40",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0359",
    "from": "water_472_40",
    "to": "water_472_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0360",
    "from": "water_472_40",
    "to": "water_456_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0361",
    "from": "water_472_40",
    "to": "water_488_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0362",
    "from": "water_488_40",
    "to": "water_488_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0363",
    "from": "water_488_40",
    "to": "water_472_56",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0364",
    "from": "water_8_56",
    "to": "water_24_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0365",
    "from": "water_8_56",
    "to": "water_8_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0366",
    "from": "water_8_56",
    "to": "water_24_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0367",
    "from": "water_24_56",
    "to": "water_40_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0368",
    "from": "water_24_56",
    "to": "water_24_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0369",
    "from": "water_24_56",
    "to": "water_8_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0370",
    "from": "water_24_56",
    "to": "water_40_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0371",
    "from": "water_40_56",
    "to": "water_56_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0372",
    "from": "water_40_56",
    "to": "water_40_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0373",
    "from": "water_40_56",
    "to": "water_24_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0374",
    "from": "water_40_56",
    "to": "water_56_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0375",
    "from": "water_56_56",
    "to": "water_72_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0376",
    "from": "water_56_56",
    "to": "water_56_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0377",
    "from": "water_56_56",
    "to": "water_40_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0378",
    "from": "water_56_56",
    "to": "water_72_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0379",
    "from": "water_72_56",
    "to": "water_88_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0380",
    "from": "water_72_56",
    "to": "water_72_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0381",
    "from": "water_72_56",
    "to": "water_56_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0382",
    "from": "water_72_56",
    "to": "water_88_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0383",
    "from": "water_88_56",
    "to": "water_104_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0384",
    "from": "water_88_56",
    "to": "water_88_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0385",
    "from": "water_88_56",
    "to": "water_72_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0386",
    "from": "water_88_56",
    "to": "water_104_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0387",
    "from": "water_104_56",
    "to": "water_120_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0388",
    "from": "water_104_56",
    "to": "water_104_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0389",
    "from": "water_104_56",
    "to": "water_88_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0390",
    "from": "water_104_56",
    "to": "water_120_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0391",
    "from": "water_120_56",
    "to": "water_136_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0392",
    "from": "water_120_56",
    "to": "water_120_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0393",
    "from": "water_120_56",
    "to": "water_104_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0394",
    "from": "water_120_56",
    "to": "water_136_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0395",
    "from": "water_136_56",
    "to": "water_152_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0396",
    "from": "water_136_56",
    "to": "water_136_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0397",
    "from": "water_136_56",
    "to": "water_120_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0398",
    "from": "water_136_56",
    "to": "water_152_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0399",
    "from": "water_152_56",
    "to": "water_168_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0400",
    "from": "water_152_56",
    "to": "water_152_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0401",
    "from": "water_152_56",
    "to": "water_136_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0402",
    "from": "water_152_56",
    "to": "water_168_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0403",
    "from": "water_168_56",
    "to": "water_184_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0404",
    "from": "water_168_56",
    "to": "water_168_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0405",
    "from": "water_168_56",
    "to": "water_152_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0406",
    "from": "water_168_56",
    "to": "water_184_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0407",
    "from": "water_184_56",
    "to": "water_200_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0408",
    "from": "water_184_56",
    "to": "water_184_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0409",
    "from": "water_184_56",
    "to": "water_168_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0410",
    "from": "water_184_56",
    "to": "water_200_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0411",
    "from": "water_200_56",
    "to": "water_216_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0412",
    "from": "water_200_56",
    "to": "water_200_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0413",
    "from": "water_200_56",
    "to": "water_184_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0414",
    "from": "water_200_56",
    "to": "water_216_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0415",
    "from": "water_216_56",
    "to": "water_232_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0416",
    "from": "water_216_56",
    "to": "water_216_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0417",
    "from": "water_216_56",
    "to": "water_200_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0418",
    "from": "water_216_56",
    "to": "water_232_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0419",
    "from": "water_232_56",
    "to": "water_248_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0420",
    "from": "water_232_56",
    "to": "water_232_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0421",
    "from": "water_232_56",
    "to": "water_216_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0422",
    "from": "water_232_56",
    "to": "water_248_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0423",
    "from": "water_248_56",
    "to": "water_264_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0424",
    "from": "water_248_56",
    "to": "water_248_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0425",
    "from": "water_248_56",
    "to": "water_232_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0426",
    "from": "water_248_56",
    "to": "water_264_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0427",
    "from": "water_264_56",
    "to": "water_280_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0428",
    "from": "water_264_56",
    "to": "water_264_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0429",
    "from": "water_264_56",
    "to": "water_248_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0430",
    "from": "water_264_56",
    "to": "water_280_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0431",
    "from": "water_280_56",
    "to": "water_296_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0432",
    "from": "water_280_56",
    "to": "water_280_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0433",
    "from": "water_280_56",
    "to": "water_264_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0434",
    "from": "water_280_56",
    "to": "water_296_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0435",
    "from": "water_296_56",
    "to": "water_312_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0436",
    "from": "water_296_56",
    "to": "water_296_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0437",
    "from": "water_296_56",
    "to": "water_280_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0438",
    "from": "water_296_56",
    "to": "water_312_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0439",
    "from": "water_312_56",
    "to": "water_328_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0440",
    "from": "water_312_56",
    "to": "water_312_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0441",
    "from": "water_312_56",
    "to": "water_296_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0442",
    "from": "water_312_56",
    "to": "water_328_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0443",
    "from": "water_328_56",
    "to": "water_344_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0444",
    "from": "water_328_56",
    "to": "water_328_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0445",
    "from": "water_328_56",
    "to": "water_312_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0446",
    "from": "water_328_56",
    "to": "water_344_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0447",
    "from": "water_344_56",
    "to": "water_360_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0448",
    "from": "water_344_56",
    "to": "water_344_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0449",
    "from": "water_344_56",
    "to": "water_328_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0450",
    "from": "water_344_56",
    "to": "water_360_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0451",
    "from": "water_360_56",
    "to": "water_376_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0452",
    "from": "water_360_56",
    "to": "water_360_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0453",
    "from": "water_360_56",
    "to": "water_344_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0454",
    "from": "water_360_56",
    "to": "water_376_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0455",
    "from": "water_376_56",
    "to": "water_392_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0456",
    "from": "water_376_56",
    "to": "water_376_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0457",
    "from": "water_376_56",
    "to": "water_360_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0458",
    "from": "water_376_56",
    "to": "water_392_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0459",
    "from": "water_392_56",
    "to": "water_408_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0460",
    "from": "water_392_56",
    "to": "water_392_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0461",
    "from": "water_392_56",
    "to": "water_376_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0462",
    "from": "water_392_56",
    "to": "water_408_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0463",
    "from": "water_408_56",
    "to": "water_424_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0464",
    "from": "water_408_56",
    "to": "water_408_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0465",
    "from": "water_408_56",
    "to": "water_392_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0466",
    "from": "water_408_56",
    "to": "water_424_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0467",
    "from": "water_424_56",
    "to": "water_440_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0468",
    "from": "water_424_56",
    "to": "water_424_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0469",
    "from": "water_424_56",
    "to": "water_408_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0470",
    "from": "water_424_56",
    "to": "water_440_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0471",
    "from": "water_440_56",
    "to": "water_456_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0472",
    "from": "water_440_56",
    "to": "water_440_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0473",
    "from": "water_440_56",
    "to": "water_424_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0474",
    "from": "water_440_56",
    "to": "water_456_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0475",
    "from": "water_456_56",
    "to": "water_472_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0476",
    "from": "water_456_56",
    "to": "water_456_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0477",
    "from": "water_456_56",
    "to": "water_440_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0478",
    "from": "water_456_56",
    "to": "water_472_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0479",
    "from": "water_472_56",
    "to": "water_488_56",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0480",
    "from": "water_472_56",
    "to": "water_472_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0481",
    "from": "water_472_56",
    "to": "water_456_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0482",
    "from": "water_472_56",
    "to": "water_488_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0483",
    "from": "water_488_56",
    "to": "water_488_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0484",
    "from": "water_488_56",
    "to": "water_472_72",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0485",
    "from": "water_8_72",
    "to": "water_24_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0486",
    "from": "water_8_72",
    "to": "water_8_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0487",
    "from": "water_8_72",
    "to": "water_24_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0488",
    "from": "water_24_72",
    "to": "water_40_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0489",
    "from": "water_24_72",
    "to": "water_24_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0490",
    "from": "water_24_72",
    "to": "water_8_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0491",
    "from": "water_24_72",
    "to": "water_40_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0492",
    "from": "water_40_72",
    "to": "water_56_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0493",
    "from": "water_40_72",
    "to": "water_40_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0494",
    "from": "water_40_72",
    "to": "water_24_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0495",
    "from": "water_40_72",
    "to": "water_56_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0496",
    "from": "water_56_72",
    "to": "water_72_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0497",
    "from": "water_56_72",
    "to": "water_56_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0498",
    "from": "water_56_72",
    "to": "water_40_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0499",
    "from": "water_56_72",
    "to": "water_72_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0500",
    "from": "water_72_72",
    "to": "water_88_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0501",
    "from": "water_72_72",
    "to": "water_72_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0502",
    "from": "water_72_72",
    "to": "water_56_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0503",
    "from": "water_72_72",
    "to": "water_88_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0504",
    "from": "water_88_72",
    "to": "water_104_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0505",
    "from": "water_88_72",
    "to": "water_88_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0506",
    "from": "water_88_72",
    "to": "water_72_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0507",
    "from": "water_88_72",
    "to": "water_104_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0508",
    "from": "water_104_72",
    "to": "water_120_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0509",
    "from": "water_104_72",
    "to": "water_104_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0510",
    "from": "water_104_72",
    "to": "water_88_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0511",
    "from": "water_104_72",
    "to": "water_120_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0512",
    "from": "water_120_72",
    "to": "water_136_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0513",
    "from": "water_120_72",
    "to": "water_120_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0514",
    "from": "water_120_72",
    "to": "water_104_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0515",
    "from": "water_120_72",
    "to": "water_136_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0516",
    "from": "water_136_72",
    "to": "water_152_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0517",
    "from": "water_136_72",
    "to": "water_136_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0518",
    "from": "water_136_72",
    "to": "water_120_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0519",
    "from": "water_136_72",
    "to": "water_152_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0520",
    "from": "water_152_72",
    "to": "water_168_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0521",
    "from": "water_152_72",
    "to": "water_152_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0522",
    "from": "water_152_72",
    "to": "water_136_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0523",
    "from": "water_152_72",
    "to": "water_168_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0524",
    "from": "water_168_72",
    "to": "water_184_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0525",
    "from": "water_168_72",
    "to": "water_168_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0526",
    "from": "water_168_72",
    "to": "water_152_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0527",
    "from": "water_168_72",
    "to": "water_184_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0528",
    "from": "water_184_72",
    "to": "water_200_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0529",
    "from": "water_184_72",
    "to": "water_184_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0530",
    "from": "water_184_72",
    "to": "water_168_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0531",
    "from": "water_184_72",
    "to": "water_200_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0532",
    "from": "water_200_72",
    "to": "water_216_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0533",
    "from": "water_200_72",
    "to": "water_200_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0534",
    "from": "water_200_72",
    "to": "water_184_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0535",
    "from": "water_200_72",
    "to": "water_216_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0536",
    "from": "water_216_72",
    "to": "water_232_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0537",
    "from": "water_216_72",
    "to": "water_216_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0538",
    "from": "water_216_72",
    "to": "water_200_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0539",
    "from": "water_216_72",
    "to": "water_232_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0540",
    "from": "water_232_72",
    "to": "water_248_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0541",
    "from": "water_232_72",
    "to": "water_232_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0542",
    "from": "water_232_72",
    "to": "water_216_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0543",
    "from": "water_232_72",
    "to": "water_248_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0544",
    "from": "water_248_72",
    "to": "water_264_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0545",
    "from": "water_248_72",
    "to": "water_248_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0546",
    "from": "water_248_72",
    "to": "water_232_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0547",
    "from": "water_248_72",
    "to": "water_264_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0548",
    "from": "water_264_72",
    "to": "water_280_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0549",
    "from": "water_264_72",
    "to": "water_264_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0550",
    "from": "water_264_72",
    "to": "water_248_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0551",
    "from": "water_264_72",
    "to": "water_280_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0552",
    "from": "water_280_72",
    "to": "water_296_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0553",
    "from": "water_280_72",
    "to": "water_280_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0554",
    "from": "water_280_72",
    "to": "water_264_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0555",
    "from": "water_280_72",
    "to": "water_296_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0556",
    "from": "water_296_72",
    "to": "water_312_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0557",
    "from": "water_296_72",
    "to": "water_296_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0558",
    "from": "water_296_72",
    "to": "water_280_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0559",
    "from": "water_296_72",
    "to": "water_312_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0560",
    "from": "water_312_72",
    "to": "water_328_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0561",
    "from": "water_312_72",
    "to": "water_312_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0562",
    "from": "water_312_72",
    "to": "water_296_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0563",
    "from": "water_312_72",
    "to": "water_328_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0564",
    "from": "water_328_72",
    "to": "water_344_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0565",
    "from": "water_328_72",
    "to": "water_328_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0566",
    "from": "water_328_72",
    "to": "water_312_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0567",
    "from": "water_328_72",
    "to": "water_344_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0568",
    "from": "water_344_72",
    "to": "water_360_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0569",
    "from": "water_344_72",
    "to": "water_344_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0570",
    "from": "water_344_72",
    "to": "water_328_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0571",
    "from": "water_344_72",
    "to": "water_360_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0572",
    "from": "water_360_72",
    "to": "water_376_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0573",
    "from": "water_360_72",
    "to": "water_360_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0574",
    "from": "water_360_72",
    "to": "water_344_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0575",
    "from": "water_360_72",
    "to": "water_376_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0576",
    "from": "water_376_72",
    "to": "water_392_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0577",
    "from": "water_376_72",
    "to": "water_376_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0578",
    "from": "water_376_72",
    "to": "water_360_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0579",
    "from": "water_376_72",
    "to": "water_392_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0580",
    "from": "water_392_72",
    "to": "water_408_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0581",
    "from": "water_392_72",
    "to": "water_392_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0582",
    "from": "water_392_72",
    "to": "water_376_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0583",
    "from": "water_392_72",
    "to": "water_408_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0584",
    "from": "water_408_72",
    "to": "water_424_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0585",
    "from": "water_408_72",
    "to": "water_408_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0586",
    "from": "water_408_72",
    "to": "water_392_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0587",
    "from": "water_408_72",
    "to": "water_424_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0588",
    "from": "water_424_72",
    "to": "water_440_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0589",
    "from": "water_424_72",
    "to": "water_424_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0590",
    "from": "water_424_72",
    "to": "water_408_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0591",
    "from": "water_424_72",
    "to": "water_440_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0592",
    "from": "water_440_72",
    "to": "water_456_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0593",
    "from": "water_440_72",
    "to": "water_440_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0594",
    "from": "water_440_72",
    "to": "water_424_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0595",
    "from": "water_440_72",
    "to": "water_456_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0596",
    "from": "water_456_72",
    "to": "water_472_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0597",
    "from": "water_456_72",
    "to": "water_456_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0598",
    "from": "water_456_72",
    "to": "water_440_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0599",
    "from": "water_456_72",
    "to": "water_472_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0600",
    "from": "water_472_72",
    "to": "water_488_72",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0601",
    "from": "water_472_72",
    "to": "water_472_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0602",
    "from": "water_472_72",
    "to": "water_456_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0603",
    "from": "water_472_72",
    "to": "water_488_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0604",
    "from": "water_488_72",
    "to": "water_488_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0605",
    "from": "water_488_72",
    "to": "water_472_88",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0606",
    "from": "water_8_88",
    "to": "water_24_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0607",
    "from": "water_8_88",
    "to": "water_8_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0608",
    "from": "water_8_88",
    "to": "water_24_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0609",
    "from": "water_24_88",
    "to": "water_40_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0610",
    "from": "water_24_88",
    "to": "water_24_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0611",
    "from": "water_24_88",
    "to": "water_8_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0612",
    "from": "water_24_88",
    "to": "water_40_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0613",
    "from": "water_40_88",
    "to": "water_56_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0614",
    "from": "water_40_88",
    "to": "water_40_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0615",
    "from": "water_40_88",
    "to": "water_24_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0616",
    "from": "water_40_88",
    "to": "water_56_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0617",
    "from": "water_56_88",
    "to": "water_72_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0618",
    "from": "water_56_88",
    "to": "water_56_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0619",
    "from": "water_56_88",
    "to": "water_40_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0620",
    "from": "water_56_88",
    "to": "water_72_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0621",
    "from": "water_72_88",
    "to": "water_88_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0622",
    "from": "water_72_88",
    "to": "water_72_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0623",
    "from": "water_72_88",
    "to": "water_56_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0624",
    "from": "water_72_88",
    "to": "water_88_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0625",
    "from": "water_88_88",
    "to": "water_104_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0626",
    "from": "water_88_88",
    "to": "water_88_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0627",
    "from": "water_88_88",
    "to": "water_72_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0628",
    "from": "water_88_88",
    "to": "water_104_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0629",
    "from": "water_104_88",
    "to": "water_120_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0630",
    "from": "water_104_88",
    "to": "water_104_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0631",
    "from": "water_104_88",
    "to": "water_88_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0632",
    "from": "water_104_88",
    "to": "water_120_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0633",
    "from": "water_120_88",
    "to": "water_136_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0634",
    "from": "water_120_88",
    "to": "water_120_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0635",
    "from": "water_120_88",
    "to": "water_104_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0636",
    "from": "water_120_88",
    "to": "water_136_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0637",
    "from": "water_136_88",
    "to": "water_152_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0638",
    "from": "water_136_88",
    "to": "water_136_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0639",
    "from": "water_136_88",
    "to": "water_120_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0640",
    "from": "water_136_88",
    "to": "water_152_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0641",
    "from": "water_152_88",
    "to": "water_168_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0642",
    "from": "water_152_88",
    "to": "water_152_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0643",
    "from": "water_152_88",
    "to": "water_136_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0644",
    "from": "water_152_88",
    "to": "water_168_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0645",
    "from": "water_168_88",
    "to": "water_184_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0646",
    "from": "water_168_88",
    "to": "water_168_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0647",
    "from": "water_168_88",
    "to": "water_152_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0648",
    "from": "water_168_88",
    "to": "water_184_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0649",
    "from": "water_184_88",
    "to": "water_200_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0650",
    "from": "water_184_88",
    "to": "water_184_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0651",
    "from": "water_184_88",
    "to": "water_168_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0652",
    "from": "water_184_88",
    "to": "water_200_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0653",
    "from": "water_200_88",
    "to": "water_216_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0654",
    "from": "water_200_88",
    "to": "water_200_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0655",
    "from": "water_200_88",
    "to": "water_184_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0656",
    "from": "water_200_88",
    "to": "water_216_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0657",
    "from": "water_216_88",
    "to": "water_232_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0658",
    "from": "water_216_88",
    "to": "water_216_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0659",
    "from": "water_216_88",
    "to": "water_200_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0660",
    "from": "water_216_88",
    "to": "water_232_104",
    "length": 22.63,
    "minDepth": 1.29,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0661",
    "from": "water_232_88",
    "to": "water_248_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0662",
    "from": "water_232_88",
    "to": "water_232_104",
    "length": 16,
    "minDepth": 1.29,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0663",
    "from": "water_232_88",
    "to": "water_216_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0664",
    "from": "water_232_88",
    "to": "water_248_104",
    "length": 22.63,
    "minDepth": 1.01,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0665",
    "from": "water_248_88",
    "to": "water_264_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0666",
    "from": "water_248_88",
    "to": "water_248_104",
    "length": 16,
    "minDepth": 1.01,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0667",
    "from": "water_248_88",
    "to": "water_232_104",
    "length": 22.63,
    "minDepth": 1.29,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0668",
    "from": "water_248_88",
    "to": "harbor_02",
    "length": 33.54,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "harbor_link"
  },
  {
    "id": "water_edge_0669",
    "from": "water_264_88",
    "to": "water_280_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0670",
    "from": "water_264_88",
    "to": "water_248_104",
    "length": 22.63,
    "minDepth": 1.01,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0671",
    "from": "water_280_88",
    "to": "water_296_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0672",
    "from": "water_280_88",
    "to": "water_296_104",
    "length": 22.63,
    "minDepth": 2.69,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0673",
    "from": "water_296_88",
    "to": "water_312_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0674",
    "from": "water_296_88",
    "to": "water_296_104",
    "length": 16,
    "minDepth": 2.69,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0675",
    "from": "water_296_88",
    "to": "water_312_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0676",
    "from": "water_312_88",
    "to": "water_328_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0677",
    "from": "water_312_88",
    "to": "water_312_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0678",
    "from": "water_312_88",
    "to": "water_296_104",
    "length": 22.63,
    "minDepth": 2.69,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0679",
    "from": "water_312_88",
    "to": "water_328_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0680",
    "from": "water_328_88",
    "to": "water_344_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0681",
    "from": "water_328_88",
    "to": "water_328_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0682",
    "from": "water_328_88",
    "to": "water_312_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0683",
    "from": "water_328_88",
    "to": "water_344_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0684",
    "from": "water_344_88",
    "to": "water_360_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0685",
    "from": "water_344_88",
    "to": "water_344_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0686",
    "from": "water_344_88",
    "to": "water_328_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0687",
    "from": "water_344_88",
    "to": "water_360_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0688",
    "from": "water_360_88",
    "to": "water_376_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0689",
    "from": "water_360_88",
    "to": "water_360_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0690",
    "from": "water_360_88",
    "to": "water_344_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0691",
    "from": "water_360_88",
    "to": "water_376_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0692",
    "from": "water_376_88",
    "to": "water_392_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0693",
    "from": "water_376_88",
    "to": "water_376_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0694",
    "from": "water_376_88",
    "to": "water_360_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0695",
    "from": "water_376_88",
    "to": "water_392_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0696",
    "from": "water_392_88",
    "to": "water_408_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0697",
    "from": "water_392_88",
    "to": "water_392_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0698",
    "from": "water_392_88",
    "to": "water_376_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0699",
    "from": "water_392_88",
    "to": "water_408_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0700",
    "from": "water_408_88",
    "to": "water_424_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0701",
    "from": "water_408_88",
    "to": "water_408_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0702",
    "from": "water_408_88",
    "to": "water_392_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0703",
    "from": "water_408_88",
    "to": "water_424_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0704",
    "from": "water_424_88",
    "to": "water_440_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0705",
    "from": "water_424_88",
    "to": "water_424_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0706",
    "from": "water_424_88",
    "to": "water_408_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0707",
    "from": "water_424_88",
    "to": "water_440_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0708",
    "from": "water_440_88",
    "to": "water_456_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0709",
    "from": "water_440_88",
    "to": "water_440_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0710",
    "from": "water_440_88",
    "to": "water_424_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0711",
    "from": "water_440_88",
    "to": "water_456_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0712",
    "from": "water_456_88",
    "to": "water_472_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0713",
    "from": "water_456_88",
    "to": "water_456_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0714",
    "from": "water_456_88",
    "to": "water_440_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0715",
    "from": "water_456_88",
    "to": "water_472_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0716",
    "from": "water_472_88",
    "to": "water_488_88",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0717",
    "from": "water_472_88",
    "to": "water_472_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0718",
    "from": "water_472_88",
    "to": "water_456_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0719",
    "from": "water_472_88",
    "to": "water_488_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0720",
    "from": "water_488_88",
    "to": "water_488_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0721",
    "from": "water_488_88",
    "to": "water_472_104",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0722",
    "from": "water_8_104",
    "to": "water_24_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0723",
    "from": "water_8_104",
    "to": "water_8_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0724",
    "from": "water_8_104",
    "to": "water_24_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0725",
    "from": "water_24_104",
    "to": "water_40_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0726",
    "from": "water_24_104",
    "to": "water_24_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0727",
    "from": "water_24_104",
    "to": "water_8_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0728",
    "from": "water_24_104",
    "to": "water_40_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0729",
    "from": "water_40_104",
    "to": "water_56_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0730",
    "from": "water_40_104",
    "to": "water_40_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0731",
    "from": "water_40_104",
    "to": "water_24_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0732",
    "from": "water_40_104",
    "to": "water_56_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0733",
    "from": "water_56_104",
    "to": "water_72_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0734",
    "from": "water_56_104",
    "to": "water_56_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0735",
    "from": "water_56_104",
    "to": "water_40_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0736",
    "from": "water_56_104",
    "to": "water_72_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0737",
    "from": "water_72_104",
    "to": "water_88_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0738",
    "from": "water_72_104",
    "to": "water_72_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0739",
    "from": "water_72_104",
    "to": "water_56_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0740",
    "from": "water_72_104",
    "to": "water_88_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0741",
    "from": "water_88_104",
    "to": "water_104_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0742",
    "from": "water_88_104",
    "to": "water_88_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0743",
    "from": "water_88_104",
    "to": "water_72_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0744",
    "from": "water_88_104",
    "to": "water_104_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0745",
    "from": "water_104_104",
    "to": "water_120_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0746",
    "from": "water_104_104",
    "to": "water_104_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0747",
    "from": "water_104_104",
    "to": "water_88_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0748",
    "from": "water_104_104",
    "to": "water_120_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0749",
    "from": "water_120_104",
    "to": "water_136_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0750",
    "from": "water_120_104",
    "to": "water_120_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0751",
    "from": "water_120_104",
    "to": "water_104_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0752",
    "from": "water_120_104",
    "to": "water_136_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0753",
    "from": "water_136_104",
    "to": "water_152_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0754",
    "from": "water_136_104",
    "to": "water_136_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0755",
    "from": "water_136_104",
    "to": "water_120_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0756",
    "from": "water_136_104",
    "to": "water_152_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0757",
    "from": "water_152_104",
    "to": "water_168_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0758",
    "from": "water_152_104",
    "to": "water_152_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0759",
    "from": "water_152_104",
    "to": "water_136_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0760",
    "from": "water_152_104",
    "to": "water_168_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0761",
    "from": "water_168_104",
    "to": "water_184_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0762",
    "from": "water_168_104",
    "to": "water_168_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0763",
    "from": "water_168_104",
    "to": "water_152_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0764",
    "from": "water_168_104",
    "to": "water_184_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0765",
    "from": "water_184_104",
    "to": "water_200_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0766",
    "from": "water_184_104",
    "to": "water_184_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0767",
    "from": "water_184_104",
    "to": "water_168_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0768",
    "from": "water_184_104",
    "to": "water_200_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0769",
    "from": "water_200_104",
    "to": "water_216_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0770",
    "from": "water_200_104",
    "to": "water_200_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0771",
    "from": "water_200_104",
    "to": "water_184_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0772",
    "from": "water_216_104",
    "to": "water_232_104",
    "length": 16,
    "minDepth": 1.29,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0773",
    "from": "water_216_104",
    "to": "water_200_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0774",
    "from": "water_248_104",
    "to": "harbor_02",
    "length": 20.52,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "harbor_link"
  },
  {
    "id": "water_edge_0775",
    "from": "water_296_104",
    "to": "water_312_104",
    "length": 16,
    "minDepth": 2.69,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0776",
    "from": "water_296_104",
    "to": "water_296_120",
    "length": 16,
    "minDepth": 1.57,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0777",
    "from": "water_312_104",
    "to": "water_328_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0778",
    "from": "water_312_104",
    "to": "water_296_120",
    "length": 22.63,
    "minDepth": 1.57,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0779",
    "from": "water_328_104",
    "to": "water_344_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0780",
    "from": "water_328_104",
    "to": "water_344_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0781",
    "from": "water_344_104",
    "to": "water_360_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0782",
    "from": "water_344_104",
    "to": "water_344_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0783",
    "from": "water_344_104",
    "to": "water_360_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0784",
    "from": "water_360_104",
    "to": "water_376_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0785",
    "from": "water_360_104",
    "to": "water_360_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0786",
    "from": "water_360_104",
    "to": "water_344_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0787",
    "from": "water_360_104",
    "to": "water_376_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0788",
    "from": "water_376_104",
    "to": "water_392_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0789",
    "from": "water_376_104",
    "to": "water_376_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0790",
    "from": "water_376_104",
    "to": "water_360_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0791",
    "from": "water_376_104",
    "to": "water_392_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0792",
    "from": "water_392_104",
    "to": "water_408_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0793",
    "from": "water_392_104",
    "to": "water_392_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0794",
    "from": "water_392_104",
    "to": "water_376_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0795",
    "from": "water_392_104",
    "to": "water_408_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0796",
    "from": "water_408_104",
    "to": "water_424_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0797",
    "from": "water_408_104",
    "to": "water_408_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0798",
    "from": "water_408_104",
    "to": "water_392_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0799",
    "from": "water_408_104",
    "to": "water_424_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0800",
    "from": "water_424_104",
    "to": "water_440_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0801",
    "from": "water_424_104",
    "to": "water_424_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0802",
    "from": "water_424_104",
    "to": "water_408_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0803",
    "from": "water_424_104",
    "to": "water_440_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0804",
    "from": "water_440_104",
    "to": "water_456_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0805",
    "from": "water_440_104",
    "to": "water_440_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0806",
    "from": "water_440_104",
    "to": "water_424_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0807",
    "from": "water_440_104",
    "to": "water_456_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0808",
    "from": "water_456_104",
    "to": "water_472_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0809",
    "from": "water_456_104",
    "to": "water_456_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0810",
    "from": "water_456_104",
    "to": "water_440_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0811",
    "from": "water_456_104",
    "to": "water_472_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0812",
    "from": "water_472_104",
    "to": "water_488_104",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0813",
    "from": "water_472_104",
    "to": "water_472_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0814",
    "from": "water_472_104",
    "to": "water_456_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0815",
    "from": "water_472_104",
    "to": "water_488_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0816",
    "from": "water_488_104",
    "to": "water_488_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0817",
    "from": "water_488_104",
    "to": "water_472_120",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0818",
    "from": "water_8_120",
    "to": "water_24_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0819",
    "from": "water_8_120",
    "to": "water_8_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0820",
    "from": "water_8_120",
    "to": "water_24_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0821",
    "from": "water_24_120",
    "to": "water_40_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0822",
    "from": "water_24_120",
    "to": "water_24_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0823",
    "from": "water_24_120",
    "to": "water_8_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0824",
    "from": "water_24_120",
    "to": "water_40_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0825",
    "from": "water_40_120",
    "to": "water_56_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0826",
    "from": "water_40_120",
    "to": "water_40_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0827",
    "from": "water_40_120",
    "to": "water_24_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0828",
    "from": "water_40_120",
    "to": "water_56_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0829",
    "from": "water_56_120",
    "to": "water_72_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0830",
    "from": "water_56_120",
    "to": "water_56_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0831",
    "from": "water_56_120",
    "to": "water_40_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0832",
    "from": "water_56_120",
    "to": "water_72_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0833",
    "from": "water_72_120",
    "to": "water_88_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0834",
    "from": "water_72_120",
    "to": "water_72_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0835",
    "from": "water_72_120",
    "to": "water_56_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0836",
    "from": "water_72_120",
    "to": "water_88_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0837",
    "from": "water_88_120",
    "to": "water_104_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0838",
    "from": "water_88_120",
    "to": "water_88_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0839",
    "from": "water_88_120",
    "to": "water_72_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0840",
    "from": "water_88_120",
    "to": "water_104_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0841",
    "from": "water_104_120",
    "to": "water_120_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0842",
    "from": "water_104_120",
    "to": "water_104_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0843",
    "from": "water_104_120",
    "to": "water_88_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0844",
    "from": "water_104_120",
    "to": "water_120_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0845",
    "from": "water_120_120",
    "to": "water_136_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0846",
    "from": "water_120_120",
    "to": "water_120_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0847",
    "from": "water_120_120",
    "to": "water_104_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0848",
    "from": "water_120_120",
    "to": "water_136_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0849",
    "from": "water_136_120",
    "to": "water_152_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0850",
    "from": "water_136_120",
    "to": "water_136_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0851",
    "from": "water_136_120",
    "to": "water_120_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0852",
    "from": "water_136_120",
    "to": "water_152_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0853",
    "from": "water_152_120",
    "to": "water_168_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0854",
    "from": "water_152_120",
    "to": "water_152_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0855",
    "from": "water_152_120",
    "to": "water_136_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0856",
    "from": "water_152_120",
    "to": "water_168_136",
    "length": 22.63,
    "minDepth": 1.57,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0857",
    "from": "water_168_120",
    "to": "water_184_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0858",
    "from": "water_168_120",
    "to": "water_168_136",
    "length": 16,
    "minDepth": 1.57,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0859",
    "from": "water_168_120",
    "to": "water_152_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0860",
    "from": "water_168_120",
    "to": "water_184_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0861",
    "from": "water_184_120",
    "to": "water_200_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0862",
    "from": "water_184_120",
    "to": "water_184_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0863",
    "from": "water_184_120",
    "to": "water_168_136",
    "length": 22.63,
    "minDepth": 1.57,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0864",
    "from": "water_184_120",
    "to": "water_200_136",
    "length": 22.63,
    "minDepth": 2.69,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0865",
    "from": "water_200_120",
    "to": "water_200_136",
    "length": 16,
    "minDepth": 2.69,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0866",
    "from": "water_200_120",
    "to": "water_184_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0867",
    "from": "water_296_120",
    "to": "water_296_136",
    "length": 16,
    "minDepth": 1.57,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0868",
    "from": "water_344_120",
    "to": "water_360_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0869",
    "from": "water_344_120",
    "to": "water_344_136",
    "length": 16,
    "minDepth": 1.01,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0870",
    "from": "water_344_120",
    "to": "water_328_136",
    "length": 22.63,
    "minDepth": 1.29,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0871",
    "from": "water_344_120",
    "to": "water_360_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0872",
    "from": "water_360_120",
    "to": "water_376_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0873",
    "from": "water_360_120",
    "to": "water_360_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0874",
    "from": "water_360_120",
    "to": "water_344_136",
    "length": 22.63,
    "minDepth": 1.01,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0875",
    "from": "water_360_120",
    "to": "water_376_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0876",
    "from": "water_376_120",
    "to": "water_392_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0877",
    "from": "water_376_120",
    "to": "water_376_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0878",
    "from": "water_376_120",
    "to": "water_360_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0879",
    "from": "water_376_120",
    "to": "water_392_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0880",
    "from": "water_392_120",
    "to": "water_408_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0881",
    "from": "water_392_120",
    "to": "water_392_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0882",
    "from": "water_392_120",
    "to": "water_376_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0883",
    "from": "water_392_120",
    "to": "water_408_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0884",
    "from": "water_408_120",
    "to": "water_424_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0885",
    "from": "water_408_120",
    "to": "water_408_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0886",
    "from": "water_408_120",
    "to": "water_392_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0887",
    "from": "water_408_120",
    "to": "water_424_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0888",
    "from": "water_424_120",
    "to": "water_440_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0889",
    "from": "water_424_120",
    "to": "water_424_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0890",
    "from": "water_424_120",
    "to": "water_408_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0891",
    "from": "water_424_120",
    "to": "water_440_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0892",
    "from": "water_440_120",
    "to": "water_456_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0893",
    "from": "water_440_120",
    "to": "water_440_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0894",
    "from": "water_440_120",
    "to": "water_424_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0895",
    "from": "water_440_120",
    "to": "water_456_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0896",
    "from": "water_456_120",
    "to": "water_472_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0897",
    "from": "water_456_120",
    "to": "water_456_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0898",
    "from": "water_456_120",
    "to": "water_440_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0899",
    "from": "water_456_120",
    "to": "water_472_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0900",
    "from": "water_472_120",
    "to": "water_488_120",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0901",
    "from": "water_472_120",
    "to": "water_472_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0902",
    "from": "water_472_120",
    "to": "water_456_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0903",
    "from": "water_472_120",
    "to": "water_488_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0904",
    "from": "water_488_120",
    "to": "water_488_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0905",
    "from": "water_488_120",
    "to": "water_472_136",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0906",
    "from": "water_8_136",
    "to": "water_24_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0907",
    "from": "water_8_136",
    "to": "water_8_152",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0908",
    "from": "water_8_136",
    "to": "water_24_152",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0909",
    "from": "water_24_136",
    "to": "water_40_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0910",
    "from": "water_24_136",
    "to": "water_24_152",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0911",
    "from": "water_24_136",
    "to": "water_8_152",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0912",
    "from": "water_24_136",
    "to": "water_40_152",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0913",
    "from": "water_40_136",
    "to": "water_56_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0914",
    "from": "water_40_136",
    "to": "water_40_152",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0915",
    "from": "water_40_136",
    "to": "water_24_152",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0916",
    "from": "water_40_136",
    "to": "water_56_152",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0917",
    "from": "water_56_136",
    "to": "water_72_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0918",
    "from": "water_56_136",
    "to": "water_56_152",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0919",
    "from": "water_56_136",
    "to": "water_40_152",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0920",
    "from": "water_56_136",
    "to": "water_72_152",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0921",
    "from": "water_72_136",
    "to": "water_88_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0922",
    "from": "water_72_136",
    "to": "water_72_152",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0923",
    "from": "water_72_136",
    "to": "water_56_152",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0924",
    "from": "water_72_136",
    "to": "water_88_152",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0925",
    "from": "water_88_136",
    "to": "water_104_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0926",
    "from": "water_88_136",
    "to": "water_88_152",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0927",
    "from": "water_88_136",
    "to": "water_72_152",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0928",
    "from": "water_88_136",
    "to": "water_104_152",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0929",
    "from": "water_104_136",
    "to": "water_120_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0930",
    "from": "water_104_136",
    "to": "water_104_152",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0931",
    "from": "water_104_136",
    "to": "water_88_152",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0932",
    "from": "water_104_136",
    "to": "water_120_152",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0933",
    "from": "water_120_136",
    "to": "water_136_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0934",
    "from": "water_120_136",
    "to": "water_120_152",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0935",
    "from": "water_120_136",
    "to": "water_104_152",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0936",
    "from": "water_120_136",
    "to": "water_136_152",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0937",
    "from": "water_136_136",
    "to": "water_152_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0938",
    "from": "water_136_136",
    "to": "water_136_152",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0939",
    "from": "water_136_136",
    "to": "water_120_152",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0940",
    "from": "water_136_136",
    "to": "water_152_152",
    "length": 22.63,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0941",
    "from": "water_152_136",
    "to": "water_168_136",
    "length": 16,
    "minDepth": 1.57,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0942",
    "from": "water_152_136",
    "to": "water_152_152",
    "length": 16,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0943",
    "from": "water_152_136",
    "to": "water_136_152",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0944",
    "from": "water_168_136",
    "to": "water_184_136",
    "length": 16,
    "minDepth": 1.57,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0945",
    "from": "water_184_136",
    "to": "water_200_136",
    "length": 16,
    "minDepth": 2.69,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0946",
    "from": "water_184_136",
    "to": "water_200_152",
    "length": 22.63,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0947",
    "from": "water_200_136",
    "to": "water_200_152",
    "length": 16,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0948",
    "from": "water_264_136",
    "to": "water_280_136",
    "length": 16,
    "minDepth": 1.01,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0949",
    "from": "water_264_136",
    "to": "harbor_03",
    "length": 26.48,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "harbor_link"
  },
  {
    "id": "water_edge_0950",
    "from": "water_280_136",
    "to": "harbor_03",
    "length": 11.18,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "harbor_link"
  },
  {
    "id": "water_edge_0951",
    "from": "water_280_136",
    "to": "water_296_136",
    "length": 16,
    "minDepth": 1.57,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0952",
    "from": "water_296_136",
    "to": "harbor_03",
    "length": 7.81,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "harbor_link"
  },
  {
    "id": "water_edge_0953",
    "from": "water_328_136",
    "to": "harbor_04",
    "length": 12.53,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "harbor_link"
  },
  {
    "id": "water_edge_0954",
    "from": "water_328_136",
    "to": "water_344_136",
    "length": 16,
    "minDepth": 1.01,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0955",
    "from": "water_344_136",
    "to": "water_360_136",
    "length": 16,
    "minDepth": 1.01,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0956",
    "from": "water_360_136",
    "to": "water_376_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0957",
    "from": "water_376_136",
    "to": "water_392_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0958",
    "from": "water_376_136",
    "to": "water_392_152",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0959",
    "from": "water_392_136",
    "to": "water_408_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0960",
    "from": "water_392_136",
    "to": "water_392_152",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0961",
    "from": "water_392_136",
    "to": "water_408_152",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0962",
    "from": "water_408_136",
    "to": "water_424_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0963",
    "from": "water_408_136",
    "to": "water_408_152",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0964",
    "from": "water_408_136",
    "to": "water_392_152",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0965",
    "from": "water_408_136",
    "to": "water_424_152",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0966",
    "from": "water_424_136",
    "to": "water_440_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0967",
    "from": "water_424_136",
    "to": "water_424_152",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0968",
    "from": "water_424_136",
    "to": "water_408_152",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0969",
    "from": "water_424_136",
    "to": "water_440_152",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0970",
    "from": "water_440_136",
    "to": "water_456_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0971",
    "from": "water_440_136",
    "to": "water_440_152",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0972",
    "from": "water_440_136",
    "to": "water_424_152",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0973",
    "from": "water_440_136",
    "to": "water_456_152",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0974",
    "from": "water_456_136",
    "to": "water_472_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0975",
    "from": "water_456_136",
    "to": "water_456_152",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0976",
    "from": "water_456_136",
    "to": "water_440_152",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0977",
    "from": "water_456_136",
    "to": "water_472_152",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0978",
    "from": "water_472_136",
    "to": "water_488_136",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0979",
    "from": "water_472_136",
    "to": "water_472_152",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0980",
    "from": "water_472_136",
    "to": "water_456_152",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0981",
    "from": "water_472_136",
    "to": "water_488_152",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0982",
    "from": "water_488_136",
    "to": "water_488_152",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0983",
    "from": "water_488_136",
    "to": "water_472_152",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0984",
    "from": "water_8_152",
    "to": "water_24_152",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0985",
    "from": "water_8_152",
    "to": "water_8_168",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0986",
    "from": "water_8_152",
    "to": "water_24_168",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0987",
    "from": "water_24_152",
    "to": "water_40_152",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0988",
    "from": "water_24_152",
    "to": "water_24_168",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0989",
    "from": "water_24_152",
    "to": "water_8_168",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0990",
    "from": "water_24_152",
    "to": "water_40_168",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0991",
    "from": "water_40_152",
    "to": "water_56_152",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0992",
    "from": "water_40_152",
    "to": "water_40_168",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0993",
    "from": "water_40_152",
    "to": "water_24_168",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0994",
    "from": "water_40_152",
    "to": "water_56_168",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0995",
    "from": "water_56_152",
    "to": "water_72_152",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0996",
    "from": "water_56_152",
    "to": "water_56_168",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0997",
    "from": "water_56_152",
    "to": "water_40_168",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0998",
    "from": "water_56_152",
    "to": "water_72_168",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_0999",
    "from": "water_72_152",
    "to": "water_88_152",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1000",
    "from": "water_72_152",
    "to": "water_72_168",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1001",
    "from": "water_72_152",
    "to": "water_56_168",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1002",
    "from": "water_72_152",
    "to": "water_88_168",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1003",
    "from": "water_88_152",
    "to": "water_104_152",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1004",
    "from": "water_88_152",
    "to": "water_88_168",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1005",
    "from": "water_88_152",
    "to": "water_72_168",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1006",
    "from": "water_88_152",
    "to": "water_104_168",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1007",
    "from": "water_104_152",
    "to": "water_120_152",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1008",
    "from": "water_104_152",
    "to": "water_104_168",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1009",
    "from": "water_104_152",
    "to": "water_88_168",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1010",
    "from": "water_104_152",
    "to": "water_120_168",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1011",
    "from": "water_120_152",
    "to": "water_136_152",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1012",
    "from": "water_120_152",
    "to": "water_120_168",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1013",
    "from": "water_120_152",
    "to": "water_104_168",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1014",
    "from": "water_120_152",
    "to": "water_136_168",
    "length": 22.63,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1015",
    "from": "water_136_152",
    "to": "water_152_152",
    "length": 16,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1016",
    "from": "water_136_152",
    "to": "water_136_168",
    "length": 16,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1017",
    "from": "water_136_152",
    "to": "water_120_168",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1018",
    "from": "water_152_152",
    "to": "water_136_168",
    "length": 22.63,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1019",
    "from": "water_248_152",
    "to": "harbor_05",
    "length": 8.06,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "harbor_link"
  },
  {
    "id": "water_edge_1020",
    "from": "water_392_152",
    "to": "water_408_152",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1021",
    "from": "water_392_152",
    "to": "water_392_168",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1022",
    "from": "water_392_152",
    "to": "water_408_168",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1023",
    "from": "water_408_152",
    "to": "water_424_152",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1024",
    "from": "water_408_152",
    "to": "water_408_168",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1025",
    "from": "water_408_152",
    "to": "water_392_168",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1026",
    "from": "water_408_152",
    "to": "water_424_168",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1027",
    "from": "water_424_152",
    "to": "water_440_152",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1028",
    "from": "water_424_152",
    "to": "water_424_168",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1029",
    "from": "water_424_152",
    "to": "water_408_168",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1030",
    "from": "water_424_152",
    "to": "water_440_168",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1031",
    "from": "water_440_152",
    "to": "water_456_152",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1032",
    "from": "water_440_152",
    "to": "water_440_168",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1033",
    "from": "water_440_152",
    "to": "water_424_168",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1034",
    "from": "water_440_152",
    "to": "water_456_168",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1035",
    "from": "water_456_152",
    "to": "water_472_152",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1036",
    "from": "water_456_152",
    "to": "water_456_168",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1037",
    "from": "water_456_152",
    "to": "water_440_168",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1038",
    "from": "water_456_152",
    "to": "water_472_168",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1039",
    "from": "water_472_152",
    "to": "water_488_152",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1040",
    "from": "water_472_152",
    "to": "water_472_168",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1041",
    "from": "water_472_152",
    "to": "water_456_168",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1042",
    "from": "water_472_152",
    "to": "water_488_168",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1043",
    "from": "water_488_152",
    "to": "water_488_168",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1044",
    "from": "water_488_152",
    "to": "water_472_168",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1045",
    "from": "water_8_168",
    "to": "water_24_168",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1046",
    "from": "water_8_168",
    "to": "water_8_184",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1047",
    "from": "water_8_168",
    "to": "water_24_184",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1048",
    "from": "water_24_168",
    "to": "water_40_168",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1049",
    "from": "water_24_168",
    "to": "water_24_184",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1050",
    "from": "water_24_168",
    "to": "water_8_184",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1051",
    "from": "water_24_168",
    "to": "water_40_184",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1052",
    "from": "water_40_168",
    "to": "water_56_168",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1053",
    "from": "water_40_168",
    "to": "water_40_184",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1054",
    "from": "water_40_168",
    "to": "water_24_184",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1055",
    "from": "water_40_168",
    "to": "water_56_184",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1056",
    "from": "water_56_168",
    "to": "water_72_168",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1057",
    "from": "water_56_168",
    "to": "water_56_184",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1058",
    "from": "water_56_168",
    "to": "water_40_184",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1059",
    "from": "water_56_168",
    "to": "water_72_184",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1060",
    "from": "water_72_168",
    "to": "water_88_168",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1061",
    "from": "water_72_168",
    "to": "water_72_184",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1062",
    "from": "water_72_168",
    "to": "water_56_184",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1063",
    "from": "water_72_168",
    "to": "water_88_184",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1064",
    "from": "water_88_168",
    "to": "water_104_168",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1065",
    "from": "water_88_168",
    "to": "water_88_184",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1066",
    "from": "water_88_168",
    "to": "water_72_184",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1067",
    "from": "water_88_168",
    "to": "water_104_184",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1068",
    "from": "water_104_168",
    "to": "water_120_168",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1069",
    "from": "water_104_168",
    "to": "water_104_184",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1070",
    "from": "water_104_168",
    "to": "water_88_184",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1071",
    "from": "water_104_168",
    "to": "water_120_184",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1072",
    "from": "water_120_168",
    "to": "water_136_168",
    "length": 16,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1073",
    "from": "water_120_168",
    "to": "water_120_184",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1074",
    "from": "water_120_168",
    "to": "water_104_184",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1075",
    "from": "water_120_168",
    "to": "water_136_184",
    "length": 22.63,
    "minDepth": 2.41,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1076",
    "from": "water_136_168",
    "to": "water_136_184",
    "length": 16,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1077",
    "from": "water_136_168",
    "to": "water_120_184",
    "length": 22.63,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1078",
    "from": "water_376_168",
    "to": "water_392_168",
    "length": 16,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1079",
    "from": "water_376_168",
    "to": "water_392_184",
    "length": 22.63,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1080",
    "from": "water_392_168",
    "to": "water_408_168",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1081",
    "from": "water_392_168",
    "to": "water_392_184",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1082",
    "from": "water_392_168",
    "to": "water_408_184",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1083",
    "from": "water_408_168",
    "to": "water_424_168",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1084",
    "from": "water_408_168",
    "to": "water_408_184",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1085",
    "from": "water_408_168",
    "to": "water_392_184",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1086",
    "from": "water_408_168",
    "to": "water_424_184",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1087",
    "from": "water_424_168",
    "to": "water_440_168",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1088",
    "from": "water_424_168",
    "to": "water_424_184",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1089",
    "from": "water_424_168",
    "to": "water_408_184",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1090",
    "from": "water_424_168",
    "to": "water_440_184",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1091",
    "from": "water_440_168",
    "to": "water_456_168",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1092",
    "from": "water_440_168",
    "to": "water_440_184",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1093",
    "from": "water_440_168",
    "to": "water_424_184",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1094",
    "from": "water_440_168",
    "to": "water_456_184",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1095",
    "from": "water_456_168",
    "to": "water_472_168",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1096",
    "from": "water_456_168",
    "to": "water_456_184",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1097",
    "from": "water_456_168",
    "to": "water_440_184",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1098",
    "from": "water_456_168",
    "to": "water_472_184",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1099",
    "from": "water_472_168",
    "to": "water_488_168",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1100",
    "from": "water_472_168",
    "to": "water_472_184",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1101",
    "from": "water_472_168",
    "to": "water_456_184",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1102",
    "from": "water_472_168",
    "to": "water_488_184",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1103",
    "from": "water_488_168",
    "to": "water_488_184",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1104",
    "from": "water_488_168",
    "to": "water_472_184",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1105",
    "from": "water_8_184",
    "to": "water_24_184",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1106",
    "from": "water_8_184",
    "to": "water_8_200",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1107",
    "from": "water_8_184",
    "to": "water_24_200",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1108",
    "from": "water_24_184",
    "to": "water_40_184",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1109",
    "from": "water_24_184",
    "to": "water_24_200",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1110",
    "from": "water_24_184",
    "to": "water_8_200",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1111",
    "from": "water_24_184",
    "to": "water_40_200",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1112",
    "from": "water_40_184",
    "to": "water_56_184",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1113",
    "from": "water_40_184",
    "to": "water_40_200",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1114",
    "from": "water_40_184",
    "to": "water_24_200",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1115",
    "from": "water_40_184",
    "to": "water_56_200",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1116",
    "from": "water_56_184",
    "to": "water_72_184",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1117",
    "from": "water_56_184",
    "to": "water_56_200",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1118",
    "from": "water_56_184",
    "to": "water_40_200",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1119",
    "from": "water_56_184",
    "to": "water_72_200",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1120",
    "from": "water_72_184",
    "to": "water_88_184",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1121",
    "from": "water_72_184",
    "to": "water_72_200",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1122",
    "from": "water_72_184",
    "to": "water_56_200",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1123",
    "from": "water_72_184",
    "to": "water_88_200",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1124",
    "from": "water_88_184",
    "to": "water_104_184",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1125",
    "from": "water_88_184",
    "to": "water_88_200",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1126",
    "from": "water_88_184",
    "to": "water_72_200",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1127",
    "from": "water_88_184",
    "to": "water_104_200",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1128",
    "from": "water_104_184",
    "to": "water_120_184",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1129",
    "from": "water_104_184",
    "to": "water_104_200",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1130",
    "from": "water_104_184",
    "to": "water_88_200",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1131",
    "from": "water_104_184",
    "to": "water_120_200",
    "length": 22.63,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1132",
    "from": "water_120_184",
    "to": "water_136_184",
    "length": 16,
    "minDepth": 2.41,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1133",
    "from": "water_120_184",
    "to": "water_120_200",
    "length": 16,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1134",
    "from": "water_120_184",
    "to": "water_104_200",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1135",
    "from": "water_136_184",
    "to": "water_120_200",
    "length": 22.63,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1136",
    "from": "water_392_184",
    "to": "water_408_184",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1137",
    "from": "water_392_184",
    "to": "water_392_200",
    "length": 16,
    "minDepth": 1.29,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1138",
    "from": "water_392_184",
    "to": "water_408_200",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1139",
    "from": "water_408_184",
    "to": "water_424_184",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1140",
    "from": "water_408_184",
    "to": "water_408_200",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1141",
    "from": "water_408_184",
    "to": "water_392_200",
    "length": 22.63,
    "minDepth": 1.29,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1142",
    "from": "water_408_184",
    "to": "water_424_200",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1143",
    "from": "water_424_184",
    "to": "water_440_184",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1144",
    "from": "water_424_184",
    "to": "water_424_200",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1145",
    "from": "water_424_184",
    "to": "water_408_200",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1146",
    "from": "water_424_184",
    "to": "water_440_200",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1147",
    "from": "water_440_184",
    "to": "water_456_184",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1148",
    "from": "water_440_184",
    "to": "water_440_200",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1149",
    "from": "water_440_184",
    "to": "water_424_200",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1150",
    "from": "water_440_184",
    "to": "water_456_200",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1151",
    "from": "water_456_184",
    "to": "water_472_184",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1152",
    "from": "water_456_184",
    "to": "water_456_200",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1153",
    "from": "water_456_184",
    "to": "water_440_200",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1154",
    "from": "water_456_184",
    "to": "water_472_200",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1155",
    "from": "water_472_184",
    "to": "water_488_184",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1156",
    "from": "water_472_184",
    "to": "water_472_200",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1157",
    "from": "water_472_184",
    "to": "water_456_200",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1158",
    "from": "water_472_184",
    "to": "water_488_200",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1159",
    "from": "water_488_184",
    "to": "water_488_200",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1160",
    "from": "water_488_184",
    "to": "water_472_200",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1161",
    "from": "water_8_200",
    "to": "water_24_200",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1162",
    "from": "water_8_200",
    "to": "water_8_216",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1163",
    "from": "water_8_200",
    "to": "water_24_216",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1164",
    "from": "water_24_200",
    "to": "water_40_200",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1165",
    "from": "water_24_200",
    "to": "water_24_216",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1166",
    "from": "water_24_200",
    "to": "water_8_216",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1167",
    "from": "water_24_200",
    "to": "water_40_216",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1168",
    "from": "water_40_200",
    "to": "water_56_200",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1169",
    "from": "water_40_200",
    "to": "water_40_216",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1170",
    "from": "water_40_200",
    "to": "water_24_216",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1171",
    "from": "water_40_200",
    "to": "water_56_216",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1172",
    "from": "water_56_200",
    "to": "water_72_200",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1173",
    "from": "water_56_200",
    "to": "water_56_216",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1174",
    "from": "water_56_200",
    "to": "water_40_216",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1175",
    "from": "water_56_200",
    "to": "water_72_216",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1176",
    "from": "water_72_200",
    "to": "water_88_200",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1177",
    "from": "water_72_200",
    "to": "water_72_216",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1178",
    "from": "water_72_200",
    "to": "water_56_216",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1179",
    "from": "water_72_200",
    "to": "water_88_216",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1180",
    "from": "water_88_200",
    "to": "water_104_200",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1181",
    "from": "water_88_200",
    "to": "water_88_216",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1182",
    "from": "water_88_200",
    "to": "water_72_216",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1183",
    "from": "water_88_200",
    "to": "water_104_216",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1184",
    "from": "water_104_200",
    "to": "water_120_200",
    "length": 16,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1185",
    "from": "water_104_200",
    "to": "water_104_216",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1186",
    "from": "water_104_200",
    "to": "water_88_216",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1187",
    "from": "water_104_200",
    "to": "water_120_216",
    "length": 22.63,
    "minDepth": 2.13,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1188",
    "from": "water_120_200",
    "to": "water_120_216",
    "length": 16,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1189",
    "from": "water_120_200",
    "to": "water_104_216",
    "length": 22.63,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1190",
    "from": "water_264_200",
    "to": "water_248_216",
    "length": 22.63,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1191",
    "from": "water_344_200",
    "to": "harbor_09",
    "length": 3,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "harbor_link"
  },
  {
    "id": "water_edge_1192",
    "from": "water_360_200",
    "to": "water_376_200",
    "length": 16,
    "minDepth": 1.01,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1193",
    "from": "water_376_200",
    "to": "harbor_07",
    "length": 6.71,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "harbor_link"
  },
  {
    "id": "water_edge_1194",
    "from": "water_392_200",
    "to": "water_408_200",
    "length": 16,
    "minDepth": 1.29,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1195",
    "from": "water_392_200",
    "to": "water_408_216",
    "length": 22.63,
    "minDepth": 1.29,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1196",
    "from": "water_408_200",
    "to": "water_424_200",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1197",
    "from": "water_408_200",
    "to": "water_408_216",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1198",
    "from": "water_408_200",
    "to": "water_392_216",
    "length": 22.63,
    "minDepth": 1.29,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1199",
    "from": "water_408_200",
    "to": "water_424_216",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1200",
    "from": "water_424_200",
    "to": "water_440_200",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1201",
    "from": "water_424_200",
    "to": "water_424_216",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1202",
    "from": "water_424_200",
    "to": "water_408_216",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1203",
    "from": "water_424_200",
    "to": "water_440_216",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1204",
    "from": "water_440_200",
    "to": "water_456_200",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1205",
    "from": "water_440_200",
    "to": "water_440_216",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1206",
    "from": "water_440_200",
    "to": "water_424_216",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1207",
    "from": "water_440_200",
    "to": "water_456_216",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1208",
    "from": "water_456_200",
    "to": "water_472_200",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1209",
    "from": "water_456_200",
    "to": "water_456_216",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1210",
    "from": "water_456_200",
    "to": "water_440_216",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1211",
    "from": "water_456_200",
    "to": "water_472_216",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1212",
    "from": "water_472_200",
    "to": "water_488_200",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1213",
    "from": "water_472_200",
    "to": "water_472_216",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1214",
    "from": "water_472_200",
    "to": "water_456_216",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1215",
    "from": "water_472_200",
    "to": "water_488_216",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1216",
    "from": "water_488_200",
    "to": "water_488_216",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1217",
    "from": "water_488_200",
    "to": "water_472_216",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1218",
    "from": "water_8_216",
    "to": "water_24_216",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1219",
    "from": "water_8_216",
    "to": "water_8_232",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1220",
    "from": "water_8_216",
    "to": "water_24_232",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1221",
    "from": "water_24_216",
    "to": "water_40_216",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1222",
    "from": "water_24_216",
    "to": "water_24_232",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1223",
    "from": "water_24_216",
    "to": "water_8_232",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1224",
    "from": "water_24_216",
    "to": "water_40_232",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1225",
    "from": "water_40_216",
    "to": "water_56_216",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1226",
    "from": "water_40_216",
    "to": "water_40_232",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1227",
    "from": "water_40_216",
    "to": "water_24_232",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1228",
    "from": "water_40_216",
    "to": "water_56_232",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1229",
    "from": "water_56_216",
    "to": "water_72_216",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1230",
    "from": "water_56_216",
    "to": "water_56_232",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1231",
    "from": "water_56_216",
    "to": "water_40_232",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1232",
    "from": "water_56_216",
    "to": "water_72_232",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1233",
    "from": "water_72_216",
    "to": "water_88_216",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1234",
    "from": "water_72_216",
    "to": "water_72_232",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1235",
    "from": "water_72_216",
    "to": "water_56_232",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1236",
    "from": "water_72_216",
    "to": "water_88_232",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1237",
    "from": "water_88_216",
    "to": "water_104_216",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1238",
    "from": "water_88_216",
    "to": "water_88_232",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1239",
    "from": "water_88_216",
    "to": "water_72_232",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1240",
    "from": "water_88_216",
    "to": "water_104_232",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1241",
    "from": "water_104_216",
    "to": "water_120_216",
    "length": 16,
    "minDepth": 2.13,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1242",
    "from": "water_104_216",
    "to": "water_104_232",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1243",
    "from": "water_104_216",
    "to": "water_88_232",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1244",
    "from": "water_120_216",
    "to": "water_104_232",
    "length": 22.63,
    "minDepth": 2.13,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1245",
    "from": "water_184_216",
    "to": "water_184_232",
    "length": 16,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1246",
    "from": "water_184_216",
    "to": "water_168_232",
    "length": 22.63,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1247",
    "from": "water_392_216",
    "to": "water_408_216",
    "length": 16,
    "minDepth": 1.29,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1248",
    "from": "water_392_216",
    "to": "water_408_232",
    "length": 22.63,
    "minDepth": 1.29,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1249",
    "from": "water_408_216",
    "to": "water_424_216",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1250",
    "from": "water_408_216",
    "to": "water_408_232",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1251",
    "from": "water_408_216",
    "to": "water_424_232",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1252",
    "from": "water_424_216",
    "to": "water_440_216",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1253",
    "from": "water_424_216",
    "to": "water_424_232",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1254",
    "from": "water_424_216",
    "to": "water_408_232",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1255",
    "from": "water_424_216",
    "to": "water_440_232",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1256",
    "from": "water_440_216",
    "to": "water_456_216",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1257",
    "from": "water_440_216",
    "to": "water_440_232",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1258",
    "from": "water_440_216",
    "to": "water_424_232",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1259",
    "from": "water_440_216",
    "to": "water_456_232",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1260",
    "from": "water_456_216",
    "to": "water_472_216",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1261",
    "from": "water_456_216",
    "to": "water_456_232",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1262",
    "from": "water_456_216",
    "to": "water_440_232",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1263",
    "from": "water_456_216",
    "to": "water_472_232",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1264",
    "from": "water_472_216",
    "to": "water_488_216",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1265",
    "from": "water_472_216",
    "to": "water_472_232",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1266",
    "from": "water_472_216",
    "to": "water_456_232",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1267",
    "from": "water_472_216",
    "to": "water_488_232",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1268",
    "from": "water_488_216",
    "to": "water_488_232",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1269",
    "from": "water_488_216",
    "to": "water_472_232",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1270",
    "from": "water_8_232",
    "to": "water_24_232",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1271",
    "from": "water_8_232",
    "to": "water_8_248",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1272",
    "from": "water_8_232",
    "to": "water_24_248",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1273",
    "from": "water_24_232",
    "to": "water_40_232",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1274",
    "from": "water_24_232",
    "to": "water_24_248",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1275",
    "from": "water_24_232",
    "to": "water_8_248",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1276",
    "from": "water_24_232",
    "to": "water_40_248",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1277",
    "from": "water_40_232",
    "to": "water_56_232",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1278",
    "from": "water_40_232",
    "to": "water_40_248",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1279",
    "from": "water_40_232",
    "to": "water_24_248",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1280",
    "from": "water_40_232",
    "to": "water_56_248",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1281",
    "from": "water_56_232",
    "to": "water_72_232",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1282",
    "from": "water_56_232",
    "to": "water_56_248",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1283",
    "from": "water_56_232",
    "to": "water_40_248",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1284",
    "from": "water_56_232",
    "to": "water_72_248",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1285",
    "from": "water_72_232",
    "to": "water_88_232",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1286",
    "from": "water_72_232",
    "to": "water_72_248",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1287",
    "from": "water_72_232",
    "to": "water_56_248",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1288",
    "from": "water_72_232",
    "to": "water_88_248",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1289",
    "from": "water_88_232",
    "to": "water_104_232",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1290",
    "from": "water_88_232",
    "to": "water_88_248",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1291",
    "from": "water_88_232",
    "to": "water_72_248",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1292",
    "from": "water_88_232",
    "to": "water_104_248",
    "length": 22.63,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1293",
    "from": "water_104_232",
    "to": "water_120_232",
    "length": 16,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1294",
    "from": "water_104_232",
    "to": "water_104_248",
    "length": 16,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1295",
    "from": "water_104_232",
    "to": "water_88_248",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1296",
    "from": "water_120_232",
    "to": "water_104_248",
    "length": 22.63,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1297",
    "from": "water_168_232",
    "to": "harbor_11",
    "length": 12.21,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "harbor_link"
  },
  {
    "id": "water_edge_1298",
    "from": "water_168_232",
    "to": "water_184_232",
    "length": 16,
    "minDepth": 2.41,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1299",
    "from": "water_168_232",
    "to": "water_168_248",
    "length": 16,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1300",
    "from": "water_168_232",
    "to": "water_184_248",
    "length": 22.63,
    "minDepth": 2.41,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1301",
    "from": "water_184_232",
    "to": "water_200_232",
    "length": 16,
    "minDepth": 2.97,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1302",
    "from": "water_184_232",
    "to": "water_184_248",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1303",
    "from": "water_184_232",
    "to": "water_168_248",
    "length": 22.63,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1304",
    "from": "water_184_232",
    "to": "water_200_248",
    "length": 22.63,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1305",
    "from": "water_184_232",
    "to": "harbor_11",
    "length": 25.08,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "harbor_link"
  },
  {
    "id": "water_edge_1306",
    "from": "water_184_232",
    "to": "harbor_01",
    "length": 33.24,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "harbor_link"
  },
  {
    "id": "water_edge_1307",
    "from": "water_200_232",
    "to": "water_216_232",
    "length": 16,
    "minDepth": 1.01,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1308",
    "from": "water_200_232",
    "to": "water_200_248",
    "length": 16,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1309",
    "from": "water_200_232",
    "to": "harbor_01",
    "length": 17.46,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "harbor_link"
  },
  {
    "id": "water_edge_1310",
    "from": "water_200_232",
    "to": "water_184_248",
    "length": 22.63,
    "minDepth": 2.97,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1311",
    "from": "water_216_232",
    "to": "harbor_01",
    "length": 4.12,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "harbor_link"
  },
  {
    "id": "water_edge_1312",
    "from": "water_216_232",
    "to": "water_200_248",
    "length": 22.63,
    "minDepth": 1.01,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1313",
    "from": "water_232_232",
    "to": "water_232_248",
    "length": 16,
    "minDepth": 1.01,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1314",
    "from": "water_408_232",
    "to": "water_424_232",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1315",
    "from": "water_408_232",
    "to": "water_408_248",
    "length": 16,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1316",
    "from": "water_408_232",
    "to": "water_424_248",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1317",
    "from": "water_424_232",
    "to": "water_440_232",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1318",
    "from": "water_424_232",
    "to": "water_424_248",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1319",
    "from": "water_424_232",
    "to": "water_408_248",
    "length": 22.63,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1320",
    "from": "water_424_232",
    "to": "water_440_248",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1321",
    "from": "water_440_232",
    "to": "water_456_232",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1322",
    "from": "water_440_232",
    "to": "water_440_248",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1323",
    "from": "water_440_232",
    "to": "water_424_248",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1324",
    "from": "water_440_232",
    "to": "water_456_248",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1325",
    "from": "water_456_232",
    "to": "water_472_232",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1326",
    "from": "water_456_232",
    "to": "water_456_248",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1327",
    "from": "water_456_232",
    "to": "water_440_248",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1328",
    "from": "water_456_232",
    "to": "water_472_248",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1329",
    "from": "water_472_232",
    "to": "water_488_232",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1330",
    "from": "water_472_232",
    "to": "water_472_248",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1331",
    "from": "water_472_232",
    "to": "water_456_248",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1332",
    "from": "water_472_232",
    "to": "water_488_248",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1333",
    "from": "water_488_232",
    "to": "water_488_248",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1334",
    "from": "water_488_232",
    "to": "water_472_248",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1335",
    "from": "water_8_248",
    "to": "water_24_248",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1336",
    "from": "water_8_248",
    "to": "water_8_264",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1337",
    "from": "water_8_248",
    "to": "water_24_264",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1338",
    "from": "water_24_248",
    "to": "water_40_248",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1339",
    "from": "water_24_248",
    "to": "water_24_264",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1340",
    "from": "water_24_248",
    "to": "water_8_264",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1341",
    "from": "water_24_248",
    "to": "water_40_264",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1342",
    "from": "water_40_248",
    "to": "water_56_248",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1343",
    "from": "water_40_248",
    "to": "water_40_264",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1344",
    "from": "water_40_248",
    "to": "water_24_264",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1345",
    "from": "water_40_248",
    "to": "water_56_264",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1346",
    "from": "water_56_248",
    "to": "water_72_248",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1347",
    "from": "water_56_248",
    "to": "water_56_264",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1348",
    "from": "water_56_248",
    "to": "water_40_264",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1349",
    "from": "water_56_248",
    "to": "water_72_264",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1350",
    "from": "water_72_248",
    "to": "water_88_248",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1351",
    "from": "water_72_248",
    "to": "water_72_264",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1352",
    "from": "water_72_248",
    "to": "water_56_264",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1353",
    "from": "water_72_248",
    "to": "water_88_264",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1354",
    "from": "water_88_248",
    "to": "water_104_248",
    "length": 16,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1355",
    "from": "water_88_248",
    "to": "water_88_264",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1356",
    "from": "water_88_248",
    "to": "water_72_264",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1357",
    "from": "water_104_248",
    "to": "water_88_264",
    "length": 22.63,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1358",
    "from": "water_168_248",
    "to": "water_184_248",
    "length": 16,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1359",
    "from": "water_168_248",
    "to": "water_168_264",
    "length": 16,
    "minDepth": 1.57,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1360",
    "from": "water_168_248",
    "to": "water_184_264",
    "length": 22.63,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1361",
    "from": "water_168_248",
    "to": "harbor_16",
    "length": 28.23,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "harbor_link"
  },
  {
    "id": "water_edge_1362",
    "from": "water_184_248",
    "to": "water_200_248",
    "length": 16,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1363",
    "from": "water_184_248",
    "to": "water_184_264",
    "length": 16,
    "minDepth": 2.97,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1364",
    "from": "water_184_248",
    "to": "water_168_264",
    "length": 22.63,
    "minDepth": 1.57,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1365",
    "from": "water_184_248",
    "to": "water_200_264",
    "length": 22.63,
    "minDepth": 2.69,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1366",
    "from": "water_200_248",
    "to": "water_200_264",
    "length": 16,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1367",
    "from": "water_200_248",
    "to": "water_184_264",
    "length": 22.63,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1368",
    "from": "water_232_248",
    "to": "water_216_264",
    "length": 22.63,
    "minDepth": 1.29,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1369",
    "from": "water_408_248",
    "to": "water_424_248",
    "length": 16,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1370",
    "from": "water_424_248",
    "to": "water_440_248",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1371",
    "from": "water_424_248",
    "to": "water_424_264",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1372",
    "from": "water_424_248",
    "to": "water_408_264",
    "length": 22.63,
    "minDepth": 1.57,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1373",
    "from": "water_424_248",
    "to": "water_440_264",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1374",
    "from": "water_440_248",
    "to": "water_456_248",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1375",
    "from": "water_440_248",
    "to": "water_440_264",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1376",
    "from": "water_440_248",
    "to": "water_424_264",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1377",
    "from": "water_440_248",
    "to": "water_456_264",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1378",
    "from": "water_456_248",
    "to": "water_472_248",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1379",
    "from": "water_456_248",
    "to": "water_456_264",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1380",
    "from": "water_456_248",
    "to": "water_440_264",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1381",
    "from": "water_456_248",
    "to": "water_472_264",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1382",
    "from": "water_472_248",
    "to": "water_488_248",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1383",
    "from": "water_472_248",
    "to": "water_472_264",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1384",
    "from": "water_472_248",
    "to": "water_456_264",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1385",
    "from": "water_472_248",
    "to": "water_488_264",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1386",
    "from": "water_488_248",
    "to": "water_488_264",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1387",
    "from": "water_488_248",
    "to": "water_472_264",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1388",
    "from": "water_8_264",
    "to": "water_24_264",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1389",
    "from": "water_8_264",
    "to": "water_8_280",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1390",
    "from": "water_8_264",
    "to": "water_24_280",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1391",
    "from": "water_24_264",
    "to": "water_40_264",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1392",
    "from": "water_24_264",
    "to": "water_24_280",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1393",
    "from": "water_24_264",
    "to": "water_8_280",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1394",
    "from": "water_24_264",
    "to": "water_40_280",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1395",
    "from": "water_40_264",
    "to": "water_56_264",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1396",
    "from": "water_40_264",
    "to": "water_40_280",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1397",
    "from": "water_40_264",
    "to": "water_24_280",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1398",
    "from": "water_40_264",
    "to": "water_56_280",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1399",
    "from": "water_56_264",
    "to": "water_72_264",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1400",
    "from": "water_56_264",
    "to": "water_56_280",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1401",
    "from": "water_56_264",
    "to": "water_40_280",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1402",
    "from": "water_56_264",
    "to": "water_72_280",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1403",
    "from": "water_72_264",
    "to": "water_88_264",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1404",
    "from": "water_72_264",
    "to": "water_72_280",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1405",
    "from": "water_72_264",
    "to": "water_56_280",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1406",
    "from": "water_72_264",
    "to": "water_88_280",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1407",
    "from": "water_88_264",
    "to": "water_88_280",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1408",
    "from": "water_88_264",
    "to": "water_72_280",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1409",
    "from": "water_88_264",
    "to": "water_104_280",
    "length": 22.63,
    "minDepth": 1.57,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1410",
    "from": "water_168_264",
    "to": "harbor_16",
    "length": 14.87,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "harbor_link"
  },
  {
    "id": "water_edge_1411",
    "from": "water_168_264",
    "to": "water_184_264",
    "length": 16,
    "minDepth": 1.57,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1412",
    "from": "water_184_264",
    "to": "water_200_264",
    "length": 16,
    "minDepth": 2.69,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1413",
    "from": "water_200_264",
    "to": "water_216_264",
    "length": 16,
    "minDepth": 1.57,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1414",
    "from": "water_248_264",
    "to": "harbor_13",
    "length": 1,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "harbor_link"
  },
  {
    "id": "water_edge_1415",
    "from": "water_280_264",
    "to": "water_280_280",
    "length": 16,
    "minDepth": 1.01,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1416",
    "from": "water_328_264",
    "to": "water_328_280",
    "length": 16,
    "minDepth": 1.01,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1417",
    "from": "water_360_264",
    "to": "water_376_264",
    "length": 16,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1418",
    "from": "water_376_264",
    "to": "harbor_14",
    "length": 9.22,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "harbor_link"
  },
  {
    "id": "water_edge_1419",
    "from": "water_408_264",
    "to": "water_424_264",
    "length": 16,
    "minDepth": 1.57,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1420",
    "from": "water_408_264",
    "to": "water_408_280",
    "length": 16,
    "minDepth": 1.57,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1421",
    "from": "water_408_264",
    "to": "water_424_280",
    "length": 22.63,
    "minDepth": 1.57,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1422",
    "from": "water_424_264",
    "to": "water_440_264",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1423",
    "from": "water_424_264",
    "to": "water_424_280",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1424",
    "from": "water_424_264",
    "to": "water_408_280",
    "length": 22.63,
    "minDepth": 2.69,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1425",
    "from": "water_424_264",
    "to": "water_440_280",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1426",
    "from": "water_440_264",
    "to": "water_456_264",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1427",
    "from": "water_440_264",
    "to": "water_440_280",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1428",
    "from": "water_440_264",
    "to": "water_424_280",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1429",
    "from": "water_440_264",
    "to": "water_456_280",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1430",
    "from": "water_456_264",
    "to": "water_472_264",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1431",
    "from": "water_456_264",
    "to": "water_456_280",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1432",
    "from": "water_456_264",
    "to": "water_440_280",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1433",
    "from": "water_456_264",
    "to": "water_472_280",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1434",
    "from": "water_472_264",
    "to": "water_488_264",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1435",
    "from": "water_472_264",
    "to": "water_472_280",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1436",
    "from": "water_472_264",
    "to": "water_456_280",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1437",
    "from": "water_472_264",
    "to": "water_488_280",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1438",
    "from": "water_488_264",
    "to": "water_488_280",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1439",
    "from": "water_488_264",
    "to": "water_472_280",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1440",
    "from": "water_8_280",
    "to": "water_24_280",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1441",
    "from": "water_8_280",
    "to": "water_8_296",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1442",
    "from": "water_8_280",
    "to": "water_24_296",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1443",
    "from": "water_24_280",
    "to": "water_40_280",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1444",
    "from": "water_24_280",
    "to": "water_24_296",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1445",
    "from": "water_24_280",
    "to": "water_8_296",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1446",
    "from": "water_24_280",
    "to": "water_40_296",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1447",
    "from": "water_40_280",
    "to": "water_56_280",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1448",
    "from": "water_40_280",
    "to": "water_40_296",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1449",
    "from": "water_40_280",
    "to": "water_24_296",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1450",
    "from": "water_40_280",
    "to": "water_56_296",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1451",
    "from": "water_56_280",
    "to": "water_72_280",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1452",
    "from": "water_56_280",
    "to": "water_56_296",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1453",
    "from": "water_56_280",
    "to": "water_40_296",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1454",
    "from": "water_56_280",
    "to": "water_72_296",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1455",
    "from": "water_72_280",
    "to": "water_88_280",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1456",
    "from": "water_72_280",
    "to": "water_72_296",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1457",
    "from": "water_72_280",
    "to": "water_56_296",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1458",
    "from": "water_72_280",
    "to": "water_88_296",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1459",
    "from": "water_88_280",
    "to": "water_104_280",
    "length": 16,
    "minDepth": 1.57,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1460",
    "from": "water_88_280",
    "to": "water_88_296",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1461",
    "from": "water_88_280",
    "to": "water_72_296",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1462",
    "from": "water_88_280",
    "to": "water_104_296",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1463",
    "from": "water_104_280",
    "to": "water_104_296",
    "length": 16,
    "minDepth": 1.57,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1464",
    "from": "water_104_280",
    "to": "water_88_296",
    "length": 22.63,
    "minDepth": 1.57,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1465",
    "from": "water_104_280",
    "to": "water_120_296",
    "length": 22.63,
    "minDepth": 1.57,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1466",
    "from": "water_280_280",
    "to": "water_296_280",
    "length": 16,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1467",
    "from": "water_296_280",
    "to": "water_312_280",
    "length": 16,
    "minDepth": 1.85,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1468",
    "from": "water_312_280",
    "to": "water_328_280",
    "length": 16,
    "minDepth": 1.57,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1469",
    "from": "water_312_280",
    "to": "water_312_296",
    "length": 16,
    "minDepth": 1.01,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1470",
    "from": "water_312_280",
    "to": "water_328_296",
    "length": 22.63,
    "minDepth": 2.69,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1471",
    "from": "water_328_280",
    "to": "water_328_296",
    "length": 16,
    "minDepth": 1.57,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1472",
    "from": "water_328_280",
    "to": "water_312_296",
    "length": 22.63,
    "minDepth": 1.01,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1473",
    "from": "water_408_280",
    "to": "water_424_280",
    "length": 16,
    "minDepth": 2.69,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1474",
    "from": "water_408_280",
    "to": "water_408_296",
    "length": 16,
    "minDepth": 2.69,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1475",
    "from": "water_408_280",
    "to": "water_424_296",
    "length": 22.63,
    "minDepth": 2.69,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1476",
    "from": "water_424_280",
    "to": "water_440_280",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1477",
    "from": "water_424_280",
    "to": "water_424_296",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1478",
    "from": "water_424_280",
    "to": "water_408_296",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1479",
    "from": "water_424_280",
    "to": "water_440_296",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1480",
    "from": "water_440_280",
    "to": "water_456_280",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1481",
    "from": "water_440_280",
    "to": "water_440_296",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1482",
    "from": "water_440_280",
    "to": "water_424_296",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1483",
    "from": "water_440_280",
    "to": "water_456_296",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1484",
    "from": "water_456_280",
    "to": "water_472_280",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1485",
    "from": "water_456_280",
    "to": "water_456_296",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1486",
    "from": "water_456_280",
    "to": "water_440_296",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1487",
    "from": "water_456_280",
    "to": "water_472_296",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1488",
    "from": "water_472_280",
    "to": "water_488_280",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1489",
    "from": "water_472_280",
    "to": "water_472_296",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1490",
    "from": "water_472_280",
    "to": "water_456_296",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1491",
    "from": "water_472_280",
    "to": "water_488_296",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1492",
    "from": "water_488_280",
    "to": "water_488_296",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1493",
    "from": "water_488_280",
    "to": "water_472_296",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1494",
    "from": "water_8_296",
    "to": "water_24_296",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1495",
    "from": "water_8_296",
    "to": "water_8_312",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1496",
    "from": "water_8_296",
    "to": "water_24_312",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1497",
    "from": "water_24_296",
    "to": "water_40_296",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1498",
    "from": "water_24_296",
    "to": "water_24_312",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1499",
    "from": "water_24_296",
    "to": "water_8_312",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1500",
    "from": "water_24_296",
    "to": "water_40_312",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1501",
    "from": "water_40_296",
    "to": "water_56_296",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1502",
    "from": "water_40_296",
    "to": "water_40_312",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1503",
    "from": "water_40_296",
    "to": "water_24_312",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1504",
    "from": "water_40_296",
    "to": "water_56_312",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1505",
    "from": "water_56_296",
    "to": "water_72_296",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1506",
    "from": "water_56_296",
    "to": "water_56_312",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1507",
    "from": "water_56_296",
    "to": "water_40_312",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1508",
    "from": "water_56_296",
    "to": "water_72_312",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1509",
    "from": "water_72_296",
    "to": "water_88_296",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1510",
    "from": "water_72_296",
    "to": "water_72_312",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1511",
    "from": "water_72_296",
    "to": "water_56_312",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1512",
    "from": "water_72_296",
    "to": "water_88_312",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1513",
    "from": "water_88_296",
    "to": "water_104_296",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1514",
    "from": "water_88_296",
    "to": "water_88_312",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1515",
    "from": "water_88_296",
    "to": "water_72_312",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1516",
    "from": "water_88_296",
    "to": "water_104_312",
    "length": 22.63,
    "minDepth": 2.69,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1517",
    "from": "water_104_296",
    "to": "water_120_296",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1518",
    "from": "water_104_296",
    "to": "water_104_312",
    "length": 16,
    "minDepth": 2.69,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1519",
    "from": "water_104_296",
    "to": "water_88_312",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1520",
    "from": "water_120_296",
    "to": "water_136_296",
    "length": 16,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1521",
    "from": "water_120_296",
    "to": "water_104_312",
    "length": 22.63,
    "minDepth": 2.69,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1522",
    "from": "water_232_296",
    "to": "water_216_312",
    "length": 22.63,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1523",
    "from": "water_312_296",
    "to": "water_328_296",
    "length": 16,
    "minDepth": 1.01,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1524",
    "from": "water_408_296",
    "to": "water_424_296",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1525",
    "from": "water_408_296",
    "to": "water_408_312",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1526",
    "from": "water_408_296",
    "to": "water_392_312",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1527",
    "from": "water_408_296",
    "to": "water_424_312",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1528",
    "from": "water_424_296",
    "to": "water_440_296",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1529",
    "from": "water_424_296",
    "to": "water_424_312",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1530",
    "from": "water_424_296",
    "to": "water_408_312",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1531",
    "from": "water_424_296",
    "to": "water_440_312",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1532",
    "from": "water_440_296",
    "to": "water_456_296",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1533",
    "from": "water_440_296",
    "to": "water_440_312",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1534",
    "from": "water_440_296",
    "to": "water_424_312",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1535",
    "from": "water_440_296",
    "to": "water_456_312",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1536",
    "from": "water_456_296",
    "to": "water_472_296",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1537",
    "from": "water_456_296",
    "to": "water_456_312",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1538",
    "from": "water_456_296",
    "to": "water_440_312",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1539",
    "from": "water_456_296",
    "to": "water_472_312",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1540",
    "from": "water_472_296",
    "to": "water_488_296",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1541",
    "from": "water_472_296",
    "to": "water_472_312",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1542",
    "from": "water_472_296",
    "to": "water_456_312",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1543",
    "from": "water_472_296",
    "to": "water_488_312",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1544",
    "from": "water_488_296",
    "to": "water_488_312",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1545",
    "from": "water_488_296",
    "to": "water_472_312",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1546",
    "from": "water_8_312",
    "to": "water_24_312",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1547",
    "from": "water_8_312",
    "to": "water_8_328",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1548",
    "from": "water_8_312",
    "to": "water_24_328",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1549",
    "from": "water_24_312",
    "to": "water_40_312",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1550",
    "from": "water_24_312",
    "to": "water_24_328",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1551",
    "from": "water_24_312",
    "to": "water_8_328",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1552",
    "from": "water_24_312",
    "to": "water_40_328",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1553",
    "from": "water_40_312",
    "to": "water_56_312",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1554",
    "from": "water_40_312",
    "to": "water_40_328",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1555",
    "from": "water_40_312",
    "to": "water_24_328",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1556",
    "from": "water_40_312",
    "to": "water_56_328",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1557",
    "from": "water_56_312",
    "to": "water_72_312",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1558",
    "from": "water_56_312",
    "to": "water_56_328",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1559",
    "from": "water_56_312",
    "to": "water_40_328",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1560",
    "from": "water_56_312",
    "to": "water_72_328",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1561",
    "from": "water_72_312",
    "to": "water_88_312",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1562",
    "from": "water_72_312",
    "to": "water_72_328",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1563",
    "from": "water_72_312",
    "to": "water_56_328",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1564",
    "from": "water_72_312",
    "to": "water_88_328",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1565",
    "from": "water_88_312",
    "to": "water_104_312",
    "length": 16,
    "minDepth": 2.69,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1566",
    "from": "water_88_312",
    "to": "water_88_328",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1567",
    "from": "water_88_312",
    "to": "water_72_328",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1568",
    "from": "water_88_312",
    "to": "water_104_328",
    "length": 22.63,
    "minDepth": 2.13,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1569",
    "from": "water_104_312",
    "to": "water_104_328",
    "length": 16,
    "minDepth": 2.13,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1570",
    "from": "water_104_312",
    "to": "water_88_328",
    "length": 22.63,
    "minDepth": 2.69,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1571",
    "from": "water_216_312",
    "to": "water_200_328",
    "length": 22.63,
    "minDepth": 1.29,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1572",
    "from": "water_280_312",
    "to": "water_296_312",
    "length": 16,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1573",
    "from": "water_392_312",
    "to": "water_408_312",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1574",
    "from": "water_392_312",
    "to": "water_392_328",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1575",
    "from": "water_392_312",
    "to": "water_408_328",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1576",
    "from": "water_408_312",
    "to": "water_424_312",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1577",
    "from": "water_408_312",
    "to": "water_408_328",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1578",
    "from": "water_408_312",
    "to": "water_392_328",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1579",
    "from": "water_408_312",
    "to": "water_424_328",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1580",
    "from": "water_424_312",
    "to": "water_440_312",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1581",
    "from": "water_424_312",
    "to": "water_424_328",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1582",
    "from": "water_424_312",
    "to": "water_408_328",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1583",
    "from": "water_424_312",
    "to": "water_440_328",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1584",
    "from": "water_440_312",
    "to": "water_456_312",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1585",
    "from": "water_440_312",
    "to": "water_440_328",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1586",
    "from": "water_440_312",
    "to": "water_424_328",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1587",
    "from": "water_440_312",
    "to": "water_456_328",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1588",
    "from": "water_456_312",
    "to": "water_472_312",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1589",
    "from": "water_456_312",
    "to": "water_456_328",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1590",
    "from": "water_456_312",
    "to": "water_440_328",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1591",
    "from": "water_456_312",
    "to": "water_472_328",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1592",
    "from": "water_472_312",
    "to": "water_488_312",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1593",
    "from": "water_472_312",
    "to": "water_472_328",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1594",
    "from": "water_472_312",
    "to": "water_456_328",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1595",
    "from": "water_472_312",
    "to": "water_488_328",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1596",
    "from": "water_488_312",
    "to": "water_488_328",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1597",
    "from": "water_488_312",
    "to": "water_472_328",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1598",
    "from": "water_8_328",
    "to": "water_24_328",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1599",
    "from": "water_8_328",
    "to": "water_8_344",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1600",
    "from": "water_8_328",
    "to": "water_24_344",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1601",
    "from": "water_24_328",
    "to": "water_40_328",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1602",
    "from": "water_24_328",
    "to": "water_24_344",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1603",
    "from": "water_24_328",
    "to": "water_8_344",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1604",
    "from": "water_24_328",
    "to": "water_40_344",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1605",
    "from": "water_40_328",
    "to": "water_56_328",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1606",
    "from": "water_40_328",
    "to": "water_40_344",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1607",
    "from": "water_40_328",
    "to": "water_24_344",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1608",
    "from": "water_40_328",
    "to": "water_56_344",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1609",
    "from": "water_56_328",
    "to": "water_72_328",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1610",
    "from": "water_56_328",
    "to": "water_56_344",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1611",
    "from": "water_56_328",
    "to": "water_40_344",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1612",
    "from": "water_56_328",
    "to": "water_72_344",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1613",
    "from": "water_72_328",
    "to": "water_88_328",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1614",
    "from": "water_72_328",
    "to": "water_72_344",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1615",
    "from": "water_72_328",
    "to": "water_56_344",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1616",
    "from": "water_72_328",
    "to": "water_88_344",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1617",
    "from": "water_88_328",
    "to": "water_104_328",
    "length": 16,
    "minDepth": 2.13,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1618",
    "from": "water_88_328",
    "to": "water_88_344",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1619",
    "from": "water_88_328",
    "to": "water_72_344",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1620",
    "from": "water_88_328",
    "to": "water_104_344",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1621",
    "from": "water_104_328",
    "to": "water_104_344",
    "length": 16,
    "minDepth": 2.13,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1622",
    "from": "water_104_328",
    "to": "water_88_344",
    "length": 22.63,
    "minDepth": 2.13,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1623",
    "from": "water_152_328",
    "to": "water_168_328",
    "length": 16,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1624",
    "from": "water_184_328",
    "to": "water_200_328",
    "length": 16,
    "minDepth": 1.29,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1625",
    "from": "water_392_328",
    "to": "water_408_328",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1626",
    "from": "water_392_328",
    "to": "water_392_344",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1627",
    "from": "water_392_328",
    "to": "water_408_344",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1628",
    "from": "water_408_328",
    "to": "water_424_328",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1629",
    "from": "water_408_328",
    "to": "water_408_344",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1630",
    "from": "water_408_328",
    "to": "water_392_344",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1631",
    "from": "water_408_328",
    "to": "water_424_344",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1632",
    "from": "water_424_328",
    "to": "water_440_328",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1633",
    "from": "water_424_328",
    "to": "water_424_344",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1634",
    "from": "water_424_328",
    "to": "water_408_344",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1635",
    "from": "water_424_328",
    "to": "water_440_344",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1636",
    "from": "water_440_328",
    "to": "water_456_328",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1637",
    "from": "water_440_328",
    "to": "water_440_344",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1638",
    "from": "water_440_328",
    "to": "water_424_344",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1639",
    "from": "water_440_328",
    "to": "water_456_344",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1640",
    "from": "water_456_328",
    "to": "water_472_328",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1641",
    "from": "water_456_328",
    "to": "water_456_344",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1642",
    "from": "water_456_328",
    "to": "water_440_344",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1643",
    "from": "water_456_328",
    "to": "water_472_344",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1644",
    "from": "water_472_328",
    "to": "water_488_328",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1645",
    "from": "water_472_328",
    "to": "water_472_344",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1646",
    "from": "water_472_328",
    "to": "water_456_344",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1647",
    "from": "water_472_328",
    "to": "water_488_344",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1648",
    "from": "water_488_328",
    "to": "water_488_344",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1649",
    "from": "water_488_328",
    "to": "water_472_344",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1650",
    "from": "water_8_344",
    "to": "water_24_344",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1651",
    "from": "water_8_344",
    "to": "water_8_360",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1652",
    "from": "water_8_344",
    "to": "water_24_360",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1653",
    "from": "water_24_344",
    "to": "water_40_344",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1654",
    "from": "water_24_344",
    "to": "water_24_360",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1655",
    "from": "water_24_344",
    "to": "water_8_360",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1656",
    "from": "water_24_344",
    "to": "water_40_360",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1657",
    "from": "water_40_344",
    "to": "water_56_344",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1658",
    "from": "water_40_344",
    "to": "water_40_360",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1659",
    "from": "water_40_344",
    "to": "water_24_360",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1660",
    "from": "water_40_344",
    "to": "water_56_360",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1661",
    "from": "water_56_344",
    "to": "water_72_344",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1662",
    "from": "water_56_344",
    "to": "water_56_360",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1663",
    "from": "water_56_344",
    "to": "water_40_360",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1664",
    "from": "water_56_344",
    "to": "water_72_360",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1665",
    "from": "water_72_344",
    "to": "water_88_344",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1666",
    "from": "water_72_344",
    "to": "water_72_360",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1667",
    "from": "water_72_344",
    "to": "water_56_360",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1668",
    "from": "water_72_344",
    "to": "water_88_360",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1669",
    "from": "water_88_344",
    "to": "water_104_344",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1670",
    "from": "water_88_344",
    "to": "water_88_360",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1671",
    "from": "water_88_344",
    "to": "water_72_360",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1672",
    "from": "water_88_344",
    "to": "water_104_360",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1673",
    "from": "water_104_344",
    "to": "water_120_344",
    "length": 16,
    "minDepth": 1.01,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1674",
    "from": "water_104_344",
    "to": "water_104_360",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1675",
    "from": "water_104_344",
    "to": "water_88_360",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1676",
    "from": "water_104_344",
    "to": "water_120_360",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1677",
    "from": "water_120_344",
    "to": "water_120_360",
    "length": 16,
    "minDepth": 1.01,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1678",
    "from": "water_120_344",
    "to": "water_104_360",
    "length": 22.63,
    "minDepth": 1.01,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1679",
    "from": "water_392_344",
    "to": "water_408_344",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1680",
    "from": "water_392_344",
    "to": "water_392_360",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1681",
    "from": "water_392_344",
    "to": "water_376_360",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1682",
    "from": "water_392_344",
    "to": "water_408_360",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1683",
    "from": "water_408_344",
    "to": "water_424_344",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1684",
    "from": "water_408_344",
    "to": "water_408_360",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1685",
    "from": "water_408_344",
    "to": "water_392_360",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1686",
    "from": "water_408_344",
    "to": "water_424_360",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1687",
    "from": "water_424_344",
    "to": "water_440_344",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1688",
    "from": "water_424_344",
    "to": "water_424_360",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1689",
    "from": "water_424_344",
    "to": "water_408_360",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1690",
    "from": "water_424_344",
    "to": "water_440_360",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1691",
    "from": "water_440_344",
    "to": "water_456_344",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1692",
    "from": "water_440_344",
    "to": "water_440_360",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1693",
    "from": "water_440_344",
    "to": "water_424_360",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1694",
    "from": "water_440_344",
    "to": "water_456_360",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1695",
    "from": "water_456_344",
    "to": "water_472_344",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1696",
    "from": "water_456_344",
    "to": "water_456_360",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1697",
    "from": "water_456_344",
    "to": "water_440_360",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1698",
    "from": "water_456_344",
    "to": "water_472_360",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1699",
    "from": "water_472_344",
    "to": "water_488_344",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1700",
    "from": "water_472_344",
    "to": "water_472_360",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1701",
    "from": "water_472_344",
    "to": "water_456_360",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1702",
    "from": "water_472_344",
    "to": "water_488_360",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1703",
    "from": "water_488_344",
    "to": "water_488_360",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1704",
    "from": "water_488_344",
    "to": "water_472_360",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1705",
    "from": "water_8_360",
    "to": "water_24_360",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1706",
    "from": "water_8_360",
    "to": "water_8_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1707",
    "from": "water_8_360",
    "to": "water_24_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1708",
    "from": "water_24_360",
    "to": "water_40_360",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1709",
    "from": "water_24_360",
    "to": "water_24_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1710",
    "from": "water_24_360",
    "to": "water_8_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1711",
    "from": "water_24_360",
    "to": "water_40_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1712",
    "from": "water_40_360",
    "to": "water_56_360",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1713",
    "from": "water_40_360",
    "to": "water_40_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1714",
    "from": "water_40_360",
    "to": "water_24_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1715",
    "from": "water_40_360",
    "to": "water_56_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1716",
    "from": "water_56_360",
    "to": "water_72_360",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1717",
    "from": "water_56_360",
    "to": "water_56_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1718",
    "from": "water_56_360",
    "to": "water_40_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1719",
    "from": "water_56_360",
    "to": "water_72_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1720",
    "from": "water_72_360",
    "to": "water_88_360",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1721",
    "from": "water_72_360",
    "to": "water_72_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1722",
    "from": "water_72_360",
    "to": "water_56_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1723",
    "from": "water_72_360",
    "to": "water_88_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1724",
    "from": "water_88_360",
    "to": "water_104_360",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1725",
    "from": "water_88_360",
    "to": "water_88_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1726",
    "from": "water_88_360",
    "to": "water_72_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1727",
    "from": "water_88_360",
    "to": "water_104_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1728",
    "from": "water_104_360",
    "to": "water_120_360",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1729",
    "from": "water_104_360",
    "to": "water_104_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1730",
    "from": "water_104_360",
    "to": "water_88_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1731",
    "from": "water_104_360",
    "to": "water_120_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1732",
    "from": "water_120_360",
    "to": "water_120_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1733",
    "from": "water_120_360",
    "to": "water_104_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1734",
    "from": "water_120_360",
    "to": "water_136_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1735",
    "from": "water_344_360",
    "to": "water_360_360",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1736",
    "from": "water_344_360",
    "to": "water_344_376",
    "length": 16,
    "minDepth": 2.69,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1737",
    "from": "water_344_360",
    "to": "water_360_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1738",
    "from": "water_360_360",
    "to": "water_376_360",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1739",
    "from": "water_360_360",
    "to": "water_360_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1740",
    "from": "water_360_360",
    "to": "water_344_376",
    "length": 22.63,
    "minDepth": 2.69,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1741",
    "from": "water_360_360",
    "to": "water_376_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1742",
    "from": "water_376_360",
    "to": "water_392_360",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1743",
    "from": "water_376_360",
    "to": "water_376_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1744",
    "from": "water_376_360",
    "to": "water_360_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1745",
    "from": "water_376_360",
    "to": "water_392_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1746",
    "from": "water_392_360",
    "to": "water_408_360",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1747",
    "from": "water_392_360",
    "to": "water_392_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1748",
    "from": "water_392_360",
    "to": "water_376_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1749",
    "from": "water_392_360",
    "to": "water_408_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1750",
    "from": "water_408_360",
    "to": "water_424_360",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1751",
    "from": "water_408_360",
    "to": "water_408_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1752",
    "from": "water_408_360",
    "to": "water_392_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1753",
    "from": "water_408_360",
    "to": "water_424_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1754",
    "from": "water_424_360",
    "to": "water_440_360",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1755",
    "from": "water_424_360",
    "to": "water_424_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1756",
    "from": "water_424_360",
    "to": "water_408_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1757",
    "from": "water_424_360",
    "to": "water_440_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1758",
    "from": "water_440_360",
    "to": "water_456_360",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1759",
    "from": "water_440_360",
    "to": "water_440_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1760",
    "from": "water_440_360",
    "to": "water_424_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1761",
    "from": "water_440_360",
    "to": "water_456_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1762",
    "from": "water_456_360",
    "to": "water_472_360",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1763",
    "from": "water_456_360",
    "to": "water_456_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1764",
    "from": "water_456_360",
    "to": "water_440_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1765",
    "from": "water_456_360",
    "to": "water_472_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1766",
    "from": "water_472_360",
    "to": "water_488_360",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1767",
    "from": "water_472_360",
    "to": "water_472_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1768",
    "from": "water_472_360",
    "to": "water_456_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1769",
    "from": "water_472_360",
    "to": "water_488_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1770",
    "from": "water_488_360",
    "to": "water_488_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1771",
    "from": "water_488_360",
    "to": "water_472_376",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1772",
    "from": "water_8_376",
    "to": "water_24_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1773",
    "from": "water_8_376",
    "to": "water_8_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1774",
    "from": "water_8_376",
    "to": "water_24_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1775",
    "from": "water_24_376",
    "to": "water_40_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1776",
    "from": "water_24_376",
    "to": "water_24_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1777",
    "from": "water_24_376",
    "to": "water_8_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1778",
    "from": "water_24_376",
    "to": "water_40_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1779",
    "from": "water_40_376",
    "to": "water_56_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1780",
    "from": "water_40_376",
    "to": "water_40_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1781",
    "from": "water_40_376",
    "to": "water_24_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1782",
    "from": "water_40_376",
    "to": "water_56_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1783",
    "from": "water_56_376",
    "to": "water_72_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1784",
    "from": "water_56_376",
    "to": "water_56_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1785",
    "from": "water_56_376",
    "to": "water_40_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1786",
    "from": "water_56_376",
    "to": "water_72_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1787",
    "from": "water_72_376",
    "to": "water_88_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1788",
    "from": "water_72_376",
    "to": "water_72_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1789",
    "from": "water_72_376",
    "to": "water_56_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1790",
    "from": "water_72_376",
    "to": "water_88_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1791",
    "from": "water_88_376",
    "to": "water_104_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1792",
    "from": "water_88_376",
    "to": "water_88_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1793",
    "from": "water_88_376",
    "to": "water_72_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1794",
    "from": "water_88_376",
    "to": "water_104_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1795",
    "from": "water_104_376",
    "to": "water_120_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1796",
    "from": "water_104_376",
    "to": "water_104_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1797",
    "from": "water_104_376",
    "to": "water_88_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1798",
    "from": "water_104_376",
    "to": "water_120_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1799",
    "from": "water_120_376",
    "to": "water_136_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1800",
    "from": "water_120_376",
    "to": "water_120_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1801",
    "from": "water_120_376",
    "to": "water_104_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1802",
    "from": "water_120_376",
    "to": "water_136_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1803",
    "from": "water_136_376",
    "to": "water_152_376",
    "length": 16,
    "minDepth": 1.29,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1804",
    "from": "water_136_376",
    "to": "water_136_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1805",
    "from": "water_136_376",
    "to": "water_120_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1806",
    "from": "water_152_376",
    "to": "water_136_392",
    "length": 22.63,
    "minDepth": 1.29,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1807",
    "from": "water_344_376",
    "to": "water_360_376",
    "length": 16,
    "minDepth": 2.69,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1808",
    "from": "water_344_376",
    "to": "water_344_392",
    "length": 16,
    "minDepth": 2.41,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1809",
    "from": "water_344_376",
    "to": "water_360_392",
    "length": 22.63,
    "minDepth": 2.69,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1810",
    "from": "water_360_376",
    "to": "water_376_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1811",
    "from": "water_360_376",
    "to": "water_360_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1812",
    "from": "water_360_376",
    "to": "water_344_392",
    "length": 22.63,
    "minDepth": 2.41,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1813",
    "from": "water_360_376",
    "to": "water_376_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1814",
    "from": "water_376_376",
    "to": "water_392_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1815",
    "from": "water_376_376",
    "to": "water_376_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1816",
    "from": "water_376_376",
    "to": "water_360_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1817",
    "from": "water_376_376",
    "to": "water_392_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1818",
    "from": "water_392_376",
    "to": "water_408_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1819",
    "from": "water_392_376",
    "to": "water_392_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1820",
    "from": "water_392_376",
    "to": "water_376_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1821",
    "from": "water_392_376",
    "to": "water_408_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1822",
    "from": "water_408_376",
    "to": "water_424_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1823",
    "from": "water_408_376",
    "to": "water_408_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1824",
    "from": "water_408_376",
    "to": "water_392_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1825",
    "from": "water_408_376",
    "to": "water_424_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1826",
    "from": "water_424_376",
    "to": "water_440_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1827",
    "from": "water_424_376",
    "to": "water_424_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1828",
    "from": "water_424_376",
    "to": "water_408_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1829",
    "from": "water_424_376",
    "to": "water_440_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1830",
    "from": "water_440_376",
    "to": "water_456_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1831",
    "from": "water_440_376",
    "to": "water_440_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1832",
    "from": "water_440_376",
    "to": "water_424_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1833",
    "from": "water_440_376",
    "to": "water_456_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1834",
    "from": "water_456_376",
    "to": "water_472_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1835",
    "from": "water_456_376",
    "to": "water_456_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1836",
    "from": "water_456_376",
    "to": "water_440_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1837",
    "from": "water_456_376",
    "to": "water_472_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1838",
    "from": "water_472_376",
    "to": "water_488_376",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1839",
    "from": "water_472_376",
    "to": "water_472_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1840",
    "from": "water_472_376",
    "to": "water_456_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1841",
    "from": "water_472_376",
    "to": "water_488_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1842",
    "from": "water_488_376",
    "to": "water_488_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1843",
    "from": "water_488_376",
    "to": "water_472_392",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1844",
    "from": "water_8_392",
    "to": "water_24_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1845",
    "from": "water_8_392",
    "to": "water_8_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1846",
    "from": "water_8_392",
    "to": "water_24_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1847",
    "from": "water_24_392",
    "to": "water_40_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1848",
    "from": "water_24_392",
    "to": "water_24_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1849",
    "from": "water_24_392",
    "to": "water_8_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1850",
    "from": "water_24_392",
    "to": "water_40_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1851",
    "from": "water_40_392",
    "to": "water_56_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1852",
    "from": "water_40_392",
    "to": "water_40_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1853",
    "from": "water_40_392",
    "to": "water_24_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1854",
    "from": "water_40_392",
    "to": "water_56_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1855",
    "from": "water_56_392",
    "to": "water_72_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1856",
    "from": "water_56_392",
    "to": "water_56_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1857",
    "from": "water_56_392",
    "to": "water_40_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1858",
    "from": "water_56_392",
    "to": "water_72_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1859",
    "from": "water_72_392",
    "to": "water_88_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1860",
    "from": "water_72_392",
    "to": "water_72_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1861",
    "from": "water_72_392",
    "to": "water_56_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1862",
    "from": "water_72_392",
    "to": "water_88_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1863",
    "from": "water_88_392",
    "to": "water_104_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1864",
    "from": "water_88_392",
    "to": "water_88_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1865",
    "from": "water_88_392",
    "to": "water_72_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1866",
    "from": "water_88_392",
    "to": "water_104_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1867",
    "from": "water_104_392",
    "to": "water_120_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1868",
    "from": "water_104_392",
    "to": "water_104_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1869",
    "from": "water_104_392",
    "to": "water_88_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1870",
    "from": "water_104_392",
    "to": "water_120_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1871",
    "from": "water_120_392",
    "to": "water_136_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1872",
    "from": "water_120_392",
    "to": "water_120_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1873",
    "from": "water_120_392",
    "to": "water_104_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1874",
    "from": "water_120_392",
    "to": "water_136_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1875",
    "from": "water_136_392",
    "to": "water_136_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1876",
    "from": "water_136_392",
    "to": "water_120_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1877",
    "from": "water_136_392",
    "to": "water_152_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1878",
    "from": "water_216_392",
    "to": "water_216_408",
    "length": 16,
    "minDepth": 1.29,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1879",
    "from": "water_216_392",
    "to": "water_200_408",
    "length": 22.63,
    "minDepth": 1.29,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1880",
    "from": "water_344_392",
    "to": "water_360_392",
    "length": 16,
    "minDepth": 2.41,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1881",
    "from": "water_344_392",
    "to": "water_344_408",
    "length": 16,
    "minDepth": 2.41,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1882",
    "from": "water_344_392",
    "to": "water_328_408",
    "length": 22.63,
    "minDepth": 2.41,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1883",
    "from": "water_344_392",
    "to": "water_360_408",
    "length": 22.63,
    "minDepth": 2.41,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1884",
    "from": "water_360_392",
    "to": "water_376_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1885",
    "from": "water_360_392",
    "to": "water_360_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1886",
    "from": "water_360_392",
    "to": "water_344_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1887",
    "from": "water_360_392",
    "to": "water_376_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1888",
    "from": "water_376_392",
    "to": "water_392_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1889",
    "from": "water_376_392",
    "to": "water_376_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1890",
    "from": "water_376_392",
    "to": "water_360_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1891",
    "from": "water_376_392",
    "to": "water_392_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1892",
    "from": "water_392_392",
    "to": "water_408_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1893",
    "from": "water_392_392",
    "to": "water_392_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1894",
    "from": "water_392_392",
    "to": "water_376_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1895",
    "from": "water_392_392",
    "to": "water_408_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1896",
    "from": "water_408_392",
    "to": "water_424_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1897",
    "from": "water_408_392",
    "to": "water_408_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1898",
    "from": "water_408_392",
    "to": "water_392_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1899",
    "from": "water_408_392",
    "to": "water_424_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1900",
    "from": "water_424_392",
    "to": "water_440_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1901",
    "from": "water_424_392",
    "to": "water_424_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1902",
    "from": "water_424_392",
    "to": "water_408_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1903",
    "from": "water_424_392",
    "to": "water_440_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1904",
    "from": "water_440_392",
    "to": "water_456_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1905",
    "from": "water_440_392",
    "to": "water_440_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1906",
    "from": "water_440_392",
    "to": "water_424_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1907",
    "from": "water_440_392",
    "to": "water_456_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1908",
    "from": "water_456_392",
    "to": "water_472_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1909",
    "from": "water_456_392",
    "to": "water_456_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1910",
    "from": "water_456_392",
    "to": "water_440_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1911",
    "from": "water_456_392",
    "to": "water_472_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1912",
    "from": "water_472_392",
    "to": "water_488_392",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1913",
    "from": "water_472_392",
    "to": "water_472_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1914",
    "from": "water_472_392",
    "to": "water_456_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1915",
    "from": "water_472_392",
    "to": "water_488_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1916",
    "from": "water_488_392",
    "to": "water_488_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1917",
    "from": "water_488_392",
    "to": "water_472_408",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1918",
    "from": "water_8_408",
    "to": "water_24_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1919",
    "from": "water_8_408",
    "to": "water_8_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1920",
    "from": "water_8_408",
    "to": "water_24_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1921",
    "from": "water_24_408",
    "to": "water_40_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1922",
    "from": "water_24_408",
    "to": "water_24_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1923",
    "from": "water_24_408",
    "to": "water_8_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1924",
    "from": "water_24_408",
    "to": "water_40_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1925",
    "from": "water_40_408",
    "to": "water_56_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1926",
    "from": "water_40_408",
    "to": "water_40_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1927",
    "from": "water_40_408",
    "to": "water_24_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1928",
    "from": "water_40_408",
    "to": "water_56_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1929",
    "from": "water_56_408",
    "to": "water_72_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1930",
    "from": "water_56_408",
    "to": "water_56_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1931",
    "from": "water_56_408",
    "to": "water_40_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1932",
    "from": "water_56_408",
    "to": "water_72_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1933",
    "from": "water_72_408",
    "to": "water_88_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1934",
    "from": "water_72_408",
    "to": "water_72_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1935",
    "from": "water_72_408",
    "to": "water_56_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1936",
    "from": "water_72_408",
    "to": "water_88_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1937",
    "from": "water_88_408",
    "to": "water_104_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1938",
    "from": "water_88_408",
    "to": "water_88_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1939",
    "from": "water_88_408",
    "to": "water_72_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1940",
    "from": "water_88_408",
    "to": "water_104_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1941",
    "from": "water_104_408",
    "to": "water_120_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1942",
    "from": "water_104_408",
    "to": "water_104_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1943",
    "from": "water_104_408",
    "to": "water_88_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1944",
    "from": "water_104_408",
    "to": "water_120_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1945",
    "from": "water_120_408",
    "to": "water_136_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1946",
    "from": "water_120_408",
    "to": "water_120_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1947",
    "from": "water_120_408",
    "to": "water_104_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1948",
    "from": "water_120_408",
    "to": "water_136_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1949",
    "from": "water_136_408",
    "to": "water_152_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1950",
    "from": "water_136_408",
    "to": "water_136_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1951",
    "from": "water_136_408",
    "to": "water_120_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1952",
    "from": "water_136_408",
    "to": "water_152_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1953",
    "from": "water_152_408",
    "to": "water_168_408",
    "length": 16,
    "minDepth": 2.69,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1954",
    "from": "water_152_408",
    "to": "water_152_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1955",
    "from": "water_152_408",
    "to": "water_136_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1956",
    "from": "water_152_408",
    "to": "water_168_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1957",
    "from": "water_168_408",
    "to": "water_184_408",
    "length": 16,
    "minDepth": 1.29,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1958",
    "from": "water_168_408",
    "to": "water_168_424",
    "length": 16,
    "minDepth": 2.69,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1959",
    "from": "water_168_408",
    "to": "water_152_424",
    "length": 22.63,
    "minDepth": 2.69,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1960",
    "from": "water_168_408",
    "to": "water_184_424",
    "length": 22.63,
    "minDepth": 2.69,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1961",
    "from": "water_184_408",
    "to": "water_200_408",
    "length": 16,
    "minDepth": 1.29,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1962",
    "from": "water_184_408",
    "to": "water_184_424",
    "length": 16,
    "minDepth": 1.29,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1963",
    "from": "water_184_408",
    "to": "water_168_424",
    "length": 22.63,
    "minDepth": 1.29,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1964",
    "from": "water_184_408",
    "to": "water_200_424",
    "length": 22.63,
    "minDepth": 1.29,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1965",
    "from": "water_200_408",
    "to": "water_216_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1966",
    "from": "water_200_408",
    "to": "water_200_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1967",
    "from": "water_200_408",
    "to": "water_184_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1968",
    "from": "water_200_408",
    "to": "water_216_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1969",
    "from": "water_216_408",
    "to": "water_232_408",
    "length": 16,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1970",
    "from": "water_216_408",
    "to": "water_216_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1971",
    "from": "water_216_408",
    "to": "water_200_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1972",
    "from": "water_216_408",
    "to": "water_232_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1973",
    "from": "water_232_408",
    "to": "water_248_408",
    "length": 16,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1974",
    "from": "water_232_408",
    "to": "water_232_424",
    "length": 16,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1975",
    "from": "water_232_408",
    "to": "water_216_424",
    "length": 22.63,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1976",
    "from": "water_232_408",
    "to": "water_248_424",
    "length": 22.63,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1977",
    "from": "water_248_408",
    "to": "water_264_408",
    "length": 16,
    "minDepth": 1.01,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1978",
    "from": "water_248_408",
    "to": "water_248_424",
    "length": 16,
    "minDepth": 2.69,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1979",
    "from": "water_248_408",
    "to": "water_232_424",
    "length": 22.63,
    "minDepth": 2.69,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1980",
    "from": "water_248_408",
    "to": "water_264_424",
    "length": 22.63,
    "minDepth": 2.69,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1981",
    "from": "water_264_408",
    "to": "water_280_408",
    "length": 16,
    "minDepth": 1.01,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1982",
    "from": "water_264_408",
    "to": "water_264_424",
    "length": 16,
    "minDepth": 1.01,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1983",
    "from": "water_264_408",
    "to": "water_248_424",
    "length": 22.63,
    "minDepth": 1.01,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1984",
    "from": "water_264_408",
    "to": "water_280_424",
    "length": 22.63,
    "minDepth": 1.01,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1985",
    "from": "water_280_408",
    "to": "water_280_424",
    "length": 16,
    "minDepth": 1.57,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1986",
    "from": "water_280_408",
    "to": "water_264_424",
    "length": 22.63,
    "minDepth": 1.57,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1987",
    "from": "water_280_408",
    "to": "water_296_424",
    "length": 22.63,
    "minDepth": 1.57,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1988",
    "from": "water_312_408",
    "to": "water_328_408",
    "length": 16,
    "minDepth": 1.29,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1989",
    "from": "water_312_408",
    "to": "water_312_424",
    "length": 16,
    "minDepth": 1.29,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1990",
    "from": "water_312_408",
    "to": "water_296_424",
    "length": 22.63,
    "minDepth": 1.29,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1991",
    "from": "water_312_408",
    "to": "water_328_424",
    "length": 22.63,
    "minDepth": 1.29,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1992",
    "from": "water_328_408",
    "to": "water_344_408",
    "length": 16,
    "minDepth": 2.97,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1993",
    "from": "water_328_408",
    "to": "water_328_424",
    "length": 16,
    "minDepth": 2.97,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1994",
    "from": "water_328_408",
    "to": "water_312_424",
    "length": 22.63,
    "minDepth": 2.97,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1995",
    "from": "water_328_408",
    "to": "water_344_424",
    "length": 22.63,
    "minDepth": 2.97,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1996",
    "from": "water_344_408",
    "to": "water_360_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1997",
    "from": "water_344_408",
    "to": "water_344_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1998",
    "from": "water_344_408",
    "to": "water_328_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_1999",
    "from": "water_344_408",
    "to": "water_360_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2000",
    "from": "water_360_408",
    "to": "water_376_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2001",
    "from": "water_360_408",
    "to": "water_360_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2002",
    "from": "water_360_408",
    "to": "water_344_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2003",
    "from": "water_360_408",
    "to": "water_376_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2004",
    "from": "water_376_408",
    "to": "water_392_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2005",
    "from": "water_376_408",
    "to": "water_376_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2006",
    "from": "water_376_408",
    "to": "water_360_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2007",
    "from": "water_376_408",
    "to": "water_392_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2008",
    "from": "water_392_408",
    "to": "water_408_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2009",
    "from": "water_392_408",
    "to": "water_392_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2010",
    "from": "water_392_408",
    "to": "water_376_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2011",
    "from": "water_392_408",
    "to": "water_408_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2012",
    "from": "water_408_408",
    "to": "water_424_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2013",
    "from": "water_408_408",
    "to": "water_408_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2014",
    "from": "water_408_408",
    "to": "water_392_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2015",
    "from": "water_408_408",
    "to": "water_424_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2016",
    "from": "water_424_408",
    "to": "water_440_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2017",
    "from": "water_424_408",
    "to": "water_424_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2018",
    "from": "water_424_408",
    "to": "water_408_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2019",
    "from": "water_424_408",
    "to": "water_440_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2020",
    "from": "water_440_408",
    "to": "water_456_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2021",
    "from": "water_440_408",
    "to": "water_440_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2022",
    "from": "water_440_408",
    "to": "water_424_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2023",
    "from": "water_440_408",
    "to": "water_456_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2024",
    "from": "water_456_408",
    "to": "water_472_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2025",
    "from": "water_456_408",
    "to": "water_456_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2026",
    "from": "water_456_408",
    "to": "water_440_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2027",
    "from": "water_456_408",
    "to": "water_472_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2028",
    "from": "water_472_408",
    "to": "water_488_408",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2029",
    "from": "water_472_408",
    "to": "water_472_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2030",
    "from": "water_472_408",
    "to": "water_456_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2031",
    "from": "water_472_408",
    "to": "water_488_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2032",
    "from": "water_488_408",
    "to": "water_488_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2033",
    "from": "water_488_408",
    "to": "water_472_424",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2034",
    "from": "water_8_424",
    "to": "water_24_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2035",
    "from": "water_8_424",
    "to": "water_8_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2036",
    "from": "water_8_424",
    "to": "water_24_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2037",
    "from": "water_24_424",
    "to": "water_40_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2038",
    "from": "water_24_424",
    "to": "water_24_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2039",
    "from": "water_24_424",
    "to": "water_8_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2040",
    "from": "water_24_424",
    "to": "water_40_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2041",
    "from": "water_40_424",
    "to": "water_56_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2042",
    "from": "water_40_424",
    "to": "water_40_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2043",
    "from": "water_40_424",
    "to": "water_24_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2044",
    "from": "water_40_424",
    "to": "water_56_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2045",
    "from": "water_56_424",
    "to": "water_72_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2046",
    "from": "water_56_424",
    "to": "water_56_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2047",
    "from": "water_56_424",
    "to": "water_40_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2048",
    "from": "water_56_424",
    "to": "water_72_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2049",
    "from": "water_72_424",
    "to": "water_88_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2050",
    "from": "water_72_424",
    "to": "water_72_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2051",
    "from": "water_72_424",
    "to": "water_56_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2052",
    "from": "water_72_424",
    "to": "water_88_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2053",
    "from": "water_88_424",
    "to": "water_104_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2054",
    "from": "water_88_424",
    "to": "water_88_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2055",
    "from": "water_88_424",
    "to": "water_72_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2056",
    "from": "water_88_424",
    "to": "water_104_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2057",
    "from": "water_104_424",
    "to": "water_120_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2058",
    "from": "water_104_424",
    "to": "water_104_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2059",
    "from": "water_104_424",
    "to": "water_88_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2060",
    "from": "water_104_424",
    "to": "water_120_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2061",
    "from": "water_120_424",
    "to": "water_136_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2062",
    "from": "water_120_424",
    "to": "water_120_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2063",
    "from": "water_120_424",
    "to": "water_104_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2064",
    "from": "water_120_424",
    "to": "water_136_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2065",
    "from": "water_136_424",
    "to": "water_152_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2066",
    "from": "water_136_424",
    "to": "water_136_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2067",
    "from": "water_136_424",
    "to": "water_120_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2068",
    "from": "water_136_424",
    "to": "water_152_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2069",
    "from": "water_152_424",
    "to": "water_168_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2070",
    "from": "water_152_424",
    "to": "water_152_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2071",
    "from": "water_152_424",
    "to": "water_136_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2072",
    "from": "water_152_424",
    "to": "water_168_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2073",
    "from": "water_168_424",
    "to": "water_184_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2074",
    "from": "water_168_424",
    "to": "water_168_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2075",
    "from": "water_168_424",
    "to": "water_152_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2076",
    "from": "water_168_424",
    "to": "water_184_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2077",
    "from": "water_184_424",
    "to": "water_200_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2078",
    "from": "water_184_424",
    "to": "water_184_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2079",
    "from": "water_184_424",
    "to": "water_168_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2080",
    "from": "water_184_424",
    "to": "water_200_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2081",
    "from": "water_200_424",
    "to": "water_216_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2082",
    "from": "water_200_424",
    "to": "water_200_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2083",
    "from": "water_200_424",
    "to": "water_184_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2084",
    "from": "water_200_424",
    "to": "water_216_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2085",
    "from": "water_216_424",
    "to": "water_232_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2086",
    "from": "water_216_424",
    "to": "water_216_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2087",
    "from": "water_216_424",
    "to": "water_200_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2088",
    "from": "water_216_424",
    "to": "water_232_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2089",
    "from": "water_232_424",
    "to": "water_248_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2090",
    "from": "water_232_424",
    "to": "water_232_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2091",
    "from": "water_232_424",
    "to": "water_216_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2092",
    "from": "water_232_424",
    "to": "water_248_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2093",
    "from": "water_248_424",
    "to": "water_264_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2094",
    "from": "water_248_424",
    "to": "water_248_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2095",
    "from": "water_248_424",
    "to": "water_232_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2096",
    "from": "water_248_424",
    "to": "water_264_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2097",
    "from": "water_264_424",
    "to": "water_280_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2098",
    "from": "water_264_424",
    "to": "water_264_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2099",
    "from": "water_264_424",
    "to": "water_248_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2100",
    "from": "water_264_424",
    "to": "water_280_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2101",
    "from": "water_280_424",
    "to": "water_296_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2102",
    "from": "water_280_424",
    "to": "water_280_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2103",
    "from": "water_280_424",
    "to": "water_264_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2104",
    "from": "water_280_424",
    "to": "water_296_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2105",
    "from": "water_296_424",
    "to": "water_312_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2106",
    "from": "water_296_424",
    "to": "water_296_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2107",
    "from": "water_296_424",
    "to": "water_280_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2108",
    "from": "water_296_424",
    "to": "water_312_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2109",
    "from": "water_312_424",
    "to": "water_328_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2110",
    "from": "water_312_424",
    "to": "water_312_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2111",
    "from": "water_312_424",
    "to": "water_296_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2112",
    "from": "water_312_424",
    "to": "water_328_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2113",
    "from": "water_328_424",
    "to": "water_344_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2114",
    "from": "water_328_424",
    "to": "water_328_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2115",
    "from": "water_328_424",
    "to": "water_312_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2116",
    "from": "water_328_424",
    "to": "water_344_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2117",
    "from": "water_344_424",
    "to": "water_360_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2118",
    "from": "water_344_424",
    "to": "water_344_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2119",
    "from": "water_344_424",
    "to": "water_328_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2120",
    "from": "water_344_424",
    "to": "water_360_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2121",
    "from": "water_360_424",
    "to": "water_376_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2122",
    "from": "water_360_424",
    "to": "water_360_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2123",
    "from": "water_360_424",
    "to": "water_344_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2124",
    "from": "water_360_424",
    "to": "water_376_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2125",
    "from": "water_376_424",
    "to": "water_392_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2126",
    "from": "water_376_424",
    "to": "water_376_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2127",
    "from": "water_376_424",
    "to": "water_360_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2128",
    "from": "water_376_424",
    "to": "water_392_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2129",
    "from": "water_392_424",
    "to": "water_408_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2130",
    "from": "water_392_424",
    "to": "water_392_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2131",
    "from": "water_392_424",
    "to": "water_376_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2132",
    "from": "water_392_424",
    "to": "water_408_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2133",
    "from": "water_408_424",
    "to": "water_424_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2134",
    "from": "water_408_424",
    "to": "water_408_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2135",
    "from": "water_408_424",
    "to": "water_392_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2136",
    "from": "water_408_424",
    "to": "water_424_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2137",
    "from": "water_424_424",
    "to": "water_440_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2138",
    "from": "water_424_424",
    "to": "water_424_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2139",
    "from": "water_424_424",
    "to": "water_408_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2140",
    "from": "water_424_424",
    "to": "water_440_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2141",
    "from": "water_440_424",
    "to": "water_456_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2142",
    "from": "water_440_424",
    "to": "water_440_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2143",
    "from": "water_440_424",
    "to": "water_424_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2144",
    "from": "water_440_424",
    "to": "water_456_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2145",
    "from": "water_456_424",
    "to": "water_472_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2146",
    "from": "water_456_424",
    "to": "water_456_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2147",
    "from": "water_456_424",
    "to": "water_440_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2148",
    "from": "water_456_424",
    "to": "water_472_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2149",
    "from": "water_472_424",
    "to": "water_488_424",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2150",
    "from": "water_472_424",
    "to": "water_472_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2151",
    "from": "water_472_424",
    "to": "water_456_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2152",
    "from": "water_472_424",
    "to": "water_488_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2153",
    "from": "water_488_424",
    "to": "water_488_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2154",
    "from": "water_488_424",
    "to": "water_472_440",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2155",
    "from": "water_8_440",
    "to": "water_24_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2156",
    "from": "water_8_440",
    "to": "water_8_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2157",
    "from": "water_8_440",
    "to": "water_24_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2158",
    "from": "water_24_440",
    "to": "water_40_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2159",
    "from": "water_24_440",
    "to": "water_24_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2160",
    "from": "water_24_440",
    "to": "water_8_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2161",
    "from": "water_24_440",
    "to": "water_40_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2162",
    "from": "water_40_440",
    "to": "water_56_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2163",
    "from": "water_40_440",
    "to": "water_40_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2164",
    "from": "water_40_440",
    "to": "water_24_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2165",
    "from": "water_40_440",
    "to": "water_56_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2166",
    "from": "water_56_440",
    "to": "water_72_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2167",
    "from": "water_56_440",
    "to": "water_56_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2168",
    "from": "water_56_440",
    "to": "water_40_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2169",
    "from": "water_56_440",
    "to": "water_72_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2170",
    "from": "water_72_440",
    "to": "water_88_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2171",
    "from": "water_72_440",
    "to": "water_72_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2172",
    "from": "water_72_440",
    "to": "water_56_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2173",
    "from": "water_72_440",
    "to": "water_88_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2174",
    "from": "water_88_440",
    "to": "water_104_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2175",
    "from": "water_88_440",
    "to": "water_88_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2176",
    "from": "water_88_440",
    "to": "water_72_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2177",
    "from": "water_88_440",
    "to": "water_104_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2178",
    "from": "water_104_440",
    "to": "water_120_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2179",
    "from": "water_104_440",
    "to": "water_104_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2180",
    "from": "water_104_440",
    "to": "water_88_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2181",
    "from": "water_104_440",
    "to": "water_120_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2182",
    "from": "water_120_440",
    "to": "water_136_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2183",
    "from": "water_120_440",
    "to": "water_120_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2184",
    "from": "water_120_440",
    "to": "water_104_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2185",
    "from": "water_120_440",
    "to": "water_136_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2186",
    "from": "water_136_440",
    "to": "water_152_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2187",
    "from": "water_136_440",
    "to": "water_136_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2188",
    "from": "water_136_440",
    "to": "water_120_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2189",
    "from": "water_136_440",
    "to": "water_152_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2190",
    "from": "water_152_440",
    "to": "water_168_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2191",
    "from": "water_152_440",
    "to": "water_152_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2192",
    "from": "water_152_440",
    "to": "water_136_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2193",
    "from": "water_152_440",
    "to": "water_168_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2194",
    "from": "water_168_440",
    "to": "water_184_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2195",
    "from": "water_168_440",
    "to": "water_168_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2196",
    "from": "water_168_440",
    "to": "water_152_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2197",
    "from": "water_168_440",
    "to": "water_184_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2198",
    "from": "water_184_440",
    "to": "water_200_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2199",
    "from": "water_184_440",
    "to": "water_184_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2200",
    "from": "water_184_440",
    "to": "water_168_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2201",
    "from": "water_184_440",
    "to": "water_200_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2202",
    "from": "water_200_440",
    "to": "water_216_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2203",
    "from": "water_200_440",
    "to": "water_200_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2204",
    "from": "water_200_440",
    "to": "water_184_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2205",
    "from": "water_200_440",
    "to": "water_216_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2206",
    "from": "water_216_440",
    "to": "water_232_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2207",
    "from": "water_216_440",
    "to": "water_216_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2208",
    "from": "water_216_440",
    "to": "water_200_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2209",
    "from": "water_216_440",
    "to": "water_232_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2210",
    "from": "water_232_440",
    "to": "water_248_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2211",
    "from": "water_232_440",
    "to": "water_232_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2212",
    "from": "water_232_440",
    "to": "water_216_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2213",
    "from": "water_232_440",
    "to": "water_248_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2214",
    "from": "water_248_440",
    "to": "water_264_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2215",
    "from": "water_248_440",
    "to": "water_248_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2216",
    "from": "water_248_440",
    "to": "water_232_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2217",
    "from": "water_248_440",
    "to": "water_264_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2218",
    "from": "water_264_440",
    "to": "water_280_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2219",
    "from": "water_264_440",
    "to": "water_264_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2220",
    "from": "water_264_440",
    "to": "water_248_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2221",
    "from": "water_264_440",
    "to": "water_280_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2222",
    "from": "water_280_440",
    "to": "water_296_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2223",
    "from": "water_280_440",
    "to": "water_280_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2224",
    "from": "water_280_440",
    "to": "water_264_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2225",
    "from": "water_280_440",
    "to": "water_296_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2226",
    "from": "water_296_440",
    "to": "water_312_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2227",
    "from": "water_296_440",
    "to": "water_296_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2228",
    "from": "water_296_440",
    "to": "water_280_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2229",
    "from": "water_296_440",
    "to": "water_312_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2230",
    "from": "water_312_440",
    "to": "water_328_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2231",
    "from": "water_312_440",
    "to": "water_312_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2232",
    "from": "water_312_440",
    "to": "water_296_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2233",
    "from": "water_312_440",
    "to": "water_328_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2234",
    "from": "water_328_440",
    "to": "water_344_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2235",
    "from": "water_328_440",
    "to": "water_328_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2236",
    "from": "water_328_440",
    "to": "water_312_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2237",
    "from": "water_328_440",
    "to": "water_344_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2238",
    "from": "water_344_440",
    "to": "water_360_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2239",
    "from": "water_344_440",
    "to": "water_344_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2240",
    "from": "water_344_440",
    "to": "water_328_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2241",
    "from": "water_344_440",
    "to": "water_360_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2242",
    "from": "water_360_440",
    "to": "water_376_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2243",
    "from": "water_360_440",
    "to": "water_360_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2244",
    "from": "water_360_440",
    "to": "water_344_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2245",
    "from": "water_360_440",
    "to": "water_376_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2246",
    "from": "water_376_440",
    "to": "water_392_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2247",
    "from": "water_376_440",
    "to": "water_376_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2248",
    "from": "water_376_440",
    "to": "water_360_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2249",
    "from": "water_376_440",
    "to": "water_392_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2250",
    "from": "water_392_440",
    "to": "water_408_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2251",
    "from": "water_392_440",
    "to": "water_392_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2252",
    "from": "water_392_440",
    "to": "water_376_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2253",
    "from": "water_392_440",
    "to": "water_408_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2254",
    "from": "water_408_440",
    "to": "water_424_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2255",
    "from": "water_408_440",
    "to": "water_408_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2256",
    "from": "water_408_440",
    "to": "water_392_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2257",
    "from": "water_408_440",
    "to": "water_424_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2258",
    "from": "water_424_440",
    "to": "water_440_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2259",
    "from": "water_424_440",
    "to": "water_424_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2260",
    "from": "water_424_440",
    "to": "water_408_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2261",
    "from": "water_424_440",
    "to": "water_440_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2262",
    "from": "water_440_440",
    "to": "water_456_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2263",
    "from": "water_440_440",
    "to": "water_440_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2264",
    "from": "water_440_440",
    "to": "water_424_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2265",
    "from": "water_440_440",
    "to": "water_456_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2266",
    "from": "water_456_440",
    "to": "water_472_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2267",
    "from": "water_456_440",
    "to": "water_456_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2268",
    "from": "water_456_440",
    "to": "water_440_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2269",
    "from": "water_456_440",
    "to": "water_472_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2270",
    "from": "water_472_440",
    "to": "water_488_440",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2271",
    "from": "water_472_440",
    "to": "water_472_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2272",
    "from": "water_472_440",
    "to": "water_456_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2273",
    "from": "water_472_440",
    "to": "water_488_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2274",
    "from": "water_488_440",
    "to": "water_488_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2275",
    "from": "water_488_440",
    "to": "water_472_456",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2276",
    "from": "water_8_456",
    "to": "water_24_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2277",
    "from": "water_8_456",
    "to": "water_8_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2278",
    "from": "water_8_456",
    "to": "water_24_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2279",
    "from": "water_24_456",
    "to": "water_40_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2280",
    "from": "water_24_456",
    "to": "water_24_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2281",
    "from": "water_24_456",
    "to": "water_8_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2282",
    "from": "water_24_456",
    "to": "water_40_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2283",
    "from": "water_40_456",
    "to": "water_56_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2284",
    "from": "water_40_456",
    "to": "water_40_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2285",
    "from": "water_40_456",
    "to": "water_24_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2286",
    "from": "water_40_456",
    "to": "water_56_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2287",
    "from": "water_56_456",
    "to": "water_72_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2288",
    "from": "water_56_456",
    "to": "water_56_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2289",
    "from": "water_56_456",
    "to": "water_40_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2290",
    "from": "water_56_456",
    "to": "water_72_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2291",
    "from": "water_72_456",
    "to": "water_88_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2292",
    "from": "water_72_456",
    "to": "water_72_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2293",
    "from": "water_72_456",
    "to": "water_56_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2294",
    "from": "water_72_456",
    "to": "water_88_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2295",
    "from": "water_88_456",
    "to": "water_104_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2296",
    "from": "water_88_456",
    "to": "water_88_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2297",
    "from": "water_88_456",
    "to": "water_72_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2298",
    "from": "water_88_456",
    "to": "water_104_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2299",
    "from": "water_104_456",
    "to": "water_120_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2300",
    "from": "water_104_456",
    "to": "water_104_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2301",
    "from": "water_104_456",
    "to": "water_88_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2302",
    "from": "water_104_456",
    "to": "water_120_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2303",
    "from": "water_120_456",
    "to": "water_136_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2304",
    "from": "water_120_456",
    "to": "water_120_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2305",
    "from": "water_120_456",
    "to": "water_104_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2306",
    "from": "water_120_456",
    "to": "water_136_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2307",
    "from": "water_136_456",
    "to": "water_152_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2308",
    "from": "water_136_456",
    "to": "water_136_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2309",
    "from": "water_136_456",
    "to": "water_120_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2310",
    "from": "water_136_456",
    "to": "water_152_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2311",
    "from": "water_152_456",
    "to": "water_168_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2312",
    "from": "water_152_456",
    "to": "water_152_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2313",
    "from": "water_152_456",
    "to": "water_136_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2314",
    "from": "water_152_456",
    "to": "water_168_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2315",
    "from": "water_168_456",
    "to": "water_184_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2316",
    "from": "water_168_456",
    "to": "water_168_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2317",
    "from": "water_168_456",
    "to": "water_152_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2318",
    "from": "water_168_456",
    "to": "water_184_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2319",
    "from": "water_184_456",
    "to": "water_200_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2320",
    "from": "water_184_456",
    "to": "water_184_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2321",
    "from": "water_184_456",
    "to": "water_168_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2322",
    "from": "water_184_456",
    "to": "water_200_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2323",
    "from": "water_200_456",
    "to": "water_216_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2324",
    "from": "water_200_456",
    "to": "water_200_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2325",
    "from": "water_200_456",
    "to": "water_184_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2326",
    "from": "water_200_456",
    "to": "water_216_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2327",
    "from": "water_216_456",
    "to": "water_232_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2328",
    "from": "water_216_456",
    "to": "water_216_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2329",
    "from": "water_216_456",
    "to": "water_200_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2330",
    "from": "water_216_456",
    "to": "water_232_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2331",
    "from": "water_232_456",
    "to": "water_248_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2332",
    "from": "water_232_456",
    "to": "water_232_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2333",
    "from": "water_232_456",
    "to": "water_216_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2334",
    "from": "water_232_456",
    "to": "water_248_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2335",
    "from": "water_248_456",
    "to": "water_264_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2336",
    "from": "water_248_456",
    "to": "water_248_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2337",
    "from": "water_248_456",
    "to": "water_232_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2338",
    "from": "water_248_456",
    "to": "water_264_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2339",
    "from": "water_264_456",
    "to": "water_280_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2340",
    "from": "water_264_456",
    "to": "water_264_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2341",
    "from": "water_264_456",
    "to": "water_248_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2342",
    "from": "water_264_456",
    "to": "water_280_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2343",
    "from": "water_280_456",
    "to": "water_296_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2344",
    "from": "water_280_456",
    "to": "water_280_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2345",
    "from": "water_280_456",
    "to": "water_264_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2346",
    "from": "water_280_456",
    "to": "water_296_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2347",
    "from": "water_296_456",
    "to": "water_312_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2348",
    "from": "water_296_456",
    "to": "water_296_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2349",
    "from": "water_296_456",
    "to": "water_280_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2350",
    "from": "water_296_456",
    "to": "water_312_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2351",
    "from": "water_312_456",
    "to": "water_328_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2352",
    "from": "water_312_456",
    "to": "water_312_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2353",
    "from": "water_312_456",
    "to": "water_296_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2354",
    "from": "water_312_456",
    "to": "water_328_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2355",
    "from": "water_328_456",
    "to": "water_344_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2356",
    "from": "water_328_456",
    "to": "water_328_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2357",
    "from": "water_328_456",
    "to": "water_312_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2358",
    "from": "water_328_456",
    "to": "water_344_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2359",
    "from": "water_344_456",
    "to": "water_360_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2360",
    "from": "water_344_456",
    "to": "water_344_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2361",
    "from": "water_344_456",
    "to": "water_328_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2362",
    "from": "water_344_456",
    "to": "water_360_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2363",
    "from": "water_360_456",
    "to": "water_376_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2364",
    "from": "water_360_456",
    "to": "water_360_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2365",
    "from": "water_360_456",
    "to": "water_344_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2366",
    "from": "water_360_456",
    "to": "water_376_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2367",
    "from": "water_376_456",
    "to": "water_392_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2368",
    "from": "water_376_456",
    "to": "water_376_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2369",
    "from": "water_376_456",
    "to": "water_360_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2370",
    "from": "water_376_456",
    "to": "water_392_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2371",
    "from": "water_392_456",
    "to": "water_408_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2372",
    "from": "water_392_456",
    "to": "water_392_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2373",
    "from": "water_392_456",
    "to": "water_376_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2374",
    "from": "water_392_456",
    "to": "water_408_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2375",
    "from": "water_408_456",
    "to": "water_424_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2376",
    "from": "water_408_456",
    "to": "water_408_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2377",
    "from": "water_408_456",
    "to": "water_392_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2378",
    "from": "water_408_456",
    "to": "water_424_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2379",
    "from": "water_424_456",
    "to": "water_440_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2380",
    "from": "water_424_456",
    "to": "water_424_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2381",
    "from": "water_424_456",
    "to": "water_408_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2382",
    "from": "water_424_456",
    "to": "water_440_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2383",
    "from": "water_440_456",
    "to": "water_456_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2384",
    "from": "water_440_456",
    "to": "water_440_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2385",
    "from": "water_440_456",
    "to": "water_424_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2386",
    "from": "water_440_456",
    "to": "water_456_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2387",
    "from": "water_456_456",
    "to": "water_472_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2388",
    "from": "water_456_456",
    "to": "water_456_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2389",
    "from": "water_456_456",
    "to": "water_440_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2390",
    "from": "water_456_456",
    "to": "water_472_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2391",
    "from": "water_472_456",
    "to": "water_488_456",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2392",
    "from": "water_472_456",
    "to": "water_472_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2393",
    "from": "water_472_456",
    "to": "water_456_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2394",
    "from": "water_472_456",
    "to": "water_488_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2395",
    "from": "water_488_456",
    "to": "water_488_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2396",
    "from": "water_488_456",
    "to": "water_472_472",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2397",
    "from": "water_8_472",
    "to": "water_24_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2398",
    "from": "water_8_472",
    "to": "water_8_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2399",
    "from": "water_8_472",
    "to": "water_24_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2400",
    "from": "water_24_472",
    "to": "water_40_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2401",
    "from": "water_24_472",
    "to": "water_24_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2402",
    "from": "water_24_472",
    "to": "water_8_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2403",
    "from": "water_24_472",
    "to": "water_40_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2404",
    "from": "water_40_472",
    "to": "water_56_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2405",
    "from": "water_40_472",
    "to": "water_40_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2406",
    "from": "water_40_472",
    "to": "water_24_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2407",
    "from": "water_40_472",
    "to": "water_56_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2408",
    "from": "water_56_472",
    "to": "water_72_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2409",
    "from": "water_56_472",
    "to": "water_56_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2410",
    "from": "water_56_472",
    "to": "water_40_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2411",
    "from": "water_56_472",
    "to": "water_72_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2412",
    "from": "water_72_472",
    "to": "water_88_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2413",
    "from": "water_72_472",
    "to": "water_72_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2414",
    "from": "water_72_472",
    "to": "water_56_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2415",
    "from": "water_72_472",
    "to": "water_88_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2416",
    "from": "water_88_472",
    "to": "water_104_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2417",
    "from": "water_88_472",
    "to": "water_88_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2418",
    "from": "water_88_472",
    "to": "water_72_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2419",
    "from": "water_88_472",
    "to": "water_104_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2420",
    "from": "water_104_472",
    "to": "water_120_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2421",
    "from": "water_104_472",
    "to": "water_104_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2422",
    "from": "water_104_472",
    "to": "water_88_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2423",
    "from": "water_104_472",
    "to": "water_120_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2424",
    "from": "water_120_472",
    "to": "water_136_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2425",
    "from": "water_120_472",
    "to": "water_120_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2426",
    "from": "water_120_472",
    "to": "water_104_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2427",
    "from": "water_120_472",
    "to": "water_136_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2428",
    "from": "water_136_472",
    "to": "water_152_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2429",
    "from": "water_136_472",
    "to": "water_136_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2430",
    "from": "water_136_472",
    "to": "water_120_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2431",
    "from": "water_136_472",
    "to": "water_152_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2432",
    "from": "water_152_472",
    "to": "water_168_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2433",
    "from": "water_152_472",
    "to": "water_152_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2434",
    "from": "water_152_472",
    "to": "water_136_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2435",
    "from": "water_152_472",
    "to": "water_168_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2436",
    "from": "water_168_472",
    "to": "water_184_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2437",
    "from": "water_168_472",
    "to": "water_168_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2438",
    "from": "water_168_472",
    "to": "water_152_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2439",
    "from": "water_168_472",
    "to": "water_184_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2440",
    "from": "water_184_472",
    "to": "water_200_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2441",
    "from": "water_184_472",
    "to": "water_184_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2442",
    "from": "water_184_472",
    "to": "water_168_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2443",
    "from": "water_184_472",
    "to": "water_200_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2444",
    "from": "water_200_472",
    "to": "water_216_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2445",
    "from": "water_200_472",
    "to": "water_200_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2446",
    "from": "water_200_472",
    "to": "water_184_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2447",
    "from": "water_200_472",
    "to": "water_216_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2448",
    "from": "water_216_472",
    "to": "water_232_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2449",
    "from": "water_216_472",
    "to": "water_216_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2450",
    "from": "water_216_472",
    "to": "water_200_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2451",
    "from": "water_216_472",
    "to": "water_232_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2452",
    "from": "water_232_472",
    "to": "water_248_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2453",
    "from": "water_232_472",
    "to": "water_232_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2454",
    "from": "water_232_472",
    "to": "water_216_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2455",
    "from": "water_232_472",
    "to": "water_248_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2456",
    "from": "water_248_472",
    "to": "water_264_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2457",
    "from": "water_248_472",
    "to": "water_248_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2458",
    "from": "water_248_472",
    "to": "water_232_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2459",
    "from": "water_248_472",
    "to": "water_264_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2460",
    "from": "water_264_472",
    "to": "water_280_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2461",
    "from": "water_264_472",
    "to": "water_264_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2462",
    "from": "water_264_472",
    "to": "water_248_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2463",
    "from": "water_264_472",
    "to": "water_280_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2464",
    "from": "water_280_472",
    "to": "water_296_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2465",
    "from": "water_280_472",
    "to": "water_280_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2466",
    "from": "water_280_472",
    "to": "water_264_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2467",
    "from": "water_280_472",
    "to": "water_296_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2468",
    "from": "water_296_472",
    "to": "water_312_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2469",
    "from": "water_296_472",
    "to": "water_296_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2470",
    "from": "water_296_472",
    "to": "water_280_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2471",
    "from": "water_296_472",
    "to": "water_312_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2472",
    "from": "water_312_472",
    "to": "water_328_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2473",
    "from": "water_312_472",
    "to": "water_312_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2474",
    "from": "water_312_472",
    "to": "water_296_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2475",
    "from": "water_312_472",
    "to": "water_328_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2476",
    "from": "water_328_472",
    "to": "water_344_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2477",
    "from": "water_328_472",
    "to": "water_328_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2478",
    "from": "water_328_472",
    "to": "water_312_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2479",
    "from": "water_328_472",
    "to": "water_344_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2480",
    "from": "water_344_472",
    "to": "water_360_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2481",
    "from": "water_344_472",
    "to": "water_344_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2482",
    "from": "water_344_472",
    "to": "water_328_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2483",
    "from": "water_344_472",
    "to": "water_360_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2484",
    "from": "water_360_472",
    "to": "water_376_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2485",
    "from": "water_360_472",
    "to": "water_360_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2486",
    "from": "water_360_472",
    "to": "water_344_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2487",
    "from": "water_360_472",
    "to": "water_376_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2488",
    "from": "water_376_472",
    "to": "water_392_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2489",
    "from": "water_376_472",
    "to": "water_376_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2490",
    "from": "water_376_472",
    "to": "water_360_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2491",
    "from": "water_376_472",
    "to": "water_392_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2492",
    "from": "water_392_472",
    "to": "water_408_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2493",
    "from": "water_392_472",
    "to": "water_392_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2494",
    "from": "water_392_472",
    "to": "water_376_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2495",
    "from": "water_392_472",
    "to": "water_408_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2496",
    "from": "water_408_472",
    "to": "water_424_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2497",
    "from": "water_408_472",
    "to": "water_408_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2498",
    "from": "water_408_472",
    "to": "water_392_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2499",
    "from": "water_408_472",
    "to": "water_424_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2500",
    "from": "water_424_472",
    "to": "water_440_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2501",
    "from": "water_424_472",
    "to": "water_424_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2502",
    "from": "water_424_472",
    "to": "water_408_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2503",
    "from": "water_424_472",
    "to": "water_440_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2504",
    "from": "water_440_472",
    "to": "water_456_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2505",
    "from": "water_440_472",
    "to": "water_440_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2506",
    "from": "water_440_472",
    "to": "water_424_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2507",
    "from": "water_440_472",
    "to": "water_456_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2508",
    "from": "water_456_472",
    "to": "water_472_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2509",
    "from": "water_456_472",
    "to": "water_456_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2510",
    "from": "water_456_472",
    "to": "water_440_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2511",
    "from": "water_456_472",
    "to": "water_472_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2512",
    "from": "water_472_472",
    "to": "water_488_472",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2513",
    "from": "water_472_472",
    "to": "water_472_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2514",
    "from": "water_472_472",
    "to": "water_456_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2515",
    "from": "water_472_472",
    "to": "water_488_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2516",
    "from": "water_488_472",
    "to": "water_488_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2517",
    "from": "water_488_472",
    "to": "water_472_488",
    "length": 22.63,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2518",
    "from": "water_8_488",
    "to": "water_24_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2519",
    "from": "water_24_488",
    "to": "water_40_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2520",
    "from": "water_40_488",
    "to": "water_56_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2521",
    "from": "water_56_488",
    "to": "water_72_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2522",
    "from": "water_72_488",
    "to": "water_88_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2523",
    "from": "water_88_488",
    "to": "water_104_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2524",
    "from": "water_104_488",
    "to": "water_120_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2525",
    "from": "water_120_488",
    "to": "water_136_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2526",
    "from": "water_136_488",
    "to": "water_152_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2527",
    "from": "water_152_488",
    "to": "water_168_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2528",
    "from": "water_168_488",
    "to": "water_184_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2529",
    "from": "water_184_488",
    "to": "water_200_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2530",
    "from": "water_200_488",
    "to": "water_216_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2531",
    "from": "water_216_488",
    "to": "water_232_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2532",
    "from": "water_232_488",
    "to": "water_248_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2533",
    "from": "water_248_488",
    "to": "water_264_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2534",
    "from": "water_264_488",
    "to": "water_280_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2535",
    "from": "water_280_488",
    "to": "water_296_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2536",
    "from": "water_296_488",
    "to": "water_312_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2537",
    "from": "water_312_488",
    "to": "water_328_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2538",
    "from": "water_328_488",
    "to": "water_344_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2539",
    "from": "water_344_488",
    "to": "water_360_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2540",
    "from": "water_360_488",
    "to": "water_376_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2541",
    "from": "water_376_488",
    "to": "water_392_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2542",
    "from": "water_392_488",
    "to": "water_408_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2543",
    "from": "water_408_488",
    "to": "water_424_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2544",
    "from": "water_424_488",
    "to": "water_440_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2545",
    "from": "water_440_488",
    "to": "water_456_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2546",
    "from": "water_456_488",
    "to": "water_472_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2547",
    "from": "water_472_488",
    "to": "water_488_488",
    "length": 16,
    "minDepth": 3,
    "minClearance": 8,
    "kind": "waterway"
  },
  {
    "id": "water_edge_2548",
    "from": "harbor_10",
    "to": "harbor_14",
    "length": 26.31,
    "minDepth": 0.73,
    "minClearance": 8,
    "kind": "harbor_link"
  }
];
