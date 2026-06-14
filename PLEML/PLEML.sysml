//
// Product Line Engineering Modeling Language (PLEML)
//
// The library provides an extension for SysML v2 to model PLE features.
//
// Version: v0.8
// License: MIT
// Maintainer: Tim Weilkiens, Contact: tim@mbse4u.com, Marco Forlingieri, Vince Molnar
// Topic: MBSE, MBPLE, PLE, Methodology
//
// MIT License
//
// Copyright (c) 2026 Tim Weilkiens, Marco Forlingieri, Vince Molnar
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

library package PLEML {
    doc
    /* Definition of the Product Line Engineering Modeling Language (PLEML)
     *
     * PLEML is an extension for SysML v2 to enable the modeling of PLE Features.
     *
     *   PPPP   L     EEEEE  M   M  L
     *   P   P  L     E      MM MM  L
     *   PPPP   L     EEEE   M M M  L
     *   P      L     E      M   M  L
     *   P      LLLLL EEEEE  M   M  LLLLL
     *
     * Copyright 2026 Tim Weilkiens, Marco Forlingieri, Vince Molnar
     */
    private import SequenceFunctions::*;

    occurrence def FeatureModel {
        occurrence featureTrees[*] : FeatureTree;
        occurrence featureConfigurations : FeatureConfiguration [*];
    }
    abstract occurrence featureModels : FeatureModel [*];

    occurrence def FeatureConfiguration :> Feature {
        assert constraint :>> featureConstraints [*] {
            doc
            /* Assign the feature configuration to all feature constraints in the tree to enable their verification. */
            in occurrence :>> featureConfiguration = that;
        }
        assert constraint featureConfigurationOnlyOwnsFeatures {
            suboccurrences->ControlFunctions::forAll({in o; o istype Feature})
        }
        assert constraint nodeFeaturesAreSet {
            suboccurrences->ControlFunctions::forAll({
                in o;
                ((o meta SysML::OccurrenceUsage).owningUsage->SequenceFunctions::size() > 0 implies o != null)
                and ((o as Feature).bindingTime <= (this as FeatureConfiguration).bindingTime)
            })
        }
    }
    abstract occurrence featureConfigurations : FeatureConfiguration [*];

    occurrence def FeatureTree :> Feature {
        doc
        /* A Feature Tree is a tree structure that represents the features of a product line. */
    }
    abstract occurrence featureTrees : FeatureTree [*];

    occurrence def Feature {
        doc
        /* A Feature is a characteristic of a product in a product line
         * that distinguishes it from other products in the product line.
         */

        attribute externalRepresentation : ScalarValues::String default "" {
            doc /* Points to the origin of the feature, if this feature is only a proxy. */
        }
        derived attribute isAuthoritative : ScalarValues::Boolean = (externalRepresentation == "") {
            doc /* Derived attribute indicating if feature is authoritative or a proxy. */
        }

        attribute bindingTime : LifeCycleKind default LifeCycleKind::Development {
            doc
            /* The binding time of the feature with default Development. */
        }
        assert constraint featureConstraints : FeatureConstraint [*] {
            doc
            /* Set of all feature constraints owned by the feature. */
            in occurrence featureConfiguration;
            in occurrence :>> owningFeature = that;
        }
        assert constraint requiresFeatures : RequiresConstraint [*] :> featureConstraints {
            doc
            /* Set of REQUIRES constraints */
            in occurrence featureConfiguration;
            in occurrence owningFeature;
            in occurrence requiredFeatures :>> constrainedFeatures, requiredFeatures;
        }
        assert constraint xorFeatures : XORConstraint [*] :> featureConstraints {
            doc
            /* Set of XOR constraints (aka conflict constraints) */
            in occurrence featureConfiguration;
            in occurrence owningFeature;
            in occurrence excluded :>> constrainedFeatures, excluded;
        }
    }
    abstract occurrence features : Feature [0..*];
    occurrence featureSet : Feature;

    enum def LifeCycleKind :> ScalarValues::Natural {
        doc
        /* Definition of feature binding times. The numbers provide an order of the life cycles. */
        enum Development = 1;
        enum Production = 2;
        enum Operation = 3;
    }

    abstract constraint def FeatureConstraint {
        doc
        /* Common abstract definition of a feature constraint. */
        in occurrence featureConfiguration : FeatureConfiguration;
        in occurrence owningFeature : Feature;
        in occurrence constrainedFeatures : Feature [0..*];
    }

    constraint def RequiresConstraint :> FeatureConstraint {
        doc
        /* Definition of a REQUIRES constraint.
         *
         * Without a valid feature configuration,
         * no statement can be made and the constraint returns true.
         * With a valid feature configuration, it checks if the owning feature (=that)
         * is part of the feature configuration which implies that all requires features
         * must also be part of the feature configuration.
         */
        in occurrence featureConfiguration :>> featureConfiguration;
        in occurrence owningFeature :>> owningFeature;
        in occurrence requiredFeatures :>> constrainedFeatures;

        if featureConfiguration != null
            ?    featureConfiguration.suboccurrences->includes(owningFeature) implies
                featureConfiguration.suboccurrences->includes(requiredFeatures)
            else true
    }

    constraint def XORConstraint :> FeatureConstraint {
        doc
        /* Definition of a XOR constraint.
         *
         * Without a valid feature configuration, no statement can be made,
         * and the constraint returns true. With a valid feature configuration,
         * it checks if the owning feature (=that) is part of the feature configuration,
         * which implies that all excluded features shall not be part of the feature configuration.
         */
        in occurrence featureConfiguration :>> featureConfiguration;
        in occurrence owningFeature :>> owningFeature;
        in occurrence excluded :>> constrainedFeatures;

        if featureConfiguration != null
            ?    featureConfiguration.suboccurrences->includes(owningFeature) implies
                (1..(size(excluded) - 1))->ControlFunctions::forAll {
                    in f;
                    not featureConfiguration.suboccurrences->includes(f)
                }
            else true
    }

    //
    // Semantic Metadata for user-defined keywords
    //
    metadata def <featureModel> FeatureModelMetadata :> Metaobjects::SemanticMetadata {
        :>> baseType = featureModels meta SysML::Type;
        :> annotatedElement : SysML::OccurrenceDefinition;
        :> annotatedElement : SysML::OccurrenceUsage;
    }
    metadata def <featureTree> FeatureTreeMetadata :> Metaobjects::SemanticMetadata {
        :>> baseType = featureTrees meta SysML::Type;
        :> annotatedElement : SysML::OccurrenceDefinition;
        :> annotatedElement : SysML::OccurrenceUsage;
    }
    metadata def <feature> FeatureMetadata :> Metaobjects::SemanticMetadata {
        :>> baseType = features meta SysML::Type;
        :> annotatedElement : SysML::OccurrenceDefinition;
        :> annotatedElement : SysML::OccurrenceUsage;
    }
    metadata def <featureConfiguration> FeatureConfigurationMetadata
        :> Metaobjects::SemanticMetadata {
        :>> baseType = featureConfigurations meta SysML::Type;
        :> annotatedElement : SysML::OccurrenceDefinition;
        :> annotatedElement : SysML::OccurrenceUsage;
    }
    metadata def <FB> FeatureBinding {
        attribute featureName : ScalarValues::String default := DeriveFeatureName(annotatedElement);
        attribute featureModel : ScalarValues::String;
    }
    metadata def <FCFGB> FeatureConfigurationBinding :> FeatureBinding {
        attribute featureConfiguration :>> featureName;
    }
    calc def DeriveFeatureName {
        in ref annotatedElements [*];
        ref firstAnnotatedElement = annotatedElements#(1);
        ref firstDependencySupplier = (firstAnnotatedElement meta SysML::Dependency).supplier#(1);
        occurrence feature = firstDependencySupplier meta SysML::OccurrenceUsage;
        return : ScalarValues::String;
        feature.name ?? ""
    }
} // library package <PLEML> ProductLineEngineeringModelingLanguage
