package baylor.csi5324.careerbridge;

import com.tngtech.archunit.base.DescribedPredicate;
import com.tngtech.archunit.core.domain.JavaMethodCall;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import java.util.Set;

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
            .layer("Lifecycle").definedBy("..lifecycle..")
            .layer("Model").definedBy("..model..")
            .layer("Config").definedBy("..config..")
            .whereLayer("Controller").mayNotBeAccessedByAnyLayer()
            .whereLayer("Service").mayOnlyBeAccessedByLayers("Controller", "Config")
            .whereLayer("Repository").mayOnlyBeAccessedByLayers("Service", "Config")
            // Between Service and Model: services fire it, it changes entities, it never loads or saves
            .whereLayer("Lifecycle").mayOnlyBeAccessedByLayers("Controller", "Service", "Config")
            .whereLayer("Model").mayOnlyBeAccessedByLayers("Controller", "Service", "Repository", "Config", "Lifecycle");

    // Plain Java, so a transition is tested with `new` and no Spring context
    @ArchTest
    static final ArchRule lifecyclesArePlainJava = noClasses()
            .that().resideInAPackage("..lifecycle..")
            .should().dependOnClassesThat().resideInAnyPackage("org.springframework..", "jakarta..");

    // The lifecycle tables are the only way a state changes (spec/diagrams fig-03, fig-04)
    private static final Set<String> STATE_WRITERS = Set.of(
            "enterStage", "recordRejection", "recordWithdrawal",
            "enterStatus", "recordDecision", "recordClosing", "recordResponse", "revise");

    private static final Set<String> LIFECYCLE_ENTITIES = Set.of("Application", "JobPosting", "Offer");

    @ArchTest
    static final ArchRule onlyTheLifecycleChangesAState = noClasses()
            .that().resideOutsideOfPackages("..lifecycle..", "..model..")
            .should().callMethodWhere(DescribedPredicate.describe("a state writer of the model",
                    (JavaMethodCall call) -> LIFECYCLE_ENTITIES.contains(call.getTargetOwner().getSimpleName())
                            && STATE_WRITERS.contains(call.getName())));

    // Also catches @ResponseStatus on a service exception: the controller decides the status (design.md)
    @ArchTest
    static final ArchRule servicesKnowNothingOfHttp = noClasses()
            .that().resideInAnyPackage("..service..", "..repository..", "..model..")
            .should().dependOnClassesThat()
            .resideInAnyPackage("org.springframework.web..", "org.springframework.http..", "jakarta.servlet..");
}
