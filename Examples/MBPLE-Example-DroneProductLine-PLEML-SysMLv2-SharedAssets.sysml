// MIT License
//
// Copyright (c) 2025 Tim Weilkiens, Marco Forlingieri, Vince Molnar
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

package DroneProductLineSharedAssets {

    private import PLEML::*;
    private import DroneProductLineFeatureModel::*;

    occurrence def DroneProductLineProject {
        doc /* The DroneProductLineProject provides the usage context 
             * for the main engineering artifacts and links them together. 
             */

        // The Feature Tree
        #feature droneFeatureTree : FM::FT;

        // The Base Architecture
        part droneBaseArchitectureContext : DPL_BA::DroneBaseArchitectureContext;

        // The System Requirements
        requirement droneSystemRequirements : DPL_RE::DroneSystemRequirementsSpecification {
            subject :>> drone = droneBaseArchitectureContext.systemOfInterest;
        }

        // The Drone Product Line
        part droneProduct : DPL_SA::Drone;

        // Feature Bindings from Shared Assets to the Features 
        #featureBinding connect droneSystemRequirements.flightTime to droneFeatureTree.battery;
        #featureBinding connect droneSystemRequirements.flightTime::standardRange to droneFeatureTree.standardBattery;
        #featureBinding connect droneSystemRequirements.flightTime::extendedRange to droneFeatureTree.longDistanceBattery;
        
        #featureBinding connect droneProduct.controlUnit.charging to droneFeatureTree.chargingStrategy;
        #featureBinding connect droneProduct.controlUnit.charging::standardCharging to droneFeatureTree.standardCharging;
        #featureBinding connect droneProduct.controlUnit.charging::longDistanceCharging to droneFeatureTree.powerCharging;
        
        #featureBinding connect droneProduct.controlUnit.flightController.observationControlModule to droneFeatureTree.observationPatterns;
        #featureBinding connect droneProduct.controlUnit.flightController.cameraControlModule to droneFeatureTree.cameraPatterns;

        #featureBinding connect droneProduct.battery to droneFeatureTree.battery;
        #featureBinding connect droneProduct.battery::standardBattery to droneFeatureTree.standardBattery;
        #featureBinding connect droneProduct.battery::longDistanceBattery to droneFeatureTree.longDistanceBattery;
        #featureBinding connect droneProduct.battery::longDistanceBattery::longRangeBattery::powerBattery to droneFeatureTree.powerBattery;
        #featureBinding connect droneProduct.battery::longDistanceBattery::longRangeBattery::sustainableBattery to droneFeatureTree.sustainableBattery;

        #featureBinding connect droneProduct.body::bodyWithPayload to droneFeatureTree.payload;
    }

    package <DPL_BA> DroneProductLineBaseArchitecture {       
        part def DroneBaseArchitectureContext {
            part systemOfInterest : DroneBaseArchitecture;
        }
        part def DroneBaseArchitecture {
            attribute totalMass :> ISQ::mass;
        }
    }

    package <DPL_RE> DroneProductLineSystemRequirements {
        requirement def DroneSystemRequirementsSpecification {
            subject drone : DPL_BA::DroneBaseArchitecture;

            requirement <REQ1> maximumTakeOffWeight;
            variation requirement <REQ2> flightTime {
                variant requirement standardRange;
                variant requirement extendedRange;
            }
            requirement <REQ3> maximumPayloadWeight;
        }
    }

    package <DPL_SA> DroneProductLineSystemArchitecture {
        part def Drone {
            variation part body {
                variant part bodyWithoutPayload;
                variant part bodyWithPayload {
                    part payloadAttachment;
                }
            }

            part controlUnit {
                variation action charging {
                    variant action standardCharging;
                    variant action longDistanceCharging;
                }
                part flightController {
                    part observationControlModule[0..1];
                    part cameraControlModule[0..1];
                }
            }
            variation part engines [4..8] {
                variant part engines4[4];
                variant part engines6[6];
                variant part engines8[8];
            }
            variation part battery {
                variant part standardBattery;
                variant part longDistanceBattery :> longDistanceBattery.longRangeBattery {
                    variation part longRangeBattery {
                        variant part powerBattery;
                        variant part sustainableBattery;
                    }
                    // satisfy DPL_RE::droneSystemRequirementsSpecification.flightTime by self;
                }
            }
            assert constraint {
                battery == battery.longDistanceBattery implies controlUnit.charging == controlUnit.charging.longDistanceCharging
            }
            assert constraint {
                engines != engines.engines4 implies battery.longDistanceBattery
            }

        }
    }
}
