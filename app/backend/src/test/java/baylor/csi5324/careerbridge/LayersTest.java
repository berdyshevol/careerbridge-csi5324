package baylor.csi5324.careerbridge;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.Architectures.layeredArchitecture;

// spec/architecture.md "Backend layers" and spec/design.md: the review alone let these slip (SCRUM-253)
@AnalyzeClasses(packages = "baylor.csi5324.careerbridge", importOptions = ImportOption.DoNotIncludeTests.class)
class LayersTest {

    // config is not a layer of the specification: it wires the app and loads the sample data
    @ArchTest
    static final ArchRule aLayerCallsOnlyTheLayerBelow = layeredArchitecture()
            .consideringOnlyDependenciesInLayers()
            .layer("Controller").definedBy("..controller..")
            .layer("Service").definedBy("..service..")
            .layer("Repository").definedBy("..repository..")
            .layer("Model").definedBy("..model..")
            .layer("Config").definedBy("..config..")
            .whereLayer("Controller").mayNotBeAccessedByAnyLayer()
            .whereLayer("Service").mayOnlyBeAccessedByLayers("Controller", "Config")
            .whereLayer("Repository").mayOnlyBeAccessedByLayers("Service", "Config")
            .whereLayer("Model").mayOnlyBeAccessedByLayers("Controller", "Service", "Repository", "Config");

    // Also catches @ResponseStatus on a service exception: the controller decides the status (design.md)
    @ArchTest
    static final ArchRule servicesKnowNothingOfHttp = noClasses()
            .that().resideInAnyPackage("..service..", "..repository..", "..model..")
            .should().dependOnClassesThat()
            .resideInAnyPackage("org.springframework.web..", "org.springframework.http..", "jakarta.servlet..");
}
