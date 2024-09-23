package <DPL> 'INCOSE-PLE-WG-DroneProductLineExample-SysMLv2' {
    doc /* SysML v2 Example of a Drone Product Line
         * 
         * The purpose of this example is demonstrating the usage of SysML v2 and its variant modeling capabilities in the context of a product line.
         * 
         * It is created and maintained by the INCOSE PLE WG. 
         * Contact: Marco Forlingieri (), Tim Weilkiens (tim.weilkiens@oose.de)
         *
         * Inspired and based on the books 
         * Model-Based Product Line Engineering by Marco Forlingieri, Tim Weilkiens, Hugo Guillermo Chale and
         * The SysML v2 Book by Tim Weilkiens, Vince Molnar (in progress; will be published in 2025)
         *
         */

 package <DPLFM> DPLFeatureModel {
        doc
        /* Features are not part of SysML v2 and therefore excluded in this example. 
         * The feature model is defined in a separate model, which has interfaces to this SysML v2 model.
         *
         * Anyhow, although features are not part of the SysML v2 language set, they can be modeled with SysML v2.
         * Future work could elaborate on this using the DPL example.
         */
    }
    package <DPLSAS> DPLSharedAssetsSuperset {
        doc
        /* The package contains the SysML v2 Shared Assets Supersets of the DPL. 
         * For the sake of simplicity, all models are included in this package. In real projects, 
         * they are distributed, for example, shared assets supersets of individual components.
         */
        package Configurations {
            package <DCSA> DroneConfigurationsSystemArchitectures {
                variation part def DroneVariations :> Core::DSA::Drone {
                    variant part deliveryDrone;
                    variant part forestFireObservationDrone;
                    variant part consumerDrone;
                }
            }
        }
        package Variants {
            part def forestFireObservationDrone :> Core::DroneSystemArchitecture::Drone {
                :>> numberOfEngines = 6;
                part engine1 :> engines;
                part engine2 :> engines;
                part engine3 :> engines;
                part engine4 :> engines;
                part engine5 :> engines;
                part engine6 :> engines;
                connection pwrCable : PowerCable connect sourceSocket ::> powerManagementSystem.charger.powerSocket to targetSocket ::> engine1.powerSocket;
            }
            connection def PowerCable {
                attribute length;
                part cable;
                end sourceSocket;
                end targetSocket;
                part sourcePlug;
                part targetPlug;
                connect sourceSocket to sourcePlug;
                connect sourcePlug to cable;
                connect targetPlug to cable;
                connect targetSocket to targetPlug;
            }
        }
        package Core {
            package <D> DroneProduct {
                doc /* Top-Level package of the Drone Product */
                package <DCON> DroneProjectConcepts {
                    doc /* Common Definitions of engineering concepts used in the Drone project */
                    part def Stakeholder {
                        doc /* Project-specific definition of the stakeholder concept */
                        attribute risk : PriorityKind;
                        attribute effort : PriorityKind;
                    }
                    enum def PriorityKind :> ScalarValues::Integer {
                        /* Priority levels with integer values to enable priority calculations */
                        high = 3;
                        medium = 2;
                        low = 1;
                    }
                }
                part def <DPC> DroneProductContext {
                    doc /* Definition of the context of the Drone project. 
                         * It includes besides others the stakeholders, concerns, and the system context. 
                         */
                    private import DroneProjectConcepts::*;
                    part stakeholders [*] : Stakeholder;
                    part aviationAuthority : Stakeholder {
                        attribute :>> risk = risk::high;
                        attribute :>> effort = risk::medium;
                    }
                    part ceo : Stakeholder {
                        doc /* CEO of the companies who owns and engineers the drone product line. */
                        attribute :>> risk = risk::high;
                        attribute :>> effort = risk::medium;
                    }
                    concern problemStatement {
                        doc /* The problem statement of the drone product line. */
                        subject;
                        stakeholder :> ceo;
                        require constraint {
                            doc
                            /* How can we provide a forest fire detection system for forest authorities 
                             * that can be scaled to any forest size, is affordable, highly reliable, 
                             * and accurate in detecting forest fires to reduce the number of forest fires 
                             * in the world significantly?
                             */
                        }
                    }
                    part droneContext : DroneSystemContext::DroneSystemContext;
                }
            }
            package <DSC> DroneSystemContext {
                doc /* Definition of the Drone System Context including the Actors */
                part def DroneSystemContext {
                    /* Definition of the Drone System Context */
                    part drone : DroneBaseArchitecture::Drone;
                }
            }
            package <DBA> DroneBaseArchitecture {
                doc /* Common Definition of a Drone Architecture as already predefined for the problem space */
                part def Drone {
                    attribute massActual;
                    part battery [0..2];
                    part body;
                    part powerManagementSystem;
                    part engines [4..6];
                    connect powerManagementSystem to engines;
                    part chargingUnit;
                    connect chargingUnit to powerManagementSystem;
                }
            }
            package <DSA> DroneSystemArchitecture {
                private import DroneBattery::**;
                part def Drone :> DroneBaseArchitecture::Drone {
                    part :>> battery : BatteryVariations;
                    part :>> body : Body;
                    part <pms> powerManagementSystem :>> powerManagementSystem : PowerManagementSystem;
                    part :>> engines [numberOfEngines] : Engine;
                    variation attribute numberOfEngines : ScalarValues::Integer {
                        variant attribute four = 4;
                        variant attribute six = 6;
                    }
                }
                part def <PP> PhysicalPart {
                    part subParts [*] : PhysicalPart;
                    attribute mass :> ISQBase::mass;
                    attribute totalMass = mass + QuantityCalculations::sum(subParts.totalMass);
                }
                part def Body :> PhysicalPart;
                part def Engine :> PhysicalPart {
                    part powerSocket;
                }
                part def PowerManagementSystem :> PhysicalPart {
                    part pmsSoftware : PMSSoftware;
                    part charger : Charger {
                        part powerSocket;
                    }
                }
                part def Charger :> PhysicalPart;
                part def PMSSoftware :> PhysicalPart;
                package <DBAT> DroneBattery {
                    package Configurations {
                        private import Core::*;
                        private import Variants::*;
                        variation part def BatteryVariations :> Battery {
                            variant part longDistanceBattery {
                                :>> cellPack = cellPackXXL;
                                :>> batteryManagementSystem = extendedBMS;
                            }
                            variant part standardBattery {
                                :>> cellPack = cellPackS;
                                :>> batteryManagementSystem = standardBMS;
                            }
                        }
                    }
                    package Core {
                        package <DBATSA> DroneBatterySystemArchitecture {
                            part def Battery :> PhysicalPart {
                                part cooling;
                                part batteryCase;
                                part cellPack : CellPack;
                                part batteryManagementSystem : BatteryManagementSystem;
                            }
                            part def CellPack :> PhysicalPart;
                            part def BatteryManagementSystem :> PhysicalPart;
                        }
                    }
                    package Variants {
                        variation part def CellPackVariations :> CellPack {
                            variant part cellPackS {
                                :>> mass = 300 [SI::gram];
                            }
                            variant part cellPackXXL {
                                :>> mass = 1000 [SI::gram];
                            }
                        }
                        variation part def BatteryManagementSystemVariations :> BatteryManagementSystem {
                            variant part standardBMS;
                            variant part extendedBMS;
                        }
                    }
                }
            }
        }
    }
}