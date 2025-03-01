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

    #featureModel def DroneProductLineFeatureModel {
        #feature featureTree {
            #feature battery[1];
            #feature standardBattery[0..1] :> battery;
            #feature longDistanceBattery[0..1] :> battery {
                attribute :>> bindingTime = LifeCycleKind::Operation;
            }
            #feature powerBattery[0..1] :> longDistanceBattery {
                assert constraint :>> requiresFeatures {
                    in #feature :>> requiredFeatures = (powerCharging);
                }
            }
            #feature sustainableBattery[0..1] :> longDistanceBattery;

            #feature numberOfEngines[1];
            #feature fourEngines[0..1] :> numberOfEngines;
            #feature sixEngines[0..1]  :> numberOfEngines {
                assert constraint :>> requiresFeatures {
                    in #feature :>> requiredFeatures = (longDistanceBattery);
                }
            }
            #feature eightEngines[0..1]  :> numberOfEngines {
                assert constraint :>> requiresFeatures {
                    in #feature :>> requiredFeatures = (powerBattery);
                }
            }

            #feature numberOfCameras[1];
            #feature noCam[0..1] :> numberOfCameras;
            #feature oneCam[0..1] :> numberOfCameras;
            #feature twoCams[0..1] :> numberOfCameras;

            // Optional feature
            #feature payload[0..1] {
                assert constraint :>> xorFeatures {
                    in #feature :>> excluded = (twoCams);
                }
            }

            #feature chargingStrategy[1];
            #feature standardCharging[0..1] :> chargingStrategy;
            #feature powerCharging[0..1] :> chargingStrategy;

            // Alternative Feature group with zero, one, or two selectable subfeatures
            #feature flightStrategies[0..2];
            #feature observationPatterns[0..1] :> flightStrategies;
            #feature cameraPatterns[0..1] :> flightStrategies;
            #feature aerobaticPatterns[0..1] :> flightStrategies;            
        }

        #featureConfiguration deliveryDrone :> featureTree {
            #feature :>> battery = sustainableBattery;
            #feature :>> chargingStrategy = powerCharging;
            #feature :>> numberOfEngines = sixEngines;
            #feature :>> numberOfCameras = oneCam;
            #feature :>> flightStrategies = (cameraPatterns);
            #feature :>> payload;
        }
        #featureConfiguration observationDrone :> featureTree {
            #feature :>> battery = powerBattery;
            #feature :>> chargingStrategy = powerCharging;
            #feature :>> numberOfEngines = eightEngines;
            #feature :>> numberOfCameras = twoCams;
            #feature :>> flightStrategies = (observationPatterns, cameraPatterns);
        }
        #featureConfiguration consumerDrone :> featureTree {
            #feature :>> battery = standardBattery;
            #feature :>> chargingStrategy = standardCharging;
            #feature :>> numberOfEngines = fourEngines;
            #feature :>> numberOfCameras = oneCam;
            #feature :>> flightStrategies = (cameraPatterns);
        }
    }
}
