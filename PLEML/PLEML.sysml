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

library package <PLEML> 'Product Line Engineering Modeling Language' {
    doc /*
         * Definition of the Product Line Engineering Modeling Language (PLEML)
         * 
         * PLEML is an extension for SysML v2 to enable the modeling of PLE Features.
         * 
         * Copyright 2024 Tim Weilkiens, Marco Forlingieri, Vince Molnar
         * 
         */
    private import CollectionFunctions::*;   

    occurrence def FeatureConfiguration {
        doc /*
             * A Feature Configuration specifies a valid selection of features 
             * in a feature tree for a member product of the product line.
             */
        bind selection.featureConstraints.featureConfiguration = self; // sets the current feature configuration
        occurrence selection : Feature {
            doc /* The root feature of the feature tree with selected features. */
            assert constraint :>> featureConstraints[*] {
                doc /* Assign the feature configuration to all feature constraints 
                     * in the tree to enable their verification 
                     */
            }
        }

    }
    occurrence featureConfigurations[*] : FeatureConfiguration {
        doc /* The pleFeatureConfigurations bundles all feature configurations of the model. */
    }

    occurrence def Feature {
        doc /* 
            * A Feature is a characteristic of a product in a product line 
            * that distinguishes it from other products in the product line.
            */

        occurrence subFeatures[*] : Feature = suboccurrences {
            assert constraint :>> featureConstraints {
                // handover the feature configuration to the feature constraints of the subitems
                in featureConfiguration = featureConstraints.featureConfiguration;
            }

        }
        attribute bindingTime : LifeCycleKind default LifeCycleKind::Development {
            doc /* The binding time of the feature. */
        }
        attribute isEnd : ScalarValues::Boolean = subFeatures->isEmpty() {
            doc /* Indicates whether the feature is a leaf of the tree (=true) or a node (=false). */
        }

        assert constraint featureConstraints[*] : FeatureConstraint {
            doc /* Set of all feature constraints of the feature. */
        }
        assert constraint {
            doc /* All subitems of a feature shall be typed by PLEFeature. */
            subFeatures->ControlFunctions::forAll{ in i; i istype Feature}
        }
        
    }
    occurrence features[0..*] : Feature {
        doc /* The pleFeatures bundles all features of the model. */
    }

    enum def LifeCycleKind :> ScalarValues::Natural {
        doc /* Definition of feature binding times. 
             * The numbers provides an order of the life cycles.
             */
        enum Development = 1;
        enum Production = 2;
        enum Operation = 3;
    }

    constraint def FeatureConstraint {
        doc /* Common definition of a feature constraint. 
             * 
             * The owning feature of the feature constraint is not part of 
             * constrainedFeatures.
             */
        in occurrence featureConfiguration[0..1]: FeatureConfiguration;
        in occurrence constrainedFeatures[1..*]: Feature;
        true
    }

    constraint def RequiresConstraint :> FeatureConstraint {
        in requiredFeatures :> constrainedFeatures;
        featureConfiguration.suboccurrences->contains(self) 
            implies featureConfiguration.suboccurrences->containsAll(requiredFeatures)       
    }
    constraint requiresConstraints[*] : RequiresConstraint;

    constraint def XORConstraint :> FeatureConstraint {
        in xorFeatures :> constrainedFeatures;
        featureConfiguration.selection.suboccurrences->contains(self) 
            implies (1..size(xorFeatures)-1)->ControlFunctions::forAll { 
                in f; not featureConfiguration.selection.suboccurrences->contains(f) 
            }
    }
    constraint xorConstraints[*] : XORConstraint;

    connection def FeatureBinding {
        doc /* Binds a feature to one or more shared assets. */
        end pleFeature : Feature;
        end sharedAsset[1..*] : Base::Anything;
    }
    abstract connection featureBindings[*] : FeatureBinding {
        doc /* The connection usage featureBindings bundles all feaure bindings of the model. */
    }

    //
    // Semantic Metadata for user-defined keywords
    //
    metadata def <feature> FeatureMetadata :> Metaobjects::SemanticMetadata {
        :>> baseType = features meta SysML::OccurrenceUsage;
    }

    metadata def <featureConfiguration> FeatureConfigurationMetadata :> Metaobjects::SemanticMetadata {
        :>> baseType = featureConfigurations meta SysML::OccurrenceUsage;
    }

    metadata def <requiresFeatures> RequiresConstraintMetadata :> Metaobjects::SemanticMetadata {
        :>> baseType = requiresConstraints meta SysML::ConstraintUsage;
    }

    metadata def <xorFeatures> XORConstraintMetadata :> Metaobjects::SemanticMetadata {
        :>> baseType = xorConstraints meta SysML::ConstraintUsage;
    }   

    metadata def <featureBinding> FeatureBindingMetadata :> Metaobjects::SemanticMetadata {
        :>> baseType = featureBindings meta SysML::ConnectionUsage;
    }   
}