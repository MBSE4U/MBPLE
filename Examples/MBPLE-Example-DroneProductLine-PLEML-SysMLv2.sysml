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

package <FM> DroneProductLineFeatureModel {
    private import PLEML::*;

    #featureConfiguration def DeliveryDrone {
        #feature :>> selection : DroneProductLineFeatureTree {
            #feature :>> battery = battery.longDistanceBattery.sustainableBattery;
            #feature :>> chargingStrategy = chargingStrategy.powerCharging;
        }
    }

    #featureConfiguration def ObservationDrone {
        #feature :>> selection : DroneProductLineFeatureTree {
            #feature :>> battery = battery.longDistanceBattery.powerBattery;
            #feature :>> chargingStrategy = chargingStrategy.powerCharging;
            #feature :>> flightStrategies = (flightStrategies.observationPatterns, flightStrategies.cameraPatterns);
        }
    }


    #feature def <ft> DroneProductLineFeatureTree {    
        #feature battery {
            #feature standardBattery;
            #feature longDistanceBattery {
                attribute :>> bindingTime = LifeCycleKind::Operation;
                #feature powerBattery {
                    :>> requiredFeatures {
                      in :>> requiredFeatures = (chargingStrategy.powerCharging);
                    }
                }
                #feature sustainableBattery;
            }
        }

        #feature chargingStrategy {
            #feature standardCharging;
            #feature powerCharging;
        }

        // Alternative Feature group with two selectable subfeatures
        #feature flightStrategies[0..2] {
            #feature observationPatterns;
            #feature cameraPatterns;
        }
    }
}

package DroneProductLineSharedAssets {

    private import PLEML::*;
    private import DroneProductLineFeatureModel::*;

    package <DPL_BA> DroneProductLineBaseArchitecture {
        
        part def BaseDrone {
            attribute totalMass :> ISQ::mass;
        }
    }

    package <DPL_RE> DroneProductLineSystemRequirements {

        requirement droneSystemRequirementsSpecification {
            subject drone : DPL_BA::BaseDrone;

            requirement <REQ1> maximumTakeOffWeight;
            variation requirement <REQ2> flightTime {
                variant requirement standardRange;
                variant requirement extendedRange;
            }
            #featureBinding connect flightTime to FM::ft.battery {
                #featureBinding connect flightTime::standardRange to FM::ft.battery.standardBattery;
                #featureBinding connect flightTime::extendedRange to FM::ft.battery.longDistanceBattery;
            }
            requirement <REQ3> maximumPayloadWeight;
        }

    }

    package <DPL_SA> DroneProductLineSystemArchitecture {
        part def Drone {
            part body;
            part controlUnit {
                variation action charging {
                    variant action standardCharging;
                    variant action longDistanceCharging;
                }
                #featureBinding connect charging to FM::ft.chargingStrategy {
                    #featureBinding connect charging::standardCharging to FM::ft.chargingStrategy.standardCharging;
                    #featureBinding connect charging::longDistanceCharging to FM::ft.chargingStrategy.powerCharging;
                }

                part flightController {
                    part observationControlModule[0..1];
                    #featureBinding connect observationControlModule to FM::ft.flightStrategies.observationPatterns;
                    part cameraControlModule[0..1];
                    #featureBinding connect cameraControlModule to FM::ft.flightStrategies.cameraPatterns;
                }
            }
            part engines [4];
            variation part battery {
                variant part standardBattery;
                variant part longDistanceBattery :> longDistanceBattery.longRangeBattery {
                    variation part longRangeBattery {
                        variant part powerBattery;
                        variant part sustainableBattery;
                    }
                    satisfy DPL_RE::droneSystemRequirementsSpecification.flightTime by self;
                }
            }
            assert constraint {
                battery == battery.longDistanceBattery implies controlUnit.charging == controlUnit.charging.longDistanceCharging
            }
            #featureBinding connect battery to FM::ft.battery {
                #featureBinding connect battery::standardBattery to FM::ft.battery.standardBattery;
                #featureBinding connect battery::longDistanceBattery to FM::ft.battery.longDistanceBattery {
                    #featureBinding connect battery::longDistanceBattery::longRangeBattery::powerBattery to FM::ft.battery.longDistanceBattery.powerBattery;
                    #featureBinding connect battery::longDistanceBattery::longRangeBattery::sustainableBattery to FM::ft.battery.longDistanceBattery.sustainableBattery;
                }
            }
        }
    }
}


package <PRODUCT_DD> DeliveryDroneProductModel {
    doc /* Product Model of a the Delivery Drone (member product of the product line)
         * 
         * Can be automatically generated by the following steps:
         * 1. Select feature configuration for the delivery drone member product.
         * 2. Create subclassifications or subsettings of the root shared assets if it contains feature bindings.
         * 3. For each feature binding of a shared asset:
         *      a) Shared asset is a variation: Bind the corresponding variant according to the feature configuration and nested feature bindings.
         *      b) Shared asset has multiplicity [0..1]: Set multiplicity to 0 or 1 according to the feature configuration.
         */

    private import DroneProductLineSharedAssets::*;

    package <DD_RE> DeliveryDroneSystemRequirements {

        requirement systemRequirementsSpecification :> DPL_RE::droneSystemRequirementsSpecification {
            requirement :>> flightTime = flightTime::extendedRange;
        }
    }

    package <DD_SA> DeliveryDroneSystemArchitecture {

        part def DeliveryDrone :> DPL_SA::Drone {
            action :>> controlUnit.charging = controlUnit.charging::longDistanceCharging;
            part :>> controlUnit.flightController {
                part :>> cameraControlModule[1];
                part :>> observationControlModule[1];
            }
            part :>> battery = battery::longDistanceBattery::longRangeBattery::sustainableBattery;
        }
    }
}
