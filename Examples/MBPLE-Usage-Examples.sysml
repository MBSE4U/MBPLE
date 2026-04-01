
package <MBPLE_Usage_Examples> MBPLE_Usage_Examples {

    package MBPLE_CoreVariantSeparationIssue {
        //
        // Separation of Core and Variant Elements such as described in VAMOS is not possible with SysML v2 variation/variants
        //

        // VAMOS example in SysML v1 style
        package <MBPLE_1a> DroneSharedAssetSuperset_MBPLE_1a {
            package Core {
                part def Drone {
                    part battery : Battery; // this is a variation point; skipped explicit definition of variation points for simplicity
                }
                part def Battery;        
            }
            package Variant {
                part def StandardBattery :> Core::Battery;
                part def LongRangeBattery :> Core::Battery;
            }
            package Configuration {
                part def DeliveryDrone :> Core::Drone {
                    part :>> battery : Variant::LongRangeBattery;
                }
            }
        }

        // VAMOS example in SysML v2 style
        package <MBPLE_1b> DroneSharedAssetSuperset_MBPLE_1b {
            package Core {
                part def Drone {
                    variation part battery : Battery {
                        // ISSUE: The core depends on variatn elements!
                        variant part standardBattery : Variant::StandardBattery;
                        variant part longRangeBattery : Variant::LongRangeBattery;
                    }
                }
                part def Battery;        
            }
            package Variant {
                part def StandardBattery :> Core::Battery;
                part def LongRangeBattery :> Core::Battery;
            }
            package Configuration {
                part def DeliveryDrone :> Core::Drone {
                    part :>> battery = battery::longRangeBattery; 
                }
            }
        }
    }
}